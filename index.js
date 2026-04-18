import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { upload } from "./middlewares/uploadMiddleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import instructorRoutes from "./routes/instructorRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Driving School API is Running...");
});

app.use("/api/instructors", instructorRoutes);

app.post("/api/upload-test", upload.single("nationalId"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "الرجاء اختيار صورة لرفعها" });
    }

    res.status(200).json({
      message: "تم رفع الصورة بنجاح!",
      filePath: req.file.path,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory is ready at: ${path.join(__dirname, "uploads")}`);
});