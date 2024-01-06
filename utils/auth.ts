import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from './ErrorHandler';
import { redis } from './redis';

// authenticated user
export const isAuthenticated = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return next(
        new ErrorHandler('Please login to access this resource', 401),
      );
    }

    const decoded = jwt.verify(
      accessToken,
      (process.env.ACCESS_TOKEN as Secret) || '',
    );

    if (!decoded) {
      return next(new ErrorHandler('access token is not valid', 400));
    }

    const user = await redis.get((decoded as JwtPayload).id);

    if (!user) {
      return next(new ErrorHandler('user not found', 400));
    }

    req.user = JSON.parse(user);
    next();
  },
);

// validate user
export const authorizedRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          403,
        ),
      );
    }
    next();
  };
};
