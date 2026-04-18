import express from "express";
import { auth } from "../middlewares/auth.js";
import uploadFile from "../middlewares/multer.js";
import { getMe, updateMe, updateProfileImage } from "../controllers/userController.js";

const router = express.Router();

// All routes require authentication
router.use(auth());

// GET /api/v1/users/me - Get current user profile
router.get("/me", getMe);

// PUT /api/v1/users/me - Update current user profile
router.put("/me", updateMe);

// PUT /api/v1/users/me/profile-image - Update profile image
router.put("/me/profile-image", uploadFile("users", ["image"], 5).single("file"), updateProfileImage);

export default router;