import packageJson from "#/package.json";
import { Logger, LogLevel } from "winston-logger";

const logger = new Logger("mtg-tools", { packageFile: packageJson });

logger.addTail();
logger.addConsole(LogLevel.WARN);
logger.addTransport(LogLevel.WARN);
logger.addTransport(LogLevel.DEBUG);

export default logger;
