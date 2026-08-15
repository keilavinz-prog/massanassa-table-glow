import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = "admin" | "empleado" | "proveedor";

export type CurrentUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
};

/**
 * Fuente de verdad del acceso: valida el token del request en el servidor y
 * lee el rol efectivo desde public.profiles. Nunca confía en el cliente.
 */
export const getCurrentUserWithRole = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser | null> => {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.slice("Bearer ".length);
    if (token.split(".").length !== 3) return null;

    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;

    const supabase = createClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) return null;

    const role = (profile?.role ?? "empleado") as AppRole;

    return {
      id: userData.user.id,
      email: userData.user.email ?? "",
      full_name: profile?.full_name ?? null,
      role,
    };
  },
);
