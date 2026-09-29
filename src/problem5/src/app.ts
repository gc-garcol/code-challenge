import express from "express";
import { errorHandler, notFoundHandler } from "@src/middlewares/error-handler";
import { httpLogger } from "@src/middlewares/http-logger";
import { instanceId } from "@src/middlewares/instance-id";
import { requestContext } from "@src/middlewares/request-context";
import { createRouter } from "@src/routers";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.use(instanceId);
  app.use(httpLogger);
  app.use(requestContext);
  app.use(express.json());

  app.use(createRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
