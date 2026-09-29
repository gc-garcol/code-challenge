import { Router } from "express";
import { config } from "@src/config";
import { AppDataSource } from "@src/db/data-source";

export const createHealthRouter = () => {
  const router = Router();

  router.get("/", async (_req, res) => {
    await AppDataSource.query("SELECT 1");
    res.json({ status: "ok", instance: config.instanceId });
  });

  return router;
};
