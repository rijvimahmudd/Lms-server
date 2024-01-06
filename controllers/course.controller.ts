import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/ErrorHandler';
import { v2 as cloudinary } from 'cloudinary';
import { createCourse, getAllCoursesService } from '../services/course.service';
import courseModel, {
  IComment,
  ICourse,
  ICourseData,
} from '../models/course.model';
import NotificationModel from '../models/notification.model'; // NotificationModel
import { redis } from '../utils/redis';
import mongoose from 'mongoose';
import { IUser } from '../models/user.model';
import path from 'path';
import ejs from 'ejs';
import sendMail from '../utils/sendMail';

// upload course
export const uploadCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: ICourse = req.body;

      // thumbnail pass from front-end as string and return it as object with necessary properties
      const thumbnail = data.thumbnail;
      if (thumbnail && typeof thumbnail === 'string') {
        const myCloud = await cloudinary.uploader.upload(thumbnail, {
          upload_preset: 'courses',
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        } as {
          public_id: string;
          url: string;
        };
      }
      createCourse(data, res);
    } catch (error: unknown) {
      next(new ErrorHandler((error as Error).message, 500));
    }
  },
);

// edit course
export const editCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        await cloudinary.uploader.destroy(thumbnail.public_id);
        const myCloud = await cloudinary.uploader.upload(thumbnail, {
          upload_preset: 'courses',
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const courseId = req.params.id;
      if (courseId) {
        const course = await courseModel.findByIdAndUpdate(
          courseId,
          { $set: data },
          {
            new: true,
          },
        );
        res.status(201).json({
          success: true,
          course,
        });
      }
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// get single course  ---without-purchase
interface ICourseDataMod {
  title: string;
  description: string;
}
export const getSingleCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCachedExist = await redis.get(courseId);
      if (isCachedExist) {
        const course = JSON.parse(isCachedExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await courseModel.findById(req.params.id);

        if (course) {
          const courseData: ICourseDataMod[] = course?.courseData.map(
            (item: ICourseData) => {
              return {
                title: item.title,
                description: item.description,
              };
            },
          );

          course.courseData = courseData as ICourseData[];
        }

        await redis.set(
          courseId,
          JSON.stringify(course),
          'EX',
          60 * 60 * 24 * 7,
        );
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// get all courses --- without purchasing

export const getAllCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCachedExist = await redis.get('allCourses');
      if (isCachedExist) {
        const courses = JSON.parse(isCachedExist);
        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await courseModel
          .find()
          .select(
            '-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links -__v',
          );
        await redis.set('allCourses', JSON.stringify(courses));
        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

//get all courses --- only for valid user
export const getCourseByUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const courseExist = userCourseList?.find(
        (item: unknown | ICourseData): boolean => {
          return (item as unknown as ICourseData)._id.toString() === courseId;
        },
      );

      if (!courseExist) return next(new ErrorHandler('Course not found', 404));

      const course = await courseModel.findById(courseId);
      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      const course = await courseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Content not found', 404));
      }

      const courseContent = course?.courseData.find(
        (item: ICourseData) => item._id.toString() === contentId,
      );
      if (!courseContent) {
        return next(new ErrorHandler('Content not found', 404));
      }

      // create a new question object
      const newQuestion: IComment = {
        user: req.user,
        question,
        questionReplies: [] as IComment[],
      };

      courseContent.question.push(newQuestion);

      await NotificationModel.create({
        user: req.user?._id,
        title: 'New Question Added',
        message: `A new question has been added to your course ${courseContent?.title}`,
      });
      // save the updated course
      await course?.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// add answer in course question
interface IAddAnswerData {
  answer: string;
  questionId: string;
  contentId: string;
  courseId: string;
}

export const addAnswer = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, questionId, contentId, courseId }: IAddAnswerData =
        req.body;
      const course = await courseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Content not found', 404));
      }

      const courseContent = course?.courseData.find(
        (item: ICourseData) => item._id.toString() === contentId,
      );

      if (!courseContent) {
        return next(new ErrorHandler('Content not found', 404));
      }

      const question = courseContent.question.find(
        (item: IComment) => item._id.toString() === questionId,
      );

      if (!question) {
        return next(new ErrorHandler('Question not found', 404));
      }

      // create a new answer object
      const newAnswer: {
        user: IUser;
        answer: string;
      } = {
        user: req.user,
        answer,
      };

      question.questionReplies?.push(newAnswer);

      await course?.save();

      if (req.user?._id === question.user._id) {
        // create a notification
        await NotificationModel.create({
          user: req.user?._id,
          title: 'New question reply added',
          message: `A new reply has been added to your question ${courseContent.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        await ejs.renderFile(
          path.join(__dirname, '../mail-template/reply.ejs'),
          data,
        );

        await sendMail({
          email: question.user.email,
          subject: 'New Answer',
          template: 'notification.ejs',
          data: {
            name: question.user.name,
            title: courseContent.title,
          },
        });
      }
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// add review on course
interface IAddReview {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req?.user?.courses;
      const courseId = req.params.id;

      // check if the courseId already exist in userCourseList based on _id
      const courseExist = userCourseList.some(
        (course: any) => course._id.toString() === courseId,
      );

      if (!courseExist) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 404),
        );
      }

      const course = await courseModel.findById(courseId);
      const { review, rating }: IAddReview = req.body;
      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };

      if (course) {
        course?.reviews.push(reviewData);
      }

      let avg = 0;
      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.ratings = avg / course?.reviews.length;
      }

      await course?.save();

      const notification = {
        title: 'new review received',
        message: `${req.user?.name} has reviewed your course ${course?.name}`,
      };

      // create notification
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// add reply in review
interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId }: IAddReviewData = req.body;
      const course = await courseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }
      const review = course?.reviews.find(
        (item: any) => item._id.toString() === reviewId,
      );

      if (!review) {
        return next(new ErrorHandler('Review not found', 404));
      }

      const replyDAta: any = {
        user: req.user,
        comment,
      };
      if (!review.commentReplies) {
        review.commentReplies = [];
      }
      review.commentReplies?.push(replyDAta);
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// get all courses --only for admin
export const getAllCoursesAdmin = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);

// delete course -- admin
export const deleteCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const course = await courseModel.findById(id);
      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }
      await course.deleteOne({ id });
      await redis.del(id);
      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error: unknown) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  },
);
