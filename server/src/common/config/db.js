import mongoose from "mongoose";
import dns from "node:dns";
import { MONGO_URI } from "./envConfig.js";
import logger from "../utils/logger.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    logger.success(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

export default connectDB;
