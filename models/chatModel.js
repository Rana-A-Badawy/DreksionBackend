const mongoose = require("mongoose");

// ============================================================
// REVIEW MODEL
// ============================================================
const reviewSchema = new mongoose.Schema(
  {
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainee",
      required: [true, "المتدرب مطلوب"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: [true, "المدرب مطلوب"],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      unique: true, // مراجعة واحدة فقط لكل حجز
      required: [true, "الحجز مطلوب"],
    },
    rating: {
      type: Number,
      required: [true, "التقييم مطلوب"],
      min: [1, "التقييم الأدنى هو 1"],
      max: [5, "التقييم الأعلى هو 5"],
    },
    comment: {
      type: String,
      maxlength: [500, "التعليق يجب ألا يتجاوز 500 حرف"],
      trim: true,
    },
    // تقييمات تفصيلية (اختياري)
    subRatings: {
      punctuality: { type: Number, min: 1, max: 5 },   // الالتزام بالمواعيد
      communication: { type: Number, min: 1, max: 5 },  // أسلوب الشرح
      patience: { type: Number, min: 1, max: 5 },       // الصبر
      carCondition: { type: Number, min: 1, max: 5 },   // حالة السيارة
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ instructor: 1 });
reviewSchema.index({ trainee: 1 });

// بعد حفظ الريفيو، حدّث متوسط تقييم المدرب تلقائياً
reviewSchema.post("save", async function () {
  await updateInstructorRating(this.instructor);
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) await updateInstructorRating(doc.instructor);
});

async function updateInstructorRating(instructorId) {
  const Instructor = mongoose.model("Instructor");
  const result = await mongoose.model("Review").aggregate([
    { $match: { instructor: instructorId, isVisible: true } },
    {
      $group: {
        _id: "$instructor",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Instructor.findByIdAndUpdate(instructorId, {
      "rating.average": Math.round(result[0].avgRating * 10) / 10,
      "rating.count": result[0].count,
    });
  } else {
    await Instructor.findByIdAndUpdate(instructorId, {
      "rating.average": 0,
      "rating.count": 0,
    });
  }
}

// ============================================================
// CONVERSATION MODEL
// ============================================================
const conversationSchema = new mongoose.Schema(
  {
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainee",
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    lastMessage: {
      text: { type: String, default: "" },
      sentAt: { type: Date, default: null },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    // عدد الرسائل غير المقروءة لكل طرف
    unreadCount: {
      trainee: { type: Number, default: 0 },
      instructor: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// محادثة واحدة فقط بين كل متدرب ومدرب
conversationSchema.index({ trainee: 1, instructor: 1 }, { unique: true });

// ============================================================
// MESSAGE MODEL
// ============================================================
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "محتوى الرسالة مطلوب"],
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    mediaUrl: {
      type: String,
      default: null,
      // رابط الصورة أو الملف في حالة message_type != text
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

// بعد إرسال رسالة، حدّث آخر رسالة في المحادثة تلقائياً
messageSchema.post("save", async function () {
  await mongoose.model("Conversation").findByIdAndUpdate(this.conversation, {
    "lastMessage.text": this.messageType === "text" ? this.content : `📎 ${this.messageType}`,
    "lastMessage.sentAt": this.createdAt,
    "lastMessage.senderId": this.sender,
  });
});

// ============================================================
// EXPORTS
// ============================================================
const Review       = mongoose.model("Review", reviewSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);
const Message      = mongoose.model("Message", messageSchema);

module.exports = { Review, Conversation, Message };
