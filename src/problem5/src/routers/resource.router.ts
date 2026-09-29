import { Router } from "express";
import { ResourceService } from "@src/services/resource.service";
import {
  createResourceSchema,
  listResourcesSchema,
  resourceIdSchema,
  updateResourceSchema,
} from "@src/schemas/resource.schema";

export const createResourceRouter = (service = new ResourceService()) => {
  const router = Router();

  router.post("/", async (req, res) => {
    const input = createResourceSchema.parse(req.body);
    res.status(201).json(await service.create(input));
  });

  router.get("/", async (req, res) => {
    const query = listResourcesSchema.parse(req.query);
    res.json(await service.list(query));
  });

  router.get("/:id", async (req, res) => {
    const { id } = resourceIdSchema.parse(req.params);
    res.json(await service.get(id));
  });

  router.patch("/:id", async (req, res) => {
    const { id } = resourceIdSchema.parse(req.params);
    const input = updateResourceSchema.parse(req.body);
    res.json(await service.update(id, input));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = resourceIdSchema.parse(req.params);
    await service.remove(id);
    res.status(204).end();
  });

  return router;
};
