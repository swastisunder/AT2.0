import express from "express";
import cors from "cors";
import morgan from "morgan";
import { CORS_ORIGINS } from "./common/config/envConfig.js";
import ApiResponse from "./common/utils/apiResponse.js";
import authRouter from "./modules/auth/auth.routes.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || CORS_ORIGINS.includes(origin));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));


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

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && err.stack
      ? { stack: err.stack }
      : {}),
  });
});

export default app;
