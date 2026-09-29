import pino from "pino";
import { config } from "@src/config";

export const logger = pino({
  level: config.log.level,
  base: { instance: config.instanceId },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ["req.headers.authorization", "req.headers.cookie"],
  transport: config.log.pretty
    ? { target: "pino-pretty", options: { colorize: true, singleLine: true, translateTime: "SYS:HH:MM:ss.l", ignore: "pid,hostname,instance" } }
    : undefined,
});
