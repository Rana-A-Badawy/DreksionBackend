import { Instructor, User, Booking, Verification, Trainee } from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import successResponse, { errorResponse } from "../utils/successResponse.js";
import { getPagination, paginatedResponse } from "../utils/pagination.js";
import { getFileUrl } from "../middlewares/uploadMiddleware.js";
import { VERIFICATION_STATUS, BOOKING_STATUS } from "../config/constants.js";

const handleCastError = (err, res) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return res.status(400).json(errorResponse(message));
};

export const getAllInstructors = asyncHandler(async (req, res, next) => {
  if (req.query.id && !req.query.id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new AppError("Invalid instructor ID format", 400));
  }
  const { page, limit, skip } = getPagination(req.query);
  const {
    transmission,
    minPrice,
    maxPrice,
    minRating,
    gender,
    lat,
    lng,
    maxDistance = 50000,
  } = req.query;

  const instructorFilter = { isVerified: true };

  if (transmission && !["manual", "automatic"].includes(transmission)) {
    return next(new AppError("Transmission must be 'manual' or 'automatic'", 400));
  }
  if (transmission === "manual") instructorFilter.canTeachManual = true;
  if (transmission === "automatic") instructorFilter.canTeachAutomatic = true;
  
  if (minPrice && (isNaN(minPrice) || Number(minPrice) < 0)) {
    return next(new AppError("minPrice must be a positive number", 400));
  }
  if (maxPrice && (isNaN(maxPrice) || Number(maxPrice) < 0)) {
    return next(new AppError("maxPrice must be a positive number", 400));
  }
  if (minPrice) instructorFilter["pricing.minPrice"] = { $gte: Number(minPrice) };
  if (maxPrice) instructorFilter["pricing.maxPrice"] = { $lte: Number(maxPrice) };
  
  if (minRating && (isNaN(minRating) || Number(minRating) < 0 || Number(minRating) > 5)) {
    return next(new AppError("minRating must be between 0 and 5", 400));
  }
  if (minRating) instructorFilter["rating.average"] = { $gte: Number(minRating) };

  if (gender && !["male", "female"].includes(gender)) {
    return next(new AppError("gender must be 'male' or 'female'", 400));
  }

  let userFilter = {};
  if (lat && lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return next(new AppError("Invalid coordinates. Lat must be -90 to 90, Lng must be -180 to 180", 400));
    }
    userFilter.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [lngNum, latNum] },
        $maxDistance: Number(maxDistance) || 50000,
      },
    };
  }
  if (gender) userFilter.gender = gender;

  let instructorIds;
  if (Object.keys(userFilter).length > 0) {
    const matchingUsers = await User.find(userFilter).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    const matched = await Instructor.find({ ...instructorFilter }).populate({
      path: "user",
      match: userFilter,
      select: "firstName lastName email phone gender location profileImage",
    });

    instructorIds = matched
      .filter((i) => i.user !== null)
      .map((i) => i._id);

    instructorFilter._id = { $in: instructorIds };
  }

  const [instructors, total] = await Promise.all([
    Instructor.find(instructorFilter)
      .populate("user", "firstName lastName email phone gender location profileImage")
      .populate("vehicles")
      .skip(skip)
      .limit(limit)
      .sort({ "rating.average": -1 }),
    Instructor.countDocuments(instructorFilter),
  ]);

  res.status(200).json(paginatedResponse(instructors, total, page, limit));
});

export const getInstructor = asyncHandler(async (req, res, next) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new AppError("Invalid instructor ID format", 400));
  }
  const instructor = await Instructor.findById(req.params.id)
    .populate("user", "firstName lastName email phone gender location profileImage createdAt")
    .populate("vehicles");

  if (!instructor) return next(new AppError("Instructor not found", 404));

  res.status(200).json(successResponse("Instructor fetched", instructor));
});
export const getMe = asyncHandler(async (req, res, next) => {
  const instructor = await Instructor.findOne({ user: req.user._id })
    .populate("user", "-password")
    .populate("vehicles");

  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  res.status(200).json(successResponse("Profile fetched", instructor));
});

export const updateMe = asyncHandler(async (req, res, next) => {
  const {
    firstName, lastName, phone, location,
    bio, yearsOfExperience,
    canTeachManual, canTeachAutomatic,
    hasOwnCar,
    minPrice, maxPrice,
  } = req.body;

  if (firstName && (typeof firstName !== "string" || firstName.length < 2 || firstName.length > 50)) {
    return next(new AppError("firstName must be 2-50 characters", 400));
  }
  if (lastName && (typeof lastName !== "string" || lastName.length < 2 || lastName.length > 50)) {
    return next(new AppError("lastName must be 2-50 characters", 400));
  }
  if (phone && !/^01[0-9]{9}$/.test(phone)) {
    return next(new AppError("Invalid Egyptian phone number", 400));
  }
  if (bio && (typeof bio !== "string" || bio.length > 500)) {
    return next(new AppError("bio must not exceed 500 characters", 400));
  }
  if (yearsOfExperience !== undefined && (isNaN(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 50)) {
    return next(new AppError("yearsOfExperience must be 0-50", 400));
  }
  if (canTeachManual !== undefined && typeof canTeachManual !== "boolean") {
    return next(new AppError("canTeachManual must be boolean", 400));
  }
  if (canTeachAutomatic !== undefined && typeof canTeachAutomatic !== "boolean") {
    return next(new AppError("canTeachAutomatic must be boolean", 400));
  }
  if (hasOwnCar !== undefined && typeof hasOwnCar !== "boolean") {
    return next(new AppError("hasOwnCar must be boolean", 400));
  }
  if (minPrice !== undefined && (isNaN(minPrice) || minPrice < 0)) {
    return next(new AppError("minPrice must be positive", 400));
  }
  if (maxPrice !== undefined && (isNaN(maxPrice) || maxPrice < 0)) {
    return next(new AppError("maxPrice must be positive", 400));
  }
  if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
    return next(new AppError("minPrice cannot be greater than maxPrice", 400));
  }

  const userUpdates = {};
  if (firstName) userUpdates.firstName = firstName;
  if (lastName) userUpdates.lastName = lastName;
  if (phone) userUpdates.phone = phone;
  if (location) userUpdates.location = location;

  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(req.user._id, userUpdates, { runValidators: true });
  }

  const instructorUpdates = {};
  if (bio !== undefined) instructorUpdates.bio = bio;
  if (yearsOfExperience !== undefined) instructorUpdates.yearsOfExperience = yearsOfExperience;
  if (canTeachManual !== undefined) instructorUpdates.canTeachManual = canTeachManual;
  if (canTeachAutomatic !== undefined) instructorUpdates.canTeachAutomatic = canTeachAutomatic;
  if (hasOwnCar !== undefined) instructorUpdates.hasOwnCar = hasOwnCar;
  if (minPrice !== undefined) instructorUpdates["pricing.minPrice"] = minPrice;
  if (maxPrice !== undefined) instructorUpdates["pricing.maxPrice"] = maxPrice;

  const instructor = await Instructor.findOneAndUpdate(
    { user: req.user._id },
    instructorUpdates,
    { new: true, runValidators: true }
  )
    .populate("user", "-password")
    .populate("vehicles");

  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  res.status(200).json(successResponse("Profile updated", instructor));
});

export const updateProfileImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError("Please upload an image", 400));

  const imageUrl = getFileUrl(req.file);

  await User.findByIdAndUpdate(req.user._id, { profileImage: imageUrl });

  res.status(200).json(successResponse("Profile image updated", { profileImage: imageUrl }));
});

export const submitVerification = asyncHandler(async (req, res, next) => {
  const instructor = await Instructor.findOne({ user: req.user._id });
  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  if (instructor.verificationStatus === VERIFICATION_STATUS.APPROVED) {
    return next(new AppError("Your account is already verified", 400));
  }

  if (instructor.verificationStatus === VERIFICATION_STATUS.PENDING) {
    return next(new AppError("Your verification is already under review", 400));
  }

  const files = req.files || {};
  const documents = {
    nationalIdFront: files.nationalIdFront ? getFileUrl(files.nationalIdFront[0]) : null,
    nationalIdBack: files.nationalIdBack ? getFileUrl(files.nationalIdBack[0]) : null,
    licenseImage: files.licenseImage ? getFileUrl(files.licenseImage[0]) : null,
  };

  if (!documents.licenseImage) {
    return next(new AppError("License image is required for verification", 400));
  }

  await Instructor.findByIdAndUpdate(instructor._id, {
    "license.image": documents.licenseImage,
    verificationStatus: VERIFICATION_STATUS.PENDING,
  });

  const verification = await Verification.create({
    instructor: instructor._id,
    type: "full_profile",
    documents,
    status: VERIFICATION_STATUS.PENDING,
  });

  res.status(201).json(successResponse("Verification submitted successfully, pending review", verification));
});

export const getVerificationStatus = asyncHandler(async (req, res, next) => {
  const instructor = await Instructor.findOne({ user: req.user._id });
  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  const latest = await Verification.findOne({ instructor: instructor._id })
    .sort({ createdAt: -1 });

  res.status(200).json(
    successResponse("Verification status fetched", {
      verificationStatus: instructor.verificationStatus,
      isVerified: instructor.isVerified,
      latestRequest: latest,
    })
  );
});

export const getMyStudents = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query);

  const instructor = await Instructor.findOne({ user: req.user._id });
  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  const traineeIds = await Booking.distinct("trainee", {
    instructor: instructor._id,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
  });

  const [students, total] = await Promise.all([
    Trainee.find({ _id: { $in: traineeIds } })
      .populate("user", "firstName lastName email phone profileImage")
      .populate("currentLevel")
      .skip(skip)
      .limit(limit),
    traineeIds.length,
  ]);

  res.status(200).json(paginatedResponse(students, total, page, limit));
});

export const getEarnings = asyncHandler(async (req, res, next) => {
  const instructor = await Instructor.findOne({ user: req.user._id });
  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  const { period = "monthly" } = req.query;

  const now = new Date();
  let dateFrom;
  if (period === "weekly") dateFrom = new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (period === "monthly") dateFrom = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const matchStage = {
    instructor: instructor._id,
    status: BOOKING_STATUS.COMPLETED,
    paymentStatus: "paid",
    ...(dateFrom && { bookingDate: { $gte: dateFrom } }),
  };

  const [summary, transactions] = await Promise.all([
    Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: "$price.amount" },
          totalSessions: { $sum: 1 },
          avgPerSession: { $avg: "$price.amount" },
        },
      },
    ]),
    Booking.find(matchStage)
      .populate("trainee")
      .select("bookingDate price trainee status")
      .sort({ bookingDate: -1 })
      .limit(50),
  ]);

  res.status(200).json(
    successResponse("Earnings fetched", {
      period,
      summary: summary[0] || { totalEarned: 0, totalSessions: 0, avgPerSession: 0 },
      transactions,
    })
  );
});

export const getStats = asyncHandler(async (req, res, next) => {
  const instructor = await Instructor.findOne({ user: req.user._id });
  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  const [totalBookings, completedBookings, pendingBookings, totalStudents] = await Promise.all([
    Booking.countDocuments({ instructor: instructor._id }),
    Booking.countDocuments({ instructor: instructor._id, status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({ instructor: instructor._id, status: BOOKING_STATUS.PENDING }),
    Booking.distinct("trainee", { instructor: instructor._id }).then((ids) => ids.length),
  ]);

  const completionRate = totalBookings > 0
    ? Math.round((completedBookings / totalBookings) * 100)
    : 0;

  res.status(200).json(
    successResponse("Stats fetched", {
      totalBookings,
      completedBookings,
      pendingBookings,
      totalStudents,
      completionRate,
      rating: instructor.rating,
    })
  );
});