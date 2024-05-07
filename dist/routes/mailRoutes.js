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
const uuid_1 = require("uuid");
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
            return res.status(401).json({
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
        const recipientId = (0, uuid_1.v4)();
        const emailContent = `Content-Type: text/html; charset="UTF-8"\nMIME-Version: 1.0\nContent-Transfer-Encoding: 7bit\nto: ${mailRecipient}\nsubject: ${mailSubject}\n\n<html><body>${mailBody}<img src="http://localhost:3000/mail/track/${recipientId}" alt="" style="display:none;"></body></html>`;
        const encodedMessage = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const sendResponse = yield gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        if (!sendResponse || !sendResponse.data.id) {
            return res.status(500).json({
                status: "failed",
                message: "problem in sending the mail"
            });
        }
        const savedEmail = yield prisma.email.create({
            data: {
                subject: mailSubject,
                body: mailBody,
                userId: userId,
                receipent: mailRecipient,
                emailId: sendResponse.data.id,
                recipientId: recipientId,
            },
        });
        res.status(200).json({
            status: "success",
            message: "Email sent and saved successfully",
            emailDetails: savedEmail,
        });
    }
    catch (err) {
        return res.status(500).json({
            status: "failed",
            message: "This one's on us.",
        });
    }
}));
router.get("/:id/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const emailId = req.params.id;
    try {
        if (!userId) {
            return res.status(400).json({
                status: "failed",
                message: "Send all details"
            });
        }
        const user = yield prisma.user.findUnique({
            where: {
                id: parseInt(userId),
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
        oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
        const thread = yield gmail.users.threads.get({
            userId: 'me',
            id: emailId,
        });
        let messageStatus = false;
        if (thread.data.messages && thread.data.messages.length > 1) {
            yield prisma.email.update({
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
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            status: "failed",
            message: "This one's on us.",
        });
    }
}));
router.get("/track/:recipientId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { recipientId } = req.params;
    try {
        const updateResult = yield prisma.email.update({
            where: {
                recipientId
            },
            data: {
                opened: true
            }
        });
        if (!updateResult) {
            return res.status(404).json({
                status: "failed",
                message: "wrong id"
            });
        }
        const imgBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': imgBuffer.length,
        });
        res.end(imgBuffer);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            status: "failed",
            message: "This one's on us.",
        });
    }
}));
