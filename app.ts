require("dotenv").config();
import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import mocsRouter from "./routes/moocs.route";
import adminRouter from "./routes/admin.route";
import marRouter from "./routes/mar.route";
import { rateLimit } from "express-rate-limit";

app.use(express.json({ limit: "50mb" }));

app.use(cookieParser());

//cors = cross origin resource sharing
app.use(
  cors({
    origin: "https://hit-cse-ds.vercel.app",
    credentials: true,
  })
);

// api request limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api/v2", userRouter);
app.use("/api/v2", mocsRouter);
app.use("/api/v2", adminRouter);
app.use("/api/v2", marRouter);

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

//unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// middleware calls
app.use(limiter);
app.use(ErrorMiddleware);
