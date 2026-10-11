import "dotenv/config";

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/atomictask";

export const JWT_SECRET =
  process.env.JWT_SECRET || "smarttask_jwt_super_secret_key_123456";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "smarttask_refresh_super_secret_key_123456";
export const JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || "30d";

