import chalk from "chalk";

const logger = {
  info: (msg) => console.log(chalk.cyan(`ℹ  [INFO]    ${msg}`)),
  success: (msg) => console.log(chalk.green(`✔  [SUCCESS] ${msg}`)),
  warn: (msg) => console.warn(chalk.yellow(`⚠  [WARN]    ${msg}`)),
  error: (msg) => console.error(chalk.red(`✖  [ERROR]   ${msg}`)),
};

export default logger;
