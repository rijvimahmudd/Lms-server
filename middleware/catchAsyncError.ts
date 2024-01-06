import { NextFunction, Request, Response } from 'express';

type fun = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const catchAsyncError = (fn: fun): fun => {
  return (req: Request, res: Response, next: NextFunction) => {
    return fn(req, res, next).catch(next);
  };
};
