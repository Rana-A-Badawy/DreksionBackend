import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import successResponse from "../utils/successResponse.js";
import User from "../models/UserModel.js";
import Trainee from "../models/traineeModel.js";

const getMe = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({ user: req.user._id })
    .populate("currentLevel", "title levelNumber description")
    .populate("currentInstructor", "user");

  return res.status(200).json(
    successResponse("Profile fetched successfully", {
      user: req.user,
      trainee: trainee || null,
    })
  );
});

const updateMe = asyncHandler(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates", 400));
  }

  const allowedUserFields = ["firstName", "lastName", "phone", "gender", "nationalId"];
  const userUpdates = {};
  allowedUserFields.forEach((field) => {
    if (req.body[field] !== undefined) userUpdates[field] = req.body[field];
  });

  if (req.body.location) {
    const existing = req.user.location || {};
    const { address, city, coordinates } = req.body.location;

    userUpdates.location = {
      type: "Point",
      coordinates: existing.coordinates || [0, 0],
      address: existing.address || "",
      city: existing.city || "",
    };

    if (address !== undefined) userUpdates.location.address = address;
    if (city !== undefined) userUpdates.location.city = city;
    if (Array.isArray(coordinates) && coordinates.length === 2)
      userUpdates.location.coordinates = coordinates;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    userUpdates,
    { new: true, runValidators: true }
  ).select("-password");

  const allowedTraineeFields = ["preferredTransmission", "hasPreviousLicense", "budget"];
  const traineeUpdates = {};
  allowedTraineeFields.forEach((field) => {
    if (req.body[field] !== undefined) traineeUpdates[field] = req.body[field];
  });

  let updatedTrainee = null;
  if (Object.keys(traineeUpdates).length > 0) {
    updatedTrainee = await Trainee.findOneAndUpdate(
      { user: req.user._id },
      traineeUpdates,
      { new: true, runValidators: true }
    );
  }

  return res.status(200).json(
    successResponse("Profile updated successfully", {
      user: updatedUser,
      trainee: updatedTrainee,
    })
  );
});

const updateProfileImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload an image file", 400));
  }

  const imageUrl = `/${req.file.path.replace(/\\/g, "/")}`;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: imageUrl },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    successResponse("Profile image updated successfully", {
      profileImage: updatedUser.profileImage,
    })
  );
});

export { getMe, updateMe, updateProfileImage };