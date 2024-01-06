import { NextFunction, Request, Response } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncError';
import Notification from '../models/notification.model';
import ErrorHandler from '../utils/ErrorHandler';
import cron from 'node-cron';

// get all notifications -- only admin
export const getNotifications = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await Notification.find().sort({ createdAt: -1 });
      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// update notification status -- only admin

export const updateNotification = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const notification = await Notification.findById(req.params.id);
    if (notification && notification.status) {
      notification.status = 'read';
    } else {
      return next(new ErrorHandler('Notification not found', 404));
    }

    await notification?.save();

    // sending the all updated notifications
    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      notifications,
    });
  },
);

// delete notification
cron.schedule('0 0 0 * * *', async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Notification.deleteMany({
    status: 'read',
    createdAt: {
      $lt: thirtyDaysAgo,
    },
  });
  console.log('deleted 30 days old and read notifications');
});
