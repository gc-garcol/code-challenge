import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "@src/docs/openapi";

export const createDocsRouter = () => {
  const router = Router();

  router.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });
  router.use("/", swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: "Resource API" }));

  return router;
};
