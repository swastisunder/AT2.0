import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import morgan from "morgan";
import mongoose from "mongoose";
import { CORS_ORIGINS, NODE_ENV } from "./common/config/envConfig.js";
import ApiResponse from "./common/utils/apiResponse.js";
import logger from "./common/utils/logger.js";
import authRouter from "./modules/auth/auth.routes.js";

const app = express();

app.set("trust proxy", 1);

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || CORS_ORIGINS.includes(origin));
    },
    credentials: true,
  }),
);

// Compression
app.use(compression());

// Structured logging
if (NODE_ENV === "production") {
  app.use((req, res, next) => {
    const startTime = process.hrtime();
    res.on("finish", () => {
      const diff = process.hrtime(startTime);
      const responseTimeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTime: `${responseTimeMs}ms`,
        ip: req.ip,
      };
      console.log(JSON.stringify(logData));
    });
    next();
  });
} else {
  app.use(morgan("dev"));
}

// Body parsers with size limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Input sanitization against NoSQL injection & HTTP Parameter Pollution
app.use(mongoSanitize());
app.use(hpp());

// Routes
app.use("/api/auth", authRouter);

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (_req, res) => {
  const uptimeInSeconds = Math.floor(process.uptime());
  const uptime =
    uptimeInSeconds >= 31_536_000
      ? `${Math.floor(uptimeInSeconds / 31_536_000)}y`
      : uptimeInSeconds >= 86_400
        ? `${Math.floor(uptimeInSeconds / 86_400)}d`
        : uptimeInSeconds >= 3_600
          ? `${Math.floor(uptimeInSeconds / 3_600)}h`
          : uptimeInSeconds >= 60
            ? `${Math.floor(uptimeInSeconds / 60)}m`
            : `${uptimeInSeconds}s`;

  return ApiResponse.ok(res, "Server is running", { uptime });
});

app.get("/api/health/ready", async (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const isReady = mongoReady;
  const statusCode = isReady ? 200 : 503;

  return res.status(statusCode).json({
    success: isReady,
    status: isReady ? "ready" : "not ready",
    services: {
      mongodb: mongoReady ? "connected" : "disconnected",
    },
  });
});

// 404 Route Not Found handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  logger.error(err.stack || err.message || err);

  const message =
    NODE_ENV === "production" && statusCode >= 500
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(NODE_ENV === "development" && err.stack ? { stack: err.stack } : {}),
  });
});

export default app;
