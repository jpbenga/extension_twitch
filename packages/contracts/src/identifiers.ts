import { z } from "zod";
export const identifierSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,39}$/)
  .refine((id) => !["constructor", "prototype"].includes(id));
export const gameLabelSchema = z.string().trim().min(1).max(80);
