import express, { Router } from 'express';
import { authorizedRoles, isAuthenticated } from '../utils/auth';
import { createOrder, getAllOrders } from '../controllers/order.controller';
const router: Router = express.Router();

router.post('/create-order', isAuthenticated, createOrder);
router.get(
  '/get-orders',
  isAuthenticated,
  authorizedRoles('admin'),
  getAllOrders,
);

export default router;
