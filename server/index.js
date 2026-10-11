import { createServer } from "http";
import mongoose from "mongoose";
import app from "./src/app.js";
import { NODE_ENV, PORT } from "./src/common/config/envConfig.js";
import connectDB from "./src/common/config/db.js";
import logger from "./src/common/utils/logger.js";

const startServer = async () => {
  try {
    await connectDB();

    const server = createServer(app);
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    server.listen(PORT, () => {
      logger.success(
        `Server is running on http://localhost:${PORT} in ${NODE_ENV} mode`,
      );
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);

      server.close(async () => {
        logger.info("HTTP server closed.");

        try {
          await mongoose.disconnect();
          logger.info("MongoDB connection closed.");
        } catch (err) {
          logger.error(`Error disconnecting MongoDB: ${err.message}`);
        }

        process.exit(0);
      });

      // Force close if graceful shutdown exceeds 10 seconds
      setTimeout(() => {
        logger.error(
          "Graceful shutdown timed out, forcefully terminating process.",
        );
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error(`Error starting the server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
