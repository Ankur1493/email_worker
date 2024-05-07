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
    if (!sendResponse) {
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
        receipent: mailRecipient
      },
    });

    res.status(200).json({
      status: "success",
      message: "Email sent and saved successfully",
      emailDetails: savedEmail,
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

