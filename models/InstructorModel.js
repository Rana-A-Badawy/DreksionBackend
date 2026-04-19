import mongoose from "mongoose";

const instructorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    license: {
      image: {
        type: String,
        default: null,
      },
      number: {
        type: String,
        trim: true,
      },
      grade: {
        type: String,
        enum: ["A", "B", "C", "D", "E"],
        required: [true, "درجة الرخصة مطلوبة"],
      },
      expiryDate: {
        type: Date,
        required: [true, "تاريخ انتهاء الرخصة مطلوب"],
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    canTeachManual: {
      type: Boolean,
      default: false,
    },
    canTeachAutomatic: {
      type: Boolean,
      default: false,
    },
    hasOwnCar: {
      type: Boolean,
      default: false,
    },
    vehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
    ],
    pricing: {
      minPrice: {
        type: Number,
        default: 0,
        min: [0, "السعر لا يمكن أن يكون سالباً"],
      },
      maxPrice: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "EGP",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_submitted"],
      default: "not_submitted",
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      maxlength: [500, "السيرة الذاتية يجب ألا تتجاوز 500 حرف"],
    },

    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: 
    { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    wallet:     
    {
       type: Number, 
       default: 0, 
       min: 0 
    },
 
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

instructorSchema.virtual("isLicenseExpired").get(function () {
  if (!this.license.expiryDate) return true;
  return this.license.expiryDate < new Date();
});

instructorSchema.virtual("canTeach").get(function () {
  return this.isVerified && !this.isLicenseExpired;
});

instructorSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "firstName lastName email phone gender location profileImage",
  });
  next();
});

const Instructor = mongoose.model("Instructor", instructorSchema);
export default Instructor;
