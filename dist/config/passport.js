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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, cb) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
    if (!email) {
        return cb(new Error('Google account has no email'));
    }
    console.log(`refresh ---- ${refreshToken}`);
    console.log(`access ------ ${accessToken}`);
    try {
        let user = yield prisma.user.findUnique({
            where: {
                email: email,
            },
        });
        if (user) {
            user = yield prisma.user.update({
                where: { email: email },
                data: { accessToken: accessToken },
            });
        }
        else {
            user = yield prisma.user.create({
                data: {
                    email: email,
                    name: profile.displayName,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                },
            });
        }
        return cb(null, user);
    }
    catch (error) {
        return cb(error);
    }
})));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id); // Serialize user by ID
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
}));
exports.default = passport_1.default;
