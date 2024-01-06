import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandler';
import layoutModel from '../models/layout.model';
import { catchAsyncError } from '../middleware/catchAsyncError';
import cloudinary from 'cloudinary';

//create layout
export const createLayout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      const isTypeExist = await layoutModel.findOne({
        type: type.toLowerCase(),
      });
      if (isTypeExist) {
        return next(new ErrorHandler(`${type} already exists`, 400));
      }
      if ((type as string).toLowerCase() === 'banner') {
        const { image, title, subTitle } = req.body;
        if (!image || !title || !subTitle) {
          return next(new ErrorHandler('Please provide all fields', 400));
        }
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: 'layout',
        });
        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        };
        await layoutModel.create(banner);
      }
      if ((type as string).toLowerCase() === 'faq') {
        const { faq } = req.body;
        const faqItems = await Promise.all(
          faq.map(async (item: { question: string; answer: string }) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          }),
        );
        await layoutModel.create({
          type: 'faq',
          faq: faqItems,
        });
      }

      if ((type as string).toLowerCase() === 'categories') {
        const { categories } = req.body;
        const categoryItems = await Promise.all(
          categories.map(async (item: { title: string }) => {
            return {
              title: item.title,
            };
          }),
        );
        await layoutModel.create({
          type: 'categories',
          category: categoryItems,
        });
      }
      res.status(200).json({
        success: true,
        message: 'Layout created successfully',
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// edit layout
export const editLayout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      if ((type as string).toLowerCase() === 'banner') {
        const bannerData: any = await layoutModel.findOne({
          type: 'banner',
        });
        const { image, title, subTitle } = req.body;
        if (!image || !title || !subTitle) {
          return next(new ErrorHandler('Please provide all fields', 400));
        }
        await cloudinary.v2.uploader.destroy(bannerData?.image?.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: 'layout',
        });
        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        };
        await layoutModel.findOneAndUpdate(bannerData?._id, { banner });
      }
      if ((type as string).toLowerCase() === 'faq') {
        const { faq } = req.body;
        const faqItem = await layoutModel.findOne({
          type: 'faq',
        });
        const faqItems = await Promise.all(
          faq.map(async (item: { question: string; answer: string }) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          }),
        );
        await layoutModel.findByIdAndUpdate(faqItem?._id, { faq: faqItems });
      }

      if ((type as string).toLowerCase() === 'categories') {
        const { categories } = req.body;
        const categoriesData = await layoutModel.findOne({
          type: 'categories',
        });
        const categoryItems = await Promise.all(
          categories.map(async (item: { title: string }) => {
            return {
              title: item.title,
            };
          }),
        );
        await layoutModel.findByIdAndUpdate(categoriesData?._id, {
          category: categoryItems,
        });
      }
      res.status(200).json({
        success: true,
        message: 'Layout updated successfully',
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// get layout by type
export const getLayoutByType = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const layout = await layoutModel.findOne({ type });
      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);
