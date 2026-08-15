import { z } from "zod";

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        dish_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Tu carrito está vacío."),
  customer_name: z.string().trim().min(3, "Indica nombre y apellidos").max(120),
  customer_email: z.string().trim().email("Email no válido").max(255),
  customer_phone: z
    .string()
    .trim()
    .min(9, "Teléfono entre 9 y 12 caracteres")
    .max(12, "Teléfono entre 9 y 12 caracteres"),
  notes: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
