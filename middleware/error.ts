import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utlis/ErrorHandler";

export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server Error";

  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }
  // JWT error and expired error
  if (err.name === "JsonWebTokenError") {
    const message = `Json web token is invalid , try again`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === "JsonExpiredError") {
    const message = `Json web token is expired , try again`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === "jwt expired") {
    const message = `Json web token is expired , try again`;
    err = new ErrorHandler(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
