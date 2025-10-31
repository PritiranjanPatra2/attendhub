import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  date: { type: Date, required: true }, // e.g. 2025-10-30
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },

  // For location-based tracking
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },

  // Whether within 100m of office radius
  inOffice: { type: Boolean, default: false },

  // Status during attendance
  status: {
    type: String,
    enum: ['In Office', 'Out of Office', 'In Meeting', 'On Break', 'On Leave'],
    default: 'Out of Office',
  },

}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
