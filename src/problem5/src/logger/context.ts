import { AsyncLocalStorage } from "node:async_hooks";
import { Logger } from "pino";
import { logger } from "@src/logger";

const storage = new AsyncLocalStorage<Logger>();

export const runWithLogger = <T>(requestLogger: Logger, fn: () => T) => storage.run(requestLogger, fn);

export const currentLogger = () => storage.getStore() ?? logger;
