import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
export const app = express();
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errorMiddleware } from './middleware/error';
import userRouter from './routes/user.route';
import courseRouter from './routes/course.route';
import orderRouter from './routes/order.route';
import notificationRouter from './routes/notification.route';
import analyticsRouter from './routes/analytics.route';
import layoutRouter from './routes/layout.route';

export interface CustomError extends Error {
  statusCode: number;
  code?: number;
  path?: string;
  keyValue?: string;
}

// cookie parser
app.use(cookieParser());

// body parser
app.use(express.json({ limit: '50mb' }));

// router
app.use(
  '/api/v1',
  userRouter,
  notificationRouter,
  courseRouter,
  orderRouter,
  analyticsRouter,
  layoutRouter,
);

// cors => cross origin resource sharing
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  }),
);

// testing route
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.get('/', (_req: Request, res: Response, _next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: 'Server is up & running',
  });
});

// unknown routes
app.use('*', (req: Request, _res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  (err as CustomError).statusCode = 404;
  next(err);
});

// error handler
app.use(errorMiddleware);
