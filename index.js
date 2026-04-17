import dotenv from "dotenv"; 
dotenv.config(); 

import express from "express";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 3000;
const app = express();

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});