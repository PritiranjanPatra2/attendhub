import express from "express";
import "dotenv/config";
import connectDb from "./db/db.js";
import userRoutes from "./routes/userRoutes.js";
import attendanceRoutes from './routes/attendanceRoutes.js';

import cors from "cors";
import connectCloudinary from "./configs/cloudinary.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));

app.get("/", (req, res) => {
  res.send("Server is running");
});
await connectDb();
await connectCloudinary();
app.use("/api/auth",userRoutes);
app.use('/api/attendance', attendanceRoutes);

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
