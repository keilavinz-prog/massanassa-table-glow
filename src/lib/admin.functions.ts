import { createServerFn } from "@tanstack/react-start";
import {
  categoryInputSchema,
  dishInputSchema,
  settingsInputSchema,
  uploadInputSchema,
  MAX_IMAGE_BYTES,
} from "./admin-schemas";
import { landingContentSchema } from "./landing-content";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Dish = Database["public"]["Tables"]["dishes"]["Row"];
export type Settings = Database["public"]["Tables"]["restaurant_settings"]["Row"];

/** Carta completa para el panel de admin. */
export const getAdminMenu = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminUser } = await import("./current-user.server");
  const { getAdminClient } = await import("./admin.server");
  await requireAdminUser();
  const supabase = getAdminClient();

  const [categoriesRes, dishesRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("dishes")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);
  if (categoriesRes.error) throw categoriesRes.error;
  if (dishesRes.error) throw dishesRes.error;

  return {
    categories: (categoriesRes.data ?? []) as Category[],
    dishes: (dishesRes.data ?? []) as Dish[],
  };
});

export const saveCategory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => categoryInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();

    if (data.id) {
      const { error } = await supabase
        .from("categories")
        .update({ name: data.name, sort_order: data.sort_order })
        .eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("categories")
        .insert({ name: data.name, sort_order: data.sort_order });
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();

    const delDishes = await supabase.from("dishes").delete().eq("category_id", data.id);
    if (delDishes.error) throw delDishes.error;
    const { error } = await supabase.from("categories").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const saveDish = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => dishInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();

    const payload = {
      category_id: data.category_id,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      allergens: data.allergens,
      image_url: data.image_url ?? null,
      is_available: data.is_available,
      is_menu_del_dia: data.is_menu_del_dia,
      sort_order: data.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await supabase.from("dishes").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("dishes").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteDish = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();
    const { error } = await supabase.from("dishes").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const toggleDishAvailability = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), is_available: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("dishes")
      .update({ is_available: data.is_available, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const getAdminSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminUser } = await import("./current-user.server");
  const { getAdminClient } = await import("./admin.server");
  await requireAdminUser();
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Settings | null;
});

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => settingsInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("restaurant_settings")
      .update({
        name: data.name,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code || null,
        phone: data.phone,
        whatsapp_phone: data.whatsapp_phone || null,
        email: data.email || null,
        opening_hours: data.opening_hours,
        description: data.description || null,
        logo_url: data.logo_url || null,
        hero_image_url: data.hero_image_url || null,
        instagram_url: data.instagram_url || null,
        facebook_url: data.facebook_url || null,
        nav_labels: data.nav_labels,
        historia_texto: data.historia_texto || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });

/** Guarda los textos editables de la landing. Solo admin. */
export const saveLandingContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => landingContentSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient } = await import("./admin.server");
    await requireAdminUser();
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("restaurant_settings")
      .update({ landing_content: data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });

/** Sube una imagen. Valida rol admin en servidor ANTES de aceptar el archivo. */
export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => uploadInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdminUser } = await import("./current-user.server");
    const { getAdminClient, base64ToBytes, safeFileName, SIGNED_URL_TTL_SECONDS } = await import(
      "./admin.server"
    );
    await requireAdminUser();

    const bytes = base64ToBytes(data.dataBase64);
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("La imagen supera el máximo de 5MB.");
    }

    const supabase = getAdminClient();
    const path = safeFileName(data.fileName);
    const upload = await supabase.storage
      .from(data.bucket)
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upload.error) throw upload.error;

    const signed = await supabase.storage
      .from(data.bucket)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (signed.error) throw signed.error;

    return { url: signed.data.signedUrl, path };
  });
