import { createServerFn } from "@tanstack/react-start";
import {
  createUserSchema,
  deleteUserSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "./users-schemas";

export type ManagedUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  is_self: boolean;
};

/** Lista los usuarios del backend con su rol efectivo. Solo admin. */
export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminUser } = await import("./current-user.server");
  const { getAdminClient } = await import("./admin.server");
  const me = await requireAdminUser();
  const supabase = getAdminClient();

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (authError) throw authError;

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, role");
  if (profilesError) throw profilesError;

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const users: ManagedUser[] = authData.users.map((u) => {
    const profile = byId.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      full_name: profile?.full_name ?? null,
      role: profile?.role ?? "empleado",
      created_at: u.created_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
      is_self: u.id === me.id,
    };
  });

  users.sort((a, b) => a.email.localeCompare(b.email));
  return users;
});

/** Crea un usuario con email/contraseña y le asigna el rol indicado. Solo admin. */
export const createUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();

    const { data: created, error } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    const userId = created.user?.id;
    if (!userId) throw new Error("No se pudo crear el usuario.");

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, full_name: data.full_name || null, role: data.role },
        { onConflict: "id" },
      );
    if (profileError) throw profileError;

    return { id: userId };
  });

/** Cambia nombre y rol de un usuario. Un admin no puede quitarse su propio rol. Solo admin. */
export const updateUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    const me = await requireAdminUser();
    if (me.id === data.id && data.role !== "admin") {
      throw new Error("No puedes quitarte tu propio rol de administrador.");
    }
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.full_name ?? null, role: data.role })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Define una nueva contraseña para un usuario. Solo admin. */
export const resetUserPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resetPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.updateUserById(data.id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Elimina un usuario. Nunca la propia cuenta. Solo admin. */
export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deleteUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    const me = await requireAdminUser();
    if (me.id === data.id) throw new Error("No puedes eliminar tu propia cuenta.");
    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
