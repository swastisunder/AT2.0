import "dotenv/config";
import logger from "../utils/logger.js";

export const PORT = Number(process.env.PORT) || 5000;
export const NODE_ENV = process.env.NODE_ENV || "development";

export const isProduction = NODE_ENV === "production";

if (isProduction) {
  const requiredEnvVars = [
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGINS",
  ];

  const missingEnvs = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingEnvs.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingEnvs.join(", ")}`,
    );
  }
}

const getEnvWithFallback = (key, fallback, warningMsg) => {
  if (process.env[key]) {
    return process.env[key];
  }
  if (!isProduction) {
    if (warningMsg) {
      logger.warn(warningMsg);
    }
    return fallback;
  }
  return undefined;
};

export const CORS_ORIGINS = (
  process.env.CORS_ORIGINS ||
  (!isProduction ? "https://ssbat.vercel.app,http://localhost:5173" : "")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const MONGO_URI = getEnvWithFallback(
  "MONGO_URI",
  "mongodb://localhost:27017/atomictask",
  "MONGO_URI is not set. Falling back to local MongoDB.",
);

export const JWT_SECRET = getEnvWithFallback(
  "JWT_SECRET",
  "smarttask_jwt_dev_secret_key_change_in_prod",
  "JWT_SECRET is not set. Using insecure fallback in development.",
);

export const JWT_REFRESH_SECRET = getEnvWithFallback(
  "JWT_REFRESH_SECRET",
  "smarttask_refresh_dev_secret_key_change_in_prod",
  "JWT_REFRESH_SECRET is not set. Using insecure fallback in development.",
);

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
export const JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || "30d";

export const JWT_ISSUER = process.env.JWT_ISSUER || "your-app";
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "your-client";
