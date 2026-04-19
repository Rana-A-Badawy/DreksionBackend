import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getBookingDetails
} from "../controllers/bookingController.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// Require authentication for all booking routes
router.use(auth());

// @route   POST /api/v1/bookings
// @desc    Create a new booking (Trainee only)
router.post("/", createBooking);

// @route   GET /api/v1/bookings
// @desc    Get user's bookings (Trainee or Instructor)
router.get("/", getMyBookings);

// @route   GET /api/v1/bookings/:id
// @desc    Get details of a specific booking
router.get("/:id", getBookingDetails);

// @route   PATCH /api/v1/bookings/:id/status
// @desc    Update booking status (Instructor or Admin)
router.patch("/:id/status", updateBookingStatus);

export default router;
