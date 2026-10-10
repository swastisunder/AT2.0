import express from "express";
import morgan from "morgan";

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
