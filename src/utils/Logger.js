import packageJson from "#/package.json";
import Logger from "winston-logger/Logger";
import LogLevel from "winston-logger/LogLevel";

const logger = new Logger("mtg-tools", {
  packageFile: packageJson,
  maxSize: 5242880,
  maxFiles: 10,
});

logger.addTail();
logger.addTransport(LogLevel.WARN);
logger.addTransport(LogLevel.DEBUG);

export default logger;
