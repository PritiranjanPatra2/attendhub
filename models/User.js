import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true },
  phone: { type: String, default: null },
  department: { type: String, default: 'Full Stack Developer' },
  photoURL: { type: String, default: null }, 
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  status: {
    type: String,
    enum: ['In Office', 'Out of Office', 'In Meeting', 'On Break', 'On Leave'],
    default: 'Out of Office'
  },
  statusUpdatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
export default User;