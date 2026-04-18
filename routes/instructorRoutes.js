import express from "express";
const router = express.Router();

import { auth } from "../middlewares/auth.js";
import { uploadProfileImage, uploadVerificationDocs } from "../middlewares/uploadMiddleware.js";
import {
  getAllInstructors,
  getInstructor,
  getMe,
  updateMe,
  updateProfileImage,
  submitVerification,
  getVerificationStatus,
  getMyStudents,
  getEarnings,
  getStats,
} from "../controllers/instructorController.js";

import { ROLES } from "../config/constants.js";

router.get("/", getAllInstructors);
router.get("/:id", getInstructor);

router.use(auth(ROLES.INSTRUCTOR));

router.get("/me", getMe);
router.put("/me", updateMe);
router.put("/me/profile-image", uploadProfileImage, updateProfileImage);
router.post("/me/verify", uploadVerificationDocs, submitVerification);
router.get("/me/verification-status", getVerificationStatus);
router.get("/me/students", getMyStudents);
router.get("/me/earnings", getEarnings);
router.get("/me/stats", getStats);

router.use((err, req, res, next) => {
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({
      status: "error",
      message: "Invalid instructor ID format",
    });
  }
  next(err);
});

export default router;