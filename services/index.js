import { createServer } from "http";
import app from "./src/app.js";
import { NODE_ENV, PORT } from "./src/common/config/envConfig.js";
import connectDB from "./src/common/config/db.js";
import logger from "./src/common/utils/logger.js";

const startServer = async () => {
  try {
    await connectDB();

    const server = createServer(app);
    server.listen(PORT, () => {
      logger.success(
        `Server is running on http://localhost:${PORT} in ${NODE_ENV} mode`,
      );
    });
  } catch (error) {
    logger.error(`Error starting the server: ${error.message}`);
  }
};

startServer();
