import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { getAdminSettings, saveSettings } from "@/lib/admin.functions";
import { ImageField } from "./ImageField";

const inputClass =
  "w-full rounded-sm border border-input bg-background px-3 py-2 text-body outline-none focus:border-terracota";
const primaryBtn =
  "transition-warm inline-flex items-center gap-2 rounded-md bg-terracota px-5 py-2.5 text-body font-medium text-white hover:opacity-90 disabled:opacity-60";
const ghostBtn =
  "transition-warm inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-small hover:bg-accent/20";

type Form = {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  whatsapp_phone: string;
  email: string;
  description: string;
  logo_url: string | null;
  hero_image_url: string | null;
  instagram_url: string;
  facebook_url: string;
};

export function RestauranteSection() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getAdminSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => fetchSettings(),
  });
  const saveFn = useServerFn(saveSettings);

  const [form, setForm] = useState<Form | null>(null);
  const [hours, setHours] = useState<Array<[string, string]>>([]);

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      address: data.address,
      city: data.city,
      postal_code: data.postal_code ?? "",
      phone: data.phone,
      whatsapp_phone: data.whatsapp_phone ?? "",
      email: data.email ?? "",
      description: data.description ?? "",
      logo_url: data.logo_url,
      hero_image_url: data.hero_image_url,
      instagram_url: data.instagram_url ?? "",
      facebook_url: data.facebook_url ?? "",
    });
    const raw = (data.opening_hours ?? {}) as Record<string, unknown>;
    setHours(Object.entries(raw).map(([k, v]) => [k, String(v)]));
  }, [data]);

  const mutation = useMutation({
    mutationFn: saveFn,
    onSuccess: () => {
      toast.success("Datos actualizados");
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "No se pudieron guardar los datos"),
  });

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted/70" />
        ))}
      </div>
    );
  }

  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.whatsapp_phone && !/^\d+$/.test(form.whatsapp_phone)) {
          toast.error("WhatsApp: solo dígitos, sin +");
          return;
        }
        const opening_hours: Record<string, string> = {};
        for (const [k, v] of hours) if (k.trim()) opening_hours[k.trim()] = v;
        mutation.mutate({
          data: {
            name: form.name,
            address: form.address,
            city: form.city,
            postal_code: form.postal_code,
            phone: form.phone,
            whatsapp_phone: form.whatsapp_phone,
            email: form.email,
            opening_hours,
            description: form.description,
            logo_url: form.logo_url,
            hero_image_url: form.hero_image_url,
            instagram_url: form.instagram_url,
            facebook_url: form.facebook_url,
          },
        });
      }}
    >
      <h2 className="font-display text-h2">Restaurante</h2>

      <div className="grid gap-4 rounded-md bg-card p-5 shadow-warm sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-small font-medium">Nombre</span>
          <input
            className={inputClass}
            required
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">Dirección</span>
          <input
            className={inputClass}
            required
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">Ciudad</span>
          <input
            className={inputClass}
            required
            value={form.city}
            onChange={(e) => set({ city: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">Código postal</span>
          <input
            className={inputClass}
            value={form.postal_code}
            onChange={(e) => set({ postal_code: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">Teléfono</span>
          <input
            className={inputClass}
            required
            placeholder="961 25 43 21"
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">WhatsApp</span>
          <input
            className={inputClass}
            inputMode="numeric"
            placeholder="34612345678"
            value={form.whatsapp_phone}
            onChange={(e) => set({ whatsapp_phone: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">Email</span>
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">Instagram</span>
          <input
            className={inputClass}
            value={form.instagram_url}
            onChange={(e) => set({ instagram_url: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">Facebook</span>
          <input
            className={inputClass}
            value={form.facebook_url}
            onChange={(e) => set({ facebook_url: e.target.value })}
          />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-small font-medium">Descripción</span>
          <textarea
            className={inputClass}
            rows={4}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </label>
      </div>

      <div className="space-y-3 rounded-md bg-card p-5 shadow-warm">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-h3">Horario</h3>
          <button
            type="button"
            className={ghostBtn}
            onClick={() => setHours([...hours, ["", ""]])}
          >
            <Plus className="size-4" /> Añadir día
          </button>
        </div>
        <div className="space-y-2">
          {hours.map(([key, value], index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <input
                className={`${inputClass} max-w-[140px]`}
                placeholder="lun"
                aria-label="Día"
                value={key}
                onChange={(e) => {
                  const next = [...hours];
                  next[index] = [e.target.value, value];
                  setHours(next);
                }}
              />
              <input
                className={`${inputClass} max-w-xs`}
                placeholder="cerrado"
                aria-label="Horario"
                value={value}
                onChange={(e) => {
                  const next = [...hours];
                  next[index] = [key, e.target.value];
                  setHours(next);
                }}
              />
              <button
                type="button"
                aria-label="Quitar día"
                className={ghostBtn}
                onClick={() => setHours(hours.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 rounded-md bg-card p-5 shadow-warm sm:grid-cols-2">
        <ImageField
          bucket="restaurant-assets"
          label="Logo"
          value={form.logo_url}
          onChange={(url) => set({ logo_url: url })}
        />
        <ImageField
          bucket="restaurant-assets"
          label="Imagen hero"
          value={form.hero_image_url}
          onChange={(url) => set({ hero_image_url: url })}
        />
      </div>

      <button type="submit" className={primaryBtn} disabled={mutation.isPending}>
        Guardar cambios
      </button>
    </form>
  );
}
