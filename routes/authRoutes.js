import express from "express";
import { register, verifyOTP , resendOTP , login } from "../controllers/authController.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

// POST /api/v1/auth/register
router.post(
  "/register",
  uploadFile("users", ["image"], 5).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "licenseImage", maxCount: 1 }
  ]),
  register
);

// POST /api/v1/auth/verify-otp
router.post("/verify-otp", verifyOTP);

// POST /api/v1/auth/resend-otp
router.post("/resend-otp", resendOTP);


// POST /api/v1/auth/login
router.post("/login", login);


export default router;