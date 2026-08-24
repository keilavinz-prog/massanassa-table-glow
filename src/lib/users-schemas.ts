import { z } from "zod";

export const APP_ROLES = ["admin", "empleado", "proveedor"] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  empleado: "Equipo",
  proveedor: "Proveedor",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Acceso total: carta, landing, restaurante, QR, catering y usuarios.",
  empleado: "Acceso a /equipo: reservas y pedidos del día.",
  proveedor: "Acceso a /proveedor: solicitudes de catering asignadas.",
};

export const createUserSchema = z.object({
  email: z.string().trim().email("Email no válido").max(255),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72),
  full_name: z.string().trim().max(120).optional(),
  role: z.enum(APP_ROLES),
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().max(120).nullable().optional(),
  role: z.enum(APP_ROLES),
});

export const resetPasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72),
});

export const deleteUserSchema = z.object({ id: z.string().uuid() });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
