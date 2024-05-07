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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const googleRoutes_1 = require("./routes/googleRoutes");
const express_session_1 = __importDefault(require("express-session"));
const mailRoutes_1 = require("./routes/mailRoutes");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
dotenv_1.default.config();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));
function checkPrismaConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.$connect();
            console.log('Database connected successfully');
        }
        catch (error) {
            console.error('Failed to connect to the database', error);
        }
    });
}
checkPrismaConnection();
app.use("/auth/google", googleRoutes_1.GoogleRoutes);
app.use("/mail", mailRoutes_1.mailRouter);
app.get('/', (_, res) => {
    res.send('Hello World!');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
