import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { Conversation, Message } from "../models/chatModel.js";
import successResponse from "../utils/successResponse.js";
import AppError from "../utils/appError.js";

export const createConversation = asyncHandler(async (req, res) => {
  const { traineeId, instructorId, bookingId } = req.body;
  const userId = req.user.id;

  let conversation = await Conversation.findOne({
    trainee: traineeId,
    instructor: instructorId,
    isActive: true,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      trainee: traineeId,
      instructor: instructorId,
      booking: bookingId,
    });
  }

  return successResponse(res, 201, "تم إنشاء المحادثة", conversation);
});

export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let query = { isActive: true };

  if (userRole === "trainee") {
    query.trainee = userId;
  } else if (userRole === "instructor") {
    query.instructor = userId;
  }

  const conversations = await Conversation.find(query)
    .populate("trainee", "name phone avatar")
    .populate("instructor", "name phone avatar")
    .populate("booking")
    .sort({ updatedAt: -1 });

  return successResponse(res, 200, "", conversations);
});

export const getConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  const conversation = await Conversation.findById(conversationId)
    .populate("trainee", "name phone avatar")
    .populate("instructor", "name phone avatar")
    .populate({
      path: "booking",
      populate: { path: "session" },
    });

  if (!conversation) {
    throw new AppError("المحادثة غير موجودة", 404);
  }

  const hasAccess =
    conversation.trainee._id.toString() === userId ||
    conversation.instructor._id.toString() === userId;

  if (!hasAccess) {
    throw new AppError("غير مصرح لك بالوصول", 403);
  }

  return successResponse(res, 200, "", conversation);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, messageType = "text", mediaUrl } = req.body;
  const senderId = req.user.id;
  const senderRole = req.user.role;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError("المحادثة غير موجودة", 404);
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content,
    messageType,
    mediaUrl,
  });

  const updateField = senderRole === "trainee" ? "instructor" : "trainee";

  await Conversation.findByIdAndUpdate(conversationId, {
    $inc: { [`unreadCount.${updateField}`]: 1 },
  });

  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "name avatar role"
  );

  return successResponse(res, 201, "تم إرسال الرسالة", populatedMessage);
});

export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user.id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError("المحادثة غير موجودة", 404);
  }

  const hasAccess =
    conversation.trainee.toString() === userId ||
    conversation.instructor.toString() === userId;

  if (!hasAccess) {
    throw new AppError("غير مصرح لك بالوصول", 403);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await Message.find({ conversation: conversationId, isDeleted: false })
    .populate("sender", "name avatar role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Message.countDocuments({ conversation: conversationId, isDeleted: false });

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      [`unreadCount.${req.user.role}`]: 0,
    },
  });

  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isSeen: false },
    { isSeen: true, seenAt: new Date() }
  );

  return successResponse(res, 200, "", {
    messages: messages.reverse(),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      [`unreadCount.${req.user.role}`]: 0,
    },
  });

  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isSeen: false },
    { isSeen: true, seenAt: new Date() }
  );

  return successResponse(res, 200, "تم تحديد الرسائل كمقروءة");
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError("الرسالة غير موجودة", 404);
  }

  if (message.sender.toString() !== userId) {
    throw new AppError("غير مصرح لك بحذف هذه الرسالة", 403);
  }

  message.content = "تم حذف هذه الرسالة";
  message.isDeleted = true;
  await message.save();

  return successResponse(res, 200, "تم حذف الرسالة");
});
