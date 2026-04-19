import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { transporter } from "../config/mailer.js";
import e from "express";
import { getPagination, paginatedResponse } from "../utils/pagination.js";

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