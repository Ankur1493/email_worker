"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const googleapis_1 = require("googleapis");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
exports.mailRouter = router;
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, mailBody, mailSubject, mailRecipient } = req.body;
    if (!userId || !mailRecipient || !mailSubject || !mailBody) {
        return res.status(400).json({
            status: "failed",
            message: "enter all fields"
        });
    }
    try {
        const user = yield prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        const accessToken = user === null || user === void 0 ? void 0 : user.accessToken;
        const refreshToken = user === null || user === void 0 ? void 0 : user.refreshToken;
        if (!accessToken || !refreshToken) {
            return res.status(400).json({
                status: "failed",
                message: "You are not authorized. Try to login again.",
            });
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
        const emailContent = `Content-Type: text/html; charset="UTF-8"\nMIME-Version: 1.0\nContent-Transfer-Encoding: 7bit\nto: ${mailRecipient}\nsubject: ${mailSubject}\n\n<html><body>${mailBody}<img src="https://yourserver.com/tracking.gif?emailId=UNIQUE_EMAIL_ID" alt="" style="display:none;"></body></html>`;
        const encodedMessage = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const sendResponse = yield gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        if (!sendResponse) {
            return res.status(400).json({
                status: "failed",
                message: "problem in sending the mail"
            });
        }
        const savedEmail = yield prisma.email.create({
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
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            status: "failed",
            message: "This one's on us.",
        });
    }
}));