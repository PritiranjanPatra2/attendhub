import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updateStatus,
  checkIn,
  checkOut,
  getTeam,
  isAuth,
  getEmployeeById
} from '../controllers/authController.js';
import upload from '../configs/upload.js';

const router = express.Router();

router.post('/register', upload.single('photo'), register);
router.post('/login', login);

router.use(isAuth);
router.get('/me', getProfile);
router.put('/me', upload.single('photo'), updateProfile);
router.patch('/status', updateStatus);
router.post('/checkin', checkIn);
router.get('/employee/:id', getEmployeeById);
router.post('/checkout', checkOut);
router.get('/team', getTeam);


export default router;
