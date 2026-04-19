import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { transporter } from "../config/mailer.js";

/* =========================
   REGISTER
========================= */
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      gender,
      role,
      location,
      nationalId,
      licenseNumber,
      detales,
    } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(400).json({
        status: "fail",
        message: "البريد الإلكتروني مستخدم بالفعل",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
       
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      phone,
      gender,
      role,
      nationalId,
      licenseNumber,
      location: typeof location === "string" ? JSON.parse(location) : location,
      detales: typeof detales === "string" ? JSON.parse(detales) : detales,
      otp,
      isVerified: false,
      isActive: false,
    });

    await transporter.sendMail({
      from: `DriveReady <${process.env.AUTH_EMAIL}>`,
      to: normalizedEmail,
      subject: "Verify Your Account",
      text: `Your OTP is: ${otp}`,
    });

    res.status(201).json({
      status: "success",
      message: "تم التسجيل، راجع الإيميل",
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* =========================
   VERIFY OTP
========================= */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "المستخدم غير موجود",
      });
    }

    // check OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        status: "fail",
        message: "OTP غير صحيح",
      });
    }


    // verify user
    user.isVerified = true;
    user.otp = null;

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      status: "success",
      message: "تم التفعيل بنجاح",
      token,
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

/* =========================
   RESEND OTP
========================= */
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "المستخدم غير موجود",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: "error",
        message: "الحساب متفعل بالفعل",
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await transporter.sendMail({
      from: `DriveReady <${process.env.AUTH_EMAIL}>`,
      to: normalizedEmail,
      subject: "Resend OTP",
      text: `Your new OTP is: ${newOtp}`,
    });

    user.otp = newOtp;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "تم إرسال كود جديد",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "البريد الإلكتروني غير موجود",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        status: "fail",
        message: "لازم تفعل الحساب أولاً",
      });
    }

    const isCorrect = await user.correctPassword(password);

    if (!isCorrect) {
      return res.status(400).json({
        status: "fail",
        message: "كلمة المرور غير صحيحة",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const safeUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    res.status(200).json({
      status: "success",
      message: "تم تسجيل الدخول بنجاح",
      token,
      data: safeUser,
    });

  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "المستخدم غير موجود",
      });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `DriveReady <${process.env.AUTH_EMAIL}>`,
      to: normalizedEmail,
      subject: "Password Reset",
      text: `Use this link to reset your password: ${resetUrl}`,
    });

    res.status(200).json({
      status: "success",
      message: "تم إرسال رابط إعادة تعيين كلمة المرور",
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        status: "error",
        message: "Token and new password are required",
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "الرابط غير صالح أو منتهي الصلاحية",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "تم إعادة تعيين كلمة المرور بنجاح",
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};