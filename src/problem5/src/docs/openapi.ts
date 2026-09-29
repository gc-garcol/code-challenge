import { createDocument } from "zod-openapi";
import { errorSchema, healthSchema } from "@src/schemas/common.schema";
import {
  createResourceSchema,
  listResourcesSchema,
  resourceIdSchema,
  resourceListSchema,
  resourceSchema,
  updateResourceSchema,
} from "@src/schemas/resource.schema";

const json = <T>(schema: T) => ({ content: { "application/json": { schema } } });

const errorResponse = (description: string) => ({ description, ...json(errorSchema) });

const requestIdHeader = {
  in: "header" as const,
  name: "X-Request-Id",
  required: false,
  description: "Optional correlation id, echoed back in the response header",
  schema: { type: "string" as const },
};

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Resource API",
    version: "1.0.0",
    description: "CRUD API for resources built with Express, TypeORM and PostgreSQL",
  },
  tags: [{ name: "Resources" }, { name: "Health" }],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": { description: "Service and database are healthy", ...json(healthSchema) },
          "500": errorResponse("Database unavailable"),
        },
      },
    },
    "/resources": {
      post: {
        tags: ["Resources"],
        summary: "Create a resource",
        parameters: [requestIdHeader],
        requestBody: { required: true, ...json(createResourceSchema) },
        responses: {
          "201": { description: "Created", ...json(resourceSchema) },
          "400": errorResponse("Validation failed"),
        },
      },
      get: {
        tags: ["Resources"],
        summary: "List resources with filters, multi-field sorting and pagination",
        parameters: [requestIdHeader],
        requestParams: { query: listResourcesSchema },
        responses: {
          "200": { description: "Paginated list", ...json(resourceListSchema) },
          "400": errorResponse("Invalid query"),
        },
      },
    },
    "/resources/{id}": {
      get: {
        tags: ["Resources"],
        summary: "Get a resource",
        parameters: [requestIdHeader],
        requestParams: { path: resourceIdSchema },
        responses: {
          "200": { description: "Resource", ...json(resourceSchema) },
          "400": errorResponse("Invalid id"),
          "404": errorResponse("Not found"),
        },
      },
      patch: {
        tags: ["Resources"],
        summary: "Update a resource",
        parameters: [requestIdHeader],
        requestParams: { path: resourceIdSchema },
        requestBody: { required: true, ...json(updateResourceSchema) },
        responses: {
          "200": { description: "Updated resource", ...json(resourceSchema) },
          "400": errorResponse("Validation failed"),
          "404": errorResponse("Not found"),
        },
      },
      delete: {
        tags: ["Resources"],
        summary: "Delete a resource permanently",
        parameters: [requestIdHeader],
        requestParams: { path: resourceIdSchema },
        responses: {
          "204": { description: "Deleted" },
          "400": errorResponse("Invalid id"),
          "404": errorResponse("Not found"),
        },
      },
    },
  },
});
