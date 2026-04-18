import mongoose from "mongoose";

const traineeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      default: null,
    },
    preferredTransmission: {
      type: String,
      enum: ["manual", "automatic", "both"],
      default: "both",
    },
    currentInstructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
    hasPreviousLicense: {
      type: Boolean,
      default: false,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    budget: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

traineeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "firstName lastName email phone gender location profileImage",
  });
  next();
});

export default mongoose.model("Trainee", traineeSchema);