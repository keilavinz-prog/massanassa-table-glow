import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { getAdminSettings, saveLandingContent } from "@/lib/admin.functions";
import {
  DEFAULT_LANDING_CONTENT,
  LANDING_FIELD_GROUPS,
  resolveLandingContent,
  type LandingContent,
} from "@/lib/landing-content";

const inputClass =
  "w-full rounded-sm border border-input bg-background px-3 py-2 text-body outline-none focus:border-terracota";
const primaryBtn =
  "tap-target transition-warm inline-flex items-center gap-2 rounded-md bg-terracota px-5 py-2.5 text-body font-medium text-white hover:opacity-90 disabled:opacity-60";
const ghostBtn =
  "tap-target transition-warm inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-small hover:bg-accent/20";

export function LandingSection() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getAdminSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => fetchSettings(),
    throwOnError: true,
  });
  const saveFn = useServerFn(saveLandingContent);

  const [form, setForm] = useState<LandingContent | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm(resolveLandingContent(data.landing_content));
  }, [data]);

  const mutation = useMutation({
    mutationFn: saveFn,
    onSuccess: () => {
      toast.success("Textos de la portada actualizados");
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["landing"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "No se pudieron guardar los textos"),
  });

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-md bg-muted/70 shadow-warm" />
        ))}
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ data: form });
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-h2">Portada</h2>
          <p className="mt-1 text-small text-muted-foreground">
            Todos los textos de la página de inicio. La descripción del restaurante, el
            teléfono, la dirección, el horario y las imágenes se editan en la pestaña
            “Restaurante”.
          </p>
        </div>
        <button
          type="button"
          className={ghostBtn}
          onClick={() => setForm({ ...DEFAULT_LANDING_CONTENT })}
        >
          <RotateCcw className="size-4" /> Restaurar textos originales
        </button>
      </div>

      {LANDING_FIELD_GROUPS.map((group) => (
        <section key={group.title} className="space-y-4 rounded-md bg-card p-5 shadow-warm">
          <h3 className="font-display text-h3">{group.title}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <label
                key={field.key}
                className={`block space-y-1 ${field.multiline ? "sm:col-span-2" : ""}`}
              >
                <span className="text-small font-medium">{field.label}</span>
                {field.multiline ? (
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <button type="submit" className={primaryBtn} disabled={mutation.isPending}>
        Guardar portada
      </button>
    </form>
  );
}
