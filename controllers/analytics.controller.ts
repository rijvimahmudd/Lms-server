import { catchAsyncError } from '../middleware/catchAsyncError';
import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandler';
import { generateLast12MonthsData } from '../utils/analytics.generator';
import userModel from '../models/user.model';
import courseModel from '../models/course.model';
import orderModel from '../models/order.model';

// user analytics
export const getUserAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData(userModel);
      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// course analytics
export const getCourseAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthsData(courseModel);
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// order analytics
export const getOrderAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthsData(orderModel);
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);
