import { Router } from "express";
import { config } from "@src/config";
import { createDocsRouter } from "@src/routers/docs.router";
import { createHealthRouter } from "@src/routers/health.router";
import { createResourceRouter } from "@src/routers/resource.router";

export const createRouter = () => {
  const router = Router();

  router.use("/health", createHealthRouter());
  router.use("/resources", createResourceRouter());
  if (config.docs.enabled) router.use("/docs", createDocsRouter());

  return router;
};
