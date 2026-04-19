import {Booking} from "../models/bookingModel.js";
import Instructor from "../models/InstructorModel.js";
import  asyncHandler from "../utils/asyncHandler.js";
import  AppError from "../utils/appError.js";

const PLATFORM_FEE = 0.15; // 15%
// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/sessions/:sessionId/start
// Instructor only — تسجيل بداية الجلسة
// ─────────────────────────────────────────────────────────────
export const startSession = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await Booking.findById(sessionId).populate("instructor");
  if (!session) return next(new AppError("الجلسة غير موجودة", 404));

  // التحقق إن المدرب هو صاحب الجلسة
  if (session.instructor.user.toString() !== req.user._id.toString())
    return next(new AppError("غير مصرح لك ببدء هذه الجلسة", 403));

  if (session.status === "completed")
    return next(new AppError("الجلسة منتهية بالفعل", 400));

  if (session.status === "cancelled")
    return next(new AppError("الجلسة ملغية", 400));

  if (session.startTime)
    return next(new AppError("الجلسة بدأت بالفعل", 400));

  session.startTime = new Date();
  session.status    = "confirmed";
  await session.save();

  res.status(200).json({
    success: true,
    message: "تم بدء الجلسة بنجاح",
    data: {
      sessionId: session._id,
      startTime: session.startTime,
      status:    session.status,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/sessions/:sessionId/complete
// Instructor only — إنهاء الجلسة وتحويل المبلغ
// ─────────────────────────────────────────────────────────────
export const completeSession = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await Booking.findById(sessionId).populate("instructor");
  if (!session) return next(new AppError("الجلسة غير موجودة", 404));

  // التحقق إن المدرب هو صاحب الجلسة
  if (session.instructor.user.toString() !== req.user._id.toString())
    return next(new AppError("غير مصرح لك بإنهاء هذه الجلسة", 403));

  if (session.status === "completed")
    return next(new AppError("الجلسة منتهية بالفعل", 400));

  if (session.status === "cancelled")
    return next(new AppError("الجلسة ملغية", 400));

  if (!session.startTime)
    return next(new AppError("الجلسة لم تبدأ بعد، قم ببدئها أولاً", 400));

  // ── حساب المدة والسعر ─────────────────────────────────────
  session.endTime             = new Date();
  const durationMs            = session.endTime - session.startTime;
  const durationInMinutes     = Math.floor(durationMs / (1000 * 60));
  const hourlyRate            = session.instructor.hourlyRate || 0;
  const totalAmount           = (durationInMinutes / 60) * hourlyRate;
  const commission            = totalAmount * PLATFORM_FEE;
  const netEarnings           = totalAmount - commission;

  session.durationMinutes     = durationInMinutes;
  session.totalPrice          = parseFloat(totalAmount.toFixed(2));
  session.platformCommission  = parseFloat(commission.toFixed(2));
  session.instructorEarnings  = parseFloat(netEarnings.toFixed(2));
  session.status              = "completed";

  await session.save();

  // ── تحديث wallet المدرب ───────────────────────────────────
  await Instructor.findByIdAndUpdate(session.instructor._id, {
    $inc: { wallet: parseFloat(netEarnings.toFixed(2)) },
  });

  res.status(200).json({
    success: true,
    message: "تم إنهاء الجلسة بنجاح وتحويل المبلغ للمدرب",
    data: {
      sessionId:      session._id,
      startTime:      session.startTime,
      endTime:        session.endTime,
      durationMinutes: durationInMinutes,
      summary: {
        totalAmount:    parseFloat(totalAmount.toFixed(2)),
        commission:     parseFloat(commission.toFixed(2)),
        netEarnings:    parseFloat(netEarnings.toFixed(2)),
        platformFee:    `${PLATFORM_FEE * 100}%`,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/sessions/:sessionId/cancel
// Instructor or Trainee — إلغاء الجلسة
// ─────────────────────────────────────────────────────────────
export const cancelSession = asyncHandler(async (req, res, next) => {
  const { sessionId }         = req.params;
  const { reason }            = req.body;

  const session = await Booking.findById(sessionId).populate("instructor");
  if (!session) return next(new AppError("الجلسة غير موجودة", 404));

  if (session.status === "completed")
    return next(new AppError("لا يمكن إلغاء جلسة منتهية", 400));

  if (session.status === "cancelled")
    return next(new AppError("الجلسة ملغية بالفعل", 400));

  if (session.startTime)
    return next(new AppError("لا يمكن إلغاء جلسة بدأت بالفعل", 400));

  session.status             = "cancelled";
  session.cancellationReason = reason || null;
  session.cancelledBy        = req.user._id;
  session.cancelledAt        = new Date();
  await session.save();

  res.status(200).json({
    success: true,
    message: "تم إلغاء الجلسة بنجاح",
    data: {
      sessionId: session._id,
      status:    session.status,
      reason:    session.cancellationReason,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/sessions/:sessionId
// Instructor or Trainee — تفاصيل جلسة واحدة
// ─────────────────────────────────────────────────────────────
export const getSession = asyncHandler(async (req, res, next) => {
  const session = await Booking.findById(req.params.sessionId)
    .populate("instructor")
    .populate("trainee");

  if (!session) return next(new AppError("الجلسة غير موجودة", 404));

  res.status(200).json({
    success: true,
    data: session,
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/sessions/me
// Instructor or Trainee — جلساتي (مع فلتر بالستاتوس)
// ─────────────────────────────────────────────────────────────
export const getMySessions = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // تحديد هل المستخدم مدرب أم متدرب
  const isInstructor = req.user.role === "instructor";

  let filter = {};

  if (isInstructor) {
    const instructor = await Instructor.findOne({ user: req.user._id });
    if (!instructor) return next(new AppError("Instructor profile not found", 404));
    filter.instructor = instructor._id;
  } else {
    const { Trainee } = await import("../models/index.js");
    const trainee = await Trainee.findOne({ user: req.user._id });
    if (!trainee) return next(new AppError("Trainee profile not found", 404));
    filter.trainee = trainee._id;
  }

  if (status) filter.status = status;

  const [sessions, total] = await Promise.all([
    Booking.find(filter)
      .populate("instructor")
      .populate("trainee")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);

  res.status(200).json({
    success:    true,
    total,
    page:       Number(page),
    limit:      Number(limit),
    totalPages: Math.ceil(total / limit),
    data:       sessions,
  });
});