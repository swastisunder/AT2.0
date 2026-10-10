import express from "express";
import morgan from "morgan";
import ApiResponse from "./common/utils/apiResponse.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
// TODO: mount module routers here
// e.g. app.use("/api/example", exampleRouter);

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
