import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';
import Attendance from '../models/Attendance.js';
import { getDistance } from 'geolib';

const OFFICE_LAT = parseFloat(process.env.OFFICE_LAT);
const OFFICE_LNG = parseFloat(process.env.OFFICE_LNG);
const OFFICE_RADIUS = 100; // meters

// Helper: Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// REGISTER
export const register = async (req, res) => {
  try {
    const { email, password, name, phone, department } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let photoURL = null;
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'attendance-app/users',
        transformation: [{ width: 400, height: 400, crop: 'limit' }],
      });
      photoURL = result.secure_url;
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || null,
      department: department || 'Full Stack Developer',
      photoURL,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          department: user.department,
          photoURL: user.photoURL,
          role: user.role,
          status: user.status,
          statusUpdatedAt: user.statusUpdatedAt,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          department: user.department,
          photoURL: user.photoURL,
          role: user.role,
          status: user.status,
          statusUpdatedAt: user.statusUpdatedAt,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      message: 'Profile fetched',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE PROFILE
// UPDATE PROFILE — ONLY IMAGE FILE (no photoURL in body)
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, department } = req.body;

    // Build update object (only include fields that are sent)
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (department) updateFields.department = department;

    // Handle image upload (only if file is sent)
    if (req.file) {
      

      // Step 2: Convert buffer to base64 data URI
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      // Step 3: Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'attendance-app/users',
        transformation: [{ width: 400, height: 400, crop: 'limit' }],
      });

      // Step 4: Set new photo URL
      updateFields.photoURL = result.secure_url;
    }

    // If no changes, return current user
    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No changes to update',
        data: req.user,
      });
    }

    // Update user in DB
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// UPDATE STATUS (Manual)
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['In Office', 'Out of Office', 'In Meeting', 'On Break', 'On Leave'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { status, statusUpdatedAt: Date.now() },
      { new: true }
    ).select('status statusUpdatedAt');

    res.status(200).json({
      success: true,
      message: 'Status updated',
      data: { status: user.status, statusUpdatedAt: user.statusUpdatedAt },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CHECK-IN (Geolocation-based)
export const checkIn = async (req, res) => {
  try {
    console.log(req.body);
    
    const { latitude, longitude } = req.body;
    console.log(latitude,longitude);
    

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Location required' });
    }

    const distance = getDistance(
      { latitude, longitude },
      { latitude: OFFICE_LAT, longitude: OFFICE_LNG }
    );

    const inOffice = distance <= OFFICE_RADIUS;
    const status = inOffice ? 'In Office' : 'Out of Office';

    // Update user status
    await User.findByIdAndUpdate(req.user._id, {
      status,
      statusUpdatedAt: Date.now(),
    });

    // Record attendance
    const today = new Date().setHours(0, 0, 0, 0);
    let attendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: new Date(today + 24 * 60 * 60 * 1000) },
    });

    if (!attendance) {
      attendance = new Attendance({
        user: req.user._id,
        date: new Date(),
        checkInTime: new Date(),
        location: { latitude, longitude },
        inOffice,
        status,
      });
    } else {
      attendance.checkInTime = new Date();
      attendance.location = { latitude, longitude };
      attendance.inOffice = inOffice;
      attendance.status = status;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Checked in',
      data: {
        status,
        inOffice,
        distance: Math.round(distance),
        checkInTime: attendance.checkInTime,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CHECK-OUT
export const checkOut = async (req, res) => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: new Date(today + 24 * 60 * 60 * 1000) },
    });

    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({ success: false, message: 'No check-in found' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ success: false, message: 'Already checked out' });
    }

    attendance.checkOutTime = new Date();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Checked out',
      data: {
        checkOutTime: attendance.checkOutTime,
        duration: Math.round((attendance.checkOutTime - attendance.checkInTime) / 60000) + ' mins',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET TEAM MEMBERS (with search & pagination)
export const getTeam = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { _id: { $ne: req.user._id } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('name department photoURL status statusUpdatedAt')
      .sort({ statusUpdatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Team fetched',
      data: {
        users,
        pagination: { page: parseInt(page), limit: parseInt(limit), total },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// AUTH MIDDLEWARE
export const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
// GET SINGLE EMPLOYEE PROFILE BY ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee profile fetched',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};