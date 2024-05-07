import express, { Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { GoogleRoutes } from "./routes/googleRoutes";
import session from "express-session";
import { mailRouter } from "./routes/mailRoutes";

const app = express();
const prisma = new PrismaClient();

dotenv.config();
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
  })
);

async function checkPrismaConnection() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to the database', error);
  }
}

checkPrismaConnection();

app.use("/auth/google", GoogleRoutes)
app.use("/mail", mailRouter)

app.get('/', (_, res: Response) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

