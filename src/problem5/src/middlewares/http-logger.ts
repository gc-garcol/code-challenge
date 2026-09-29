import { randomUUID } from "node:crypto";
import { IncomingMessage } from "node:http";
import { pinoHttp } from "pino-http";
import { logger } from "@src/logger";

const REQUEST_ID_HEADER = "x-request-id";

const urlOf = (req: IncomingMessage) => ("originalUrl" in req ? String(req.originalUrl) : req.url);

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = typeof incoming === "string" && incoming.length > 0 && incoming.length <= 128 ? incoming : randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  autoLogging: {
    ignore: (req) => req.url === "/health" || req.url?.startsWith("/docs") === true,
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res, responseTime) =>
    `${req.method} ${urlOf(req)} ${res.statusCode} ${Math.round(responseTime)}ms`,
  customErrorMessage: (req, res) => `${req.method} ${urlOf(req)} ${res.statusCode}`,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.headers?.["x-real-ip"] ?? req.remoteAddress,
      userAgent: req.headers?.["user-agent"],
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
