import { z } from "zod";

export const errorSchema = z
  .object({
    error: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  })
  .meta({ id: "Error" });

export const healthSchema = z
  .object({
    status: z.literal("ok"),
    instance: z.string(),
  })
  .meta({ id: "Health" });
