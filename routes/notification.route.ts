import express from 'express';
import { authorizedRoles, isAuthenticated } from '../utils/auth';
import {
  getNotifications,
  updateNotification,
} from '../controllers/notification.controller';
const router = express.Router();

router.get(
  '/get-all-notifications',
  isAuthenticated,
  authorizedRoles('admin'),
  getNotifications,
);

router.patch(
  '/update-notification/:id',
  isAuthenticated,
  authorizedRoles('admin'),
  updateNotification,
);
export default router;
