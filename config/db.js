import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    
    console.log("DB Connected successfully ");
    
  } catch (error) {
    console.error("Database connection failed ");
    console.log(error.message);
    process.exit(1);
  }
};

export default connectDB;