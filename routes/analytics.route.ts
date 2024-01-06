import express from 'express';
import { authorizedRoles, isAuthenticated } from '../utils/auth';
import {
  getCourseAnalytics,
  getOrderAnalytics,
  getUserAnalytics,
} from '../controllers/analytics.controller';
const router = express.Router();

router.get(
  '/get-users-analytics',
  isAuthenticated,
  authorizedRoles('admin'),
  getUserAnalytics,
);
router.get(
  '/get-courses-analytics',
  isAuthenticated,
  authorizedRoles('admin'),
  getCourseAnalytics,
);
router.get(
  '/get-orders-analytics',
  isAuthenticated,
  authorizedRoles('admin'),
  getOrderAnalytics,
);

export default router;
