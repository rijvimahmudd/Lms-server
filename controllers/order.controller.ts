import { NextFunction, Request, Response } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/ErrorHandler';
import { IOrder } from '../models/order.model';
import User from '../models/user.model';
import Course from '../models/course.model';
import { getAllOrdersService, newOrder } from '../services/order.service';
import ejs from 'ejs';
import path from 'node:path';
import sendMail from '../utils/sendMail';
import Notification from '../models/notification.model';

export const createOrder = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder;
      const user = await User.findById(req.user._id);

      const courseExist = user?.courses.some(
        (course: any) => course._id.toString() === courseId,
      );

      if (courseExist) {
        return next(new ErrorHandler('Course already purchased', 400));
      }

      const course = await Course.findById(courseId);

      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }

      const data = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      const mailData = {
        order: {
          _id: course._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
      };

      await ejs.renderFile(
        path.join(__dirname, '../mail-template/order-confirmation.ejs'),
        mailData,
      );

      if (user) {
        await sendMail({
          email: user.email,
          subject: 'Order Confirmation',
          template: 'order-confirmation.ejs',
          data: {
            mailData,
          },
        });
      }

      user?.courses.push(course._id);
      await user?.save();

      // await Notification.create({
      //   user: user?._id || '',
      //   title: 'New Order',
      //   message: `You have a new order from ${course?.name}`,
      // });
      console.log(course);

      if (course) {
        (course.purchased as number) += 1;
      }

      await course?.save();
      newOrder(data, res, next);
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// get all orders --only for admin
export const getAllOrders = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);
