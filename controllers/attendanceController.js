import Attendance from '../models/Attendance.js';
export const getMyAttendance = async (req, res) => {
  try {
    console.log("req.query:", req.query);

    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing 'month' parameter. Use: ?month=2025-10"
      });
    }

    console.log("Requested month:", month);

    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1); 
    const end = new Date(year, mon, 0, 23, 59, 59, 999); // last ms of month

    console.log("Date range:", start.toISOString(), "→", end.toISOString());

    const records = await Attendance.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    })
      .select('date checkInTime checkOutTime status inOffice')  
      .sort({ date: 1 });

    console.log(`Found ${records.length} records`);

    res.status(200).json({
      success: true,
      message: 'Attendance fetched',
      data: records,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};