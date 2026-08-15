import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type OpeningHours = Record<string, string>;

export type RestaurantSettings =
  Database["public"]["Tables"]["restaurant_settings"]["Row"];

export type CategoryWithCount = {
  id: string;
  name: string;
  sort_order: number;
  available_dishes: number;
};

function getPublicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export const getLandingData = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = getPublicClient();

    const [settingsRes, categoriesRes, dishesRes] = await Promise.all([
      supabase.from("restaurant_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true }),
      supabase.from("dishes").select("category_id, is_available"),
    ]);

    if (settingsRes.error) throw settingsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;
    if (dishesRes.error) throw dishesRes.error;

    const counts = new Map<string, number>();
    for (const dish of dishesRes.data ?? []) {
      if (!dish.is_available) continue;
      counts.set(dish.category_id, (counts.get(dish.category_id) ?? 0) + 1);
    }

    const categories: CategoryWithCount[] = (categoriesRes.data ?? []).map(
      (c) => ({
        id: c.id,
        name: c.name,
        sort_order: c.sort_order,
        available_dishes: counts.get(c.id) ?? 0,
      }),
    );

    return {
      settings: settingsRes.data ?? null,
      categories,
    };
  },
);
