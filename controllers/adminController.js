import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { transporter } from "../config/mailer.js";
import e from "express";
import { getPagination, paginatedResponse } from "../utils/pagination.js";
import { Level, Skill, Trainee, Progress } from "../models/index.js";
import asyncHandler    from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import successResponse  from "../utils/successResponse.js";

export const verifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const pendingUsers = await User.find({ isVerified: false })
      .select("-password")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ isVerified: false });

    return res.status(200).json(paginatedResponse(pendingUsers, total, page, limit));
} catch (error) {
    return res.status(500).json({
      status: "error",
      message: "حدث خطأ ",
    });
  }
};

export const setInstructorPricing = async (req, res) => {
  try {
    const { instructorId, minPrice, maxPrice } = req.body;

    if (!instructorId) {
      return res.status(400).json({
        status: "error",
        message: "instructorId is required",
      });
    }

    if (minPrice !== undefined && (isNaN(minPrice) || minPrice < 0)) {
      return res.status(400).json({
        status: "error",
        message: "minPrice must be a positive number",
      });
    }

    if (maxPrice !== undefined && (isNaN(maxPrice) || maxPrice < 0)) {
      return res.status(400).json({
        status: "error",
        message: "maxPrice must be a positive number",
      });
    }

    if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({
        status: "error",
        message: "minPrice cannot be greater than maxPrice",
      });
    }

    const Instructor = (await import("../models/index.js")).Instructor;
    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      return res.status(404).json({
        status: "error",
        message: "Instructor not found",
      });
    }

    const updates = {};
    if (minPrice !== undefined) updates["pricing.minPrice"] = minPrice;
    if (maxPrice !== undefined) updates["pricing.maxPrice"] = maxPrice;

    await Instructor.findByIdAndUpdate(instructorId, updates);

    res.status(200).json({
      status: "success",
      message: "Pricing updated successfully",
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const approveVerification = async (req, res) => {
  try {
    const { userId, status } = req.body;

    if (!userId || !status) {
      return res.status(400).json({
        status: "error",
        message: "userId and status are required",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "status must be 'approved' or 'rejected'",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

if(status === "approved"){
    user.isActive = true;
    await user.save();
     await transporter.sendMail({
        from: `DriveReady <${process.env.AUTH_EMAIL}>`,
        to: user.email,
        subject: "Account Approved",
        text: "Your account has been approved. You can now log in.",
      });

          return res.status(200).json({
      status: "success",
      message: "User verification approved",
    });

} else if(status === "rejected"){
    user.isActive = null;
    await user.save();
    return res.status(200).json({
  status: "success",
  message: "User verification rejected",
});
}


  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "حدث خطأ ",
    });
  }
};
// GET /api/v1/admin/levels
export const getAllLevels = asyncHandler(async (req, res) => {
  const levels = await Level.find()
    .populate("skills")   // virtual populate
    .sort({ levelNumber: 1 });
  res.status(200).json(successResponse("Levels fetched", levels));
});
// POST /api/v1/admin/levels
export const createLevel = asyncHandler(async (req, res, next) => {
  const { levelNumber, title, description } = req.body;
  if (!levelNumber === undefined || !title)
    return next(new AppError("levelNumber and title are required", 400));
  const exists = await Level.findOne({ levelNumber });
  if (exists) return next(new AppError(`Level ${levelNumber} already exists`, 400));
  const level = await Level.create({
    levelNumber,
    title,
    description,
    order: levelNumber,
    isActive: true,
  });
  res.status(201).json(successResponse("Level created", level));
});
// PUT /api/v1/admin/levels/:id
export const updateLevel = asyncHandler(async (req, res, next) => {
  const { title, description, isActive } = req.body;

  const level = await Level.findByIdAndUpdate(
    req.params.id,
    { title, description, isActive },
    { new: true, runValidators: true }
  );

  if (!level) return next(new AppError("Level not found", 404));

  res.status(200).json(successResponse("Level updated", level));
});

// DELETE /api/v1/admin/levels/:id
export const deleteLevel = asyncHandler(async (req, res, next) => {
  const level = await Level.findById(req.params.id);
  if (!level) return next(new AppError("Level not found", 404));

  // Check if any trainees are on this level
  const traineesOnLevel = await Trainee.countDocuments({ currentLevel: level._id });
  if (traineesOnLevel > 0)
    return next(new AppError(`Cannot delete — ${traineesOnLevel} trainee(s) are currently on this level`, 400));

  // Delete skills + level
  await Skill.deleteMany({ level: level._id });
  await level.deleteOne();

  res.status(200).json(successResponse("Level and its skills deleted"));
});
// SKILLS
// GET /api/v1/admin/levels/:levelId/skills
export const getLevelSkills = asyncHandler(async (req, res, next) => {
  const level = await Level.findById(req.params.levelId);
  if (!level) return next(new AppError("Level not found", 404));

  const skills = await Skill.find({ level: req.params.levelId }).sort({ orderIndex: 1 });

  res.status(200).json(successResponse("Skills fetched", { level, skills }));
});
// POST /api/v1/admin/levels/:levelId/skills
export const addSkill = asyncHandler(async (req, res, next) => {
  const { name, description, isRequired, orderIndex } = req.body;

  if (!name) return next(new AppError("Skill name is required", 400));

  const level = await Level.findById(req.params.levelId);
  if (!level) return next(new AppError("Level not found", 404));

  const skill = await Skill.create({
    level: level._id,
    name,
    description,
    isRequired: isRequired ?? true,
    orderIndex: orderIndex ?? 0,
  });

  res.status(201).json(successResponse("Skill added", skill));
});
// PUT /api/v1/admin/skills/:id
export const updateSkill = asyncHandler(async (req, res, next) => {
  const { name, description, isRequired, orderIndex } = req.body;
  const skill = await Skill.findByIdAndUpdate(
    req.params.id,
    { name, description, isRequired, orderIndex },
    { new: true, runValidators: true }
  );
  if (!skill) return next(new AppError("Skill not found", 404));
  res.status(200).json(successResponse("Skill updated", skill));
});
// DELETE /api/v1/admin/skills/:id
export const deleteSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) return next(new AppError("Skill not found", 404));
  // Delete progress records linked to this skill
  await Progress.deleteMany({ skill: skill._id });
  await skill.deleteOne();
  res.status(200).json(successResponse("Skill deleted"));
});