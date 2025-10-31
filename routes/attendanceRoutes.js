// routes/attendanceRoutes.js
import express from 'express';
import { isAuth } from '../controllers/authController.js';
import { getMyAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

// Protect all attendance routes
router.use(isAuth);

// GET: /api/attendance/me?month=2025-10
router.get('/me', getMyAttendance);

export default router;