import Attendance from "../models/Attendance.js";

// controllers/attendanceController.js
export const markAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Check if already marked
    const existing = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already marked attendance for today'
      });
    }

    // Mark attendance
    const attendance = await Attendance.create({
      user: req.user._id,
      date: new Date() // will be normalized to day in frontend or query
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked for today',
      data: { date: attendance.date }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getMyAttendance = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Invalid month' });
    }

    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    }).select('date').sort({ date: 1 });

    res.json({
      success: true,
      data: records.map(r => r.date.toISOString().split('T')[0]) // e.g., "2025-11-01"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};