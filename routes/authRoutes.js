import express from "express";
import { register, verifyOTP, resendOTP, login, forgotPassword, resetPassword } from "../controllers/authController.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post(
  "/register",
  uploadFile("users", ["image"], 5).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "licenseImage", maxCount: 1 }
  ]),
  register
);

router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);

// Password Reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;