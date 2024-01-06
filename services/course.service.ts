import { Response } from 'express';
import Course, { ICourse } from '../models/course.model';
import courseModel from '../models/course.model';

// create course
export const createCourse = async (data: ICourse, res: Response) => {
  const course = await Course.create(data);
  res.status(201).json({
    success: true,
    course,
  });
};

// get all Courses
export const getAllCoursesService = async (res: Response) => {
  const courses = await courseModel.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    courses,
  });
};
