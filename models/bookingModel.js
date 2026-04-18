const mongoose = require("mongoose");
const availabilitySchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: [true, "اليوم مطلوب"],
      min: 0, 
      max: 6,
    },
    slots: [
      {
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
        isBooked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
availabilitySchema.index({ instructor: 1, dayOfWeek: 1 });
const bookingSchema = new mongoose.Schema(
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
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: [true, "المستوى مطلوب"],
    },
    bookingDate: {
      type: Date,
      required: [true, "تاريخ الحجز مطلوب"],
    },
    startTime: {
      type: String, // "10:00"
      required: [true, "وقت البداية مطلوب"],
    },
    endTime: {
      type: String, 
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    location: {
      address: String,
      coordinates: {
        type: [Number], 
      },
    },
    meetingPoint: {
      type: String, 
    },
    price: {
      amount: {
        type: Number,
        required: [true, "السعر مطلوب"],
        min: 0,
      },
      currency: {
        type: String,
        default: "EGP",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "completed", "cancelled", "no_show"],
        message: "حالة الحجز غير صحيحة",
      },
      default: "pending",
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    traineeNotes: {
      type: String, 
    },
    instructorNotes: {
      type: String, 
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
bookingSchema.index({ trainee: 1, status: 1 });
bookingSchema.index({ instructor: 1, bookingDate: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.virtual("isUpcoming").get(function () {
  return this.bookingDate > new Date();
});
const progressSchema = new mongoose.Schema(
  {
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainee",
      required: true,
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    instructorRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);
progressSchema.index({ trainee: 1, skill: 1 }, { unique: true });
const Availability = mongoose.model("Availability", availabilitySchema);
const Booking      = mongoose.model("Booking", bookingSchema);
const Progress     = mongoose.model("Progress", progressSchema);
module.exports = { Availability, Booking, Progress };
