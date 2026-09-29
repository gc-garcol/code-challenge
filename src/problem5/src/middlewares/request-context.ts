import { RequestHandler } from "express";
import { runWithLogger } from "@src/logger/context";

export const requestContext: RequestHandler = (req, _res, next) => {
  runWithLogger(req.log, next);
};
