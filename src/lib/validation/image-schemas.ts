import { z } from "zod";
import { guidSchema } from "@/lib/validation/schemas";

export const cloudinaryUploadResultSchema = z.object({
  images: z
    .array(
      z.object({
        cloudinaryPublicId: z.string().min(1),
        secureUrl: z.string().url(),
        width: z.number().int().nullable().optional(),
        height: z.number().int().nullable().optional(),
        format: z.string().nullable().optional(),
        isPrimary: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .min(1),
});

export const signUploadSchema = z.object({
  productId: guidSchema,
});
