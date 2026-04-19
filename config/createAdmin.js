import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/UserModel.js";
import { Admin } from "../models/Other.js";

const createAdmin = async () => {
  await mongoose.connect(process.env.DATABASE_URL);

  const user = await User.create({
    firstName: "Super",
    lastName:  "Admin",
    email:     "ranabadawy832005@gmail.com",
    password:  "admin123456",
    phone:     "01000000000",
    gender:    "male",
    role:      "admin",
    nationalId: "00000000000",
    isActive:  true,
  });

  await Admin.create({
    user:         user._id,
    isSuperAdmin: true,
  });

  console.log("Admin created!");
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${user.password}`);
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error("error", err.message);
  process.exit(1);
});