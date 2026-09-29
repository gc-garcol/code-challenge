import { z } from "zod";
import { RESOURCE_STATUSES } from "@src/entities/resource.entity";

export const SORTABLE_FIELDS = ["name", "category", "status", "createdAt", "updatedAt"] as const;
export const SORT_ORDERS = ["asc", "desc"] as const;

type SortField = (typeof SORTABLE_FIELDS)[number];
type SortOrder = (typeof SORT_ORDERS)[number];
export type SortItem = { field: SortField; order: SortOrder };

const DEFAULT_SORT: SortItem[] = [{ field: "createdAt", order: "desc" }];
const DEFAULT_ORDER: SortOrder = "asc";

const findCaseInsensitive = <T extends string>(values: readonly T[], input: string) =>
  values.find((value) => value.toLowerCase() === input.toLowerCase());

const sortItemSchema = z.string().transform((raw, ctx): SortItem => {
  const [rawField = "", rawOrder, ...rest] = raw.split(",").map((part) => part.trim());
  const field = findCaseInsensitive(SORTABLE_FIELDS, rawField);
  const order = rawOrder ? findCaseInsensitive(SORT_ORDERS, rawOrder) : DEFAULT_ORDER;
  if (!field) {
    ctx.addIssue({
      code: "custom",
      message: `Invalid sort field "${rawField}". Expected one of: ${SORTABLE_FIELDS.join(", ")}`,
    });
  }
  if (!order) {
    ctx.addIssue({ code: "custom", message: `Invalid sort direction "${rawOrder}". Expected asc or desc` });
  }
  if (rest.length > 0) {
    ctx.addIssue({ code: "custom", message: `Invalid sort "${raw}". Expected "field" or "field,direction"` });
  }
  return field && order && rest.length === 0 ? { field, order } : z.NEVER;
});

const sortParamSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]).filter((item) => item.trim() !== ""))
  .pipe(z.array(sortItemSchema))
  .superRefine((items, ctx) => {
    const fields = items.map((item) => item.field);
    if (new Set(fields).size !== fields.length) {
      ctx.addIssue({ code: "custom", message: "sort must not contain duplicate fields" });
    }
  });

const statusSchema = z.enum(RESOURCE_STATUSES).meta({ id: "ResourceStatus" });

export const resourceIdSchema = z.object({
  id: z.uuid().meta({ description: "Resource id", example: "4085e313-8910-4e3d-a661-faa2080dd531" }),
});

export const resourceSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    category: z.string(),
    status: statusSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Resource" });

export const createResourceSchema = z
  .object({
    name: z.string().trim().min(1).max(255).meta({ example: "Laptop" }),
    description: z.string().trim().max(5000).nullish().meta({ example: "MacBook Pro 14" }),
    category: z.string().trim().min(1).max(100).meta({ example: "hardware" }),
    status: statusSchema.optional(),
  })
  .meta({ id: "CreateResourceInput" });

export const updateResourceSchema = createResourceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" })
  .meta({ id: "UpdateResourceInput", description: "At least one field is required" });

export const listResourcesSchema = z
  .object({
    name: z.string().trim().min(1).optional().meta({ description: "Case-insensitive partial match" }),
    category: z.string().trim().min(1).optional().meta({ description: "Exact match" }),
    status: statusSchema.optional(),
    createdFrom: z.coerce.date().optional().meta({ description: "Created at or after (ISO date)", example: "2026-01-01" }),
    createdTo: z.coerce.date().optional().meta({ description: "Created at or before (ISO date)", example: "2026-12-31" }),
    sort: sortParamSchema.optional().meta({
      description: `Repeatable, format "field,direction". Fields: ${SORTABLE_FIELDS.join(", ")}. Direction: asc | desc (case-insensitive, default asc). Applied in the given order. Default: createdAt,desc`,
      override: ({ jsonSchema }) => {
        delete jsonSchema.anyOf;
        Object.assign(jsonSchema, {
          type: "array",
          items: { type: "string" },
          example: ["status,asc", "category,desc"],
        });
      },
    }),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .transform(({ sort, ...rest }) => ({
    ...rest,
    sort: sort?.length ? sort : DEFAULT_SORT,
  }));

export const resourceListSchema = z
  .object({
    data: z.array(resourceSchema),
    meta: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
      sort: z.array(z.object({ field: z.enum(SORTABLE_FIELDS), order: z.enum(SORT_ORDERS) })),
    }),
  })
  .meta({ id: "ResourceList" });

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ListResourcesQuery = z.infer<typeof listResourcesSchema>;
