import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "الاسم الأول مطلوب"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "الاسم الأخير مطلوب"],
      trim: true,
    },
  email: {
  type: String,
  required: [true, "البريد الإلكتروني مطلوب"],
  unique: true,
  index: true,
  lowercase: true,
  trim: true,
  match: [
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    "صيغة البريد الإلكتروني غير صحيحة"
  ],
},
    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
      minlength: [8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "رقم الهاتف مطلوب"],
      trim: true,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female"],
        message: "النوع يجب أن يكون ذكر أو أنثى",
      },
      required: [true, "النوع مطلوب"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },
    nationalId: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    licenseImage: {
      type: String,
      default: null,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "instructor", "trainee"],
      required: true,
    },
    detales: {
      haveAcar: {
        type: Boolean,
      },
      carType: {
        type: [String], // تم التعديل هنا: تحديد أن المصفوفة تحتوي على نصوص
        enum: {
          values: ["automatic", "manual"],
          message: "نوع السيارة يجب أن يكون automatic أو manual",
        },
        default: [], 
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ location: "2dsphere" });

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


// تسجيل وقت تغيير الباسوورد
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});


userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

export default mongoose.model("User", userSchema); 