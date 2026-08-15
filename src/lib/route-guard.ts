import { redirect } from "@tanstack/react-router";
import { getCurrentUserWithRole, type AppRole, type CurrentUser } from "./auth.functions";

/** Resuelve el acceso en el servidor antes de renderizar contenido protegido. */
export async function requireRole(allowed: AppRole[]): Promise<{ user: CurrentUser }> {
  const user = await getCurrentUserWithRole();
  if (!user) throw redirect({ to: "/login" });
  if (!allowed.includes(user.role)) throw redirect({ to: "/acceso-denegado" });
  return { user };
}
