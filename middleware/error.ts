import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/ErrorHandler';
import { CustomError } from '../app';

export const errorMiddleware = (
  err: CustomError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // wrong mongodb id
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue || {})} entered`;
    err = new ErrorHandler(message, 400);
  }

  //wrong jwt error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new ErrorHandler(message, 401);
  }

  // jwt expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = new ErrorHandler(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
