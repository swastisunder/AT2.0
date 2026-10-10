import chalk from "chalk";

/**
 * Lightweight coloured logger.
 *
 * Usage:
 *   import logger from "./logger.js";
 *   logger.info("Server started");
 *   logger.success("DB connected");
 *   logger.warn("Deprecation notice");
 *   logger.error("Something broke");
 */
const logger = {
  info: (msg) => console.log(chalk.cyan(`ℹ  [INFO]    ${msg}`)),
  success: (msg) => console.log(chalk.green(`✔  [SUCCESS] ${msg}`)),
  warn: (msg) => console.warn(chalk.yellow(`⚠  [WARN]    ${msg}`)),
  error: (msg) => console.error(chalk.red(`✖  [ERROR]   ${msg}`)),
};

export default logger;

