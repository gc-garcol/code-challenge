import { RequestHandler } from "express";
import { config } from "@src/config";

export const instanceId: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Instance-Id", config.instanceId);
  next();
};
