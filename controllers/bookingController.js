import { Booking, Availability } from "../models/bookingModel.js";
import Trainee from "../models/traineeModel.js";
import Instructor from "../models/InstructorModel.js";
import User from "../models/UserModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import successResponse from "../utils/successResponse.js";
import { getPagination, paginatedResponse } from "../utils/pagination.js";
import { BOOKING_STATUS } from "../config/constants.js";

// @desc    Create a new booking
// @route   POST /api/v1/bookings
// @access  Private (Trainee only)
export const createBooking = asyncHandler(async (req, res, next) => {
  const { instructorId, vehicleId, levelId, bookingDate, startTime, durationMinutes, priceAmount } = req.body;

  // 1. Get Trainee profile using logged-in user, or create it if testing
  let trainee = await Trainee.findOne({ user: req.user._id });
  if (!trainee) {
    // Auto create for testing purposes
    trainee = await Trainee.create({ user: req.user._id });
  }

  // 2. Validate Instructor exists, or create it if the sent ID is a User ID (for testing)
  let instructor = await Instructor.findById(instructorId);
  if (!instructor) {
    const userCheck = await User.findById(instructorId);
    if (userCheck && userCheck.role === "instructor") {
      instructor = await Instructor.create({ 
        user: userCheck._id,
        license: { grade: "B", expiryDate: new Date("2030-01-01") }
      });
    } else {
      return next(new AppError("المدرب غير موجود أو الـ ID غير صحيح", 404));
    }
  }

  // Calculate end time simply (for simplicity assuming startTime format HH:mm)
  // Normally you'd parse times properly using moment or date-fns
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + (durationMinutes || 60);
  const endHours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const endMins = (totalMinutes % 60).toString().padStart(2, "0");
  const endTime = `${endHours}:${endMins}`;

  // 3. Create Booking
  const booking = await Booking.create({
    trainee: trainee._id,
    instructor: instructor._id,
    vehicle: vehicleId || null,
    level: levelId, // Usually sent from frontend based on trainee's current level
    bookingDate,
    startTime,
    endTime,
    durationMinutes: durationMinutes || 60,
    price: {
      amount: priceAmount,
      currency: "EGP",
    },
    status: "pending",
  });

  res.status(201).json(successResponse("تم إنشاء طلب الحجز بنجاح بانتظار موافقة المدرب", booking));
});

// @desc    Get user bookings
// @route   GET /api/v1/bookings
// @access  Private
export const getMyBookings = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query);
  const userRole = req.user.role; // Assuming role is attached to req.user

  let query = {};
  
  if (userRole === "trainee") {
    let trainee = await Trainee.findOne({ user: req.user._id });
    if (!trainee) {
      trainee = await Trainee.create({ user: req.user._id });
    }
    query.trainee = trainee._id;
  } else if (userRole === "instructor") {
    let instructor = await Instructor.findOne({ user: req.user._id });
    if (!instructor) {
       instructor = await Instructor.create({ 
         user: req.user._id,
         license: { grade: "B", expiryDate: new Date("2030-01-01") }
       });
    }
    query.instructor = instructor._id;
  } else {
    // Admins get everything
  }

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate({
        path: "trainee",
        populate: { path: "user", select: "firstName lastName phone profileImage" }
      })
      .populate({
        path: "instructor",
        populate: { path: "user", select: "firstName lastName phone profileImage" }
      })
      .skip(skip)
      .limit(limit)
      .sort({ bookingDate: -1 }),
    Booking.countDocuments(query),
  ]);

  res.status(200).json(paginatedResponse(bookings, total, page, limit));
});

// @desc    Update booking status
// @route   PATCH /api/v1/bookings/:id/status
// @access  Private (Instructor/Admin)
export const updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status, cancellationReason } = req.body;
  const bookingId = req.params.id;

  const validStatuses = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  if (!validStatuses.includes(status)) {
    return next(new AppError("حالة الحجز غير صحيحة", 400));
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new AppError("الحجز غير موجود", 404));
  }

  // Authorize: Instructor verifying it's for them
  if (req.user.role === "instructor") {
    const instructor = await Instructor.findOne({ user: req.user._id });
    if (booking.instructor.toString() !== instructor._id.toString()) {
      return next(new AppError("غير مصرح لك بتعديل حالة هذا الحجز", 403));
    }
  }

  booking.status = status;
  if (status === "cancelled") {
    booking.cancellationReason = cancellationReason || "تم الإلغاء بدون ذكر السبب";
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
  }

  await booking.save();

  res.status(200).json(successResponse("تم تحديث حالة الحجز بنجاح", booking));
});

// @desc    Get booking details
// @route   GET /api/v1/bookings/:id
// @access  Private
export const getBookingDetails = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: "trainee",
      populate: { path: "user", select: "firstName lastName phone profileImage" }
    })
    .populate({
      path: "instructor",
      populate: { path: "user", select: "firstName lastName phone profileImage" }
    });

  if (!booking) {
    return next(new AppError("الحجز غير موجود", 404));
  }

  res.status(200).json(successResponse("تفاصيل الحجز", booking));
});
