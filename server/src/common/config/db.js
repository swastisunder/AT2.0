import mongoose from "mongoose";
import { MONGO_URI, NODE_ENV } from "./envConfig.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      autoIndex: NODE_ENV !== "production",
    });
    logger.success(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

export default connectDB;
