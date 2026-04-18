import dotenv from "dotenv"; 
dotenv.config(); 
import authRoutes from "./routes/authRoutes.js";
import express from "express";
import connectDB from "./config/db.js";
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.use("/api/v1/auth", authRoutes);
connectDB();

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});