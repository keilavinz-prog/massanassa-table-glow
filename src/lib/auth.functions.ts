import { createServerFn } from "@tanstack/react-start";
import { resolveCurrentUser } from "./current-user.server";

export type { AppRole, CurrentUser } from "./current-user.server";

/**
 * Única fuente de verdad para decidir acceso a rutas protegidas.
 */
export const getCurrentUserWithRole = createServerFn({ method: "GET" }).handler(
  async () => resolveCurrentUser(),
);
