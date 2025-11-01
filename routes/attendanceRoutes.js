// routes/attendanceRoutes.js
import express from 'express';
import { isAuth } from '../controllers/authController.js';
import { markAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

router.use(isAuth);
router.post('/mark', markAttendance); // POST /api/attendance/mark
router.get('/me', getMyAttendance);

export default router;