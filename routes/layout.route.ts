import express from 'express';
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from '../controllers/layout.controller';
import { authorizedRoles, isAuthenticated } from '../utils/auth';
const router = express.Router();

router.post(
  '/create-layout',
  isAuthenticated,
  authorizedRoles('admin'),
  createLayout,
);

router.patch(
  '/edit-layout',
  isAuthenticated,
  authorizedRoles('admin'),
  editLayout,
);

router.get('/get-layout', getLayoutByType);

export default router;
