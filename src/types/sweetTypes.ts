import { z } from "zod";

export const sweetSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().nonnegative(),
});

export type SweetInput = z.infer<typeof sweetSchema>;

// Partial for updates + ensure at least one field present
export const sweetUpdateSchema = sweetSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "at least one field required" }
);
export type SweetUpdateInput = z.infer<typeof sweetUpdateSchema>;