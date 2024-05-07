"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleRoutes = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("../config/passport"));
const router = (0, express_1.Router)();
exports.GoogleRoutes = router;
router.get('/', passport_1.default.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.modify'],
    accessType: 'offline',
    prompt: 'consent'
}));
router.get('/callback', passport_1.default.authenticate('google', { failureRedirect: '/login' }), (_, res) => {
    res.redirect('/');
});
