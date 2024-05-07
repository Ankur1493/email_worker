import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import { google } from "googleapis";

const prisma = new PrismaClient();
const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { userId, mailBody, mailSubject, mailRecipient } = req.body;

  if (!userId || !mailRecipient || !mailSubject || !mailBody) {
    return res.status(400).json({
      status: "failed",
      message: "enter all fields"
    })
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const accessToken = user?.accessToken;
    const refreshToken = user?.refreshToken;

    if (!accessToken || !refreshToken) {
      return res.status(400).json({
        status: "failed",
        message: "You are not authorized. Try to login again.",
      });
    }

    const oauth2Client = new google.auth.OAuth2();

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const emailContent = `Content-Type: text/html; charset="UTF-8"\nMIME-Version: 1.0\nContent-Transfer-Encoding: 7bit\nto: ${mailRecipient}\nsubject: ${mailSubject}\n\n<html><body>${mailBody}<img src="https://yourserver.com/tracking.gif?emailId=UNIQUE_EMAIL_ID" alt="" style="display:none;"></body></html>`;

    const encodedMessage = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const sendResponse = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    if (!sendResponse || !sendResponse.data.id) {
      return res.status(400).json({
        status: "failed",
        message: "problem in sending the mail"
      })
    }

    const savedEmail = await prisma.email.create({
      data: {
        subject: mailSubject,
        body: mailBody,
        userId: userId,
        receipent: mailRecipient,
        emailId: sendResponse.data.id
      },
    });

    res.status(200).json({
      status: "success",
      message: "Email sent and saved successfully",
      emailDetails: savedEmail,
    });
  } catch (err) {
    return res.status(500).json({
      status: "failed",
      message: "This one's on us.",
    });
  }
});

router.get("/:id/:userId", async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const emailId = req.params.id as string;

  try {
    if (!userId) {
      return res.status(400).json({
        status: "failed",
        message: "Send all details"
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    const accessToken = user?.accessToken;
    const refreshToken = user?.refreshToken;

    if (!accessToken || !refreshToken) {
      return res.status(400).json({
        status: "failed",
        message: "You are not authorized. Try to login again.",
      });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: emailId,
    });

    let messageStatus = false;
    if (thread.data.messages && thread.data.messages.length > 1) {
      await prisma.email.update({
        where: {
          emailId: emailId
        },
        data: {
          replied: true,
        },
      });
      messageStatus = true;
    }

    return res.status(200).json({
      status: "success",
      replied: messageStatus
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "failed",
      message: "This one's on us.",
    });
  }
});

export { router as mailRouter };

