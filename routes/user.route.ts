import express, { Router } from 'express';
import {
  activateUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAccessToken,
  updateAvatar,
  updatePassword,
  updateUserInfo,
  updateUserRole,
} from '../controllers/user.controller';
import { authorizedRoles, isAuthenticated } from '../utils/auth';
const router: Router = express.Router();

router.get('/logout', isAuthenticated, logoutUser);

router.post('/registration', registrationUser);

router.post('/activate-user', activateUser);

router.post('/login', loginUser);

router.get('/refresh-token', updateAccessToken);

router.get('/me', isAuthenticated, getUserInfo);

router.post('/social-auth', socialAuth);

router.patch('/update-user-info', isAuthenticated, updateUserInfo);

router.patch('/update-user-password', isAuthenticated, updatePassword);

router.patch('/update-user-avatar', isAuthenticated, updateAvatar);
router.get(
  '/get-users',
  isAuthenticated,
  authorizedRoles('admin'),
  getAllUsers,
);
router.patch(
  '/update-user-role',
  isAuthenticated,
  authorizedRoles('admin'),
  updateUserRole,
);
router.delete(
  '/delete-user/:id',
  isAuthenticated,
  authorizedRoles('admin'),
  deleteUser,
);

export default router;
