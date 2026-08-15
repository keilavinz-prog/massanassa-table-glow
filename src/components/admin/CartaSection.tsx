import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteCategory,
  deleteDish,
  getAdminMenu,
  saveCategory,
  saveDish,
  toggleDishAvailability,
  type Category,
  type Dish,
} from "@/lib/admin.functions";
import { ALLERGENS, ALLERGEN_LABELS } from "@/lib/admin-schemas";
import { ImageField } from "./ImageField";

const inputClass =
  "w-full rounded-sm border border-input bg-background px-3 py-2 text-body outline-none focus:border-terracota";
const primaryBtn =
  "transition-warm inline-flex items-center gap-2 rounded-md bg-terracota px-4 py-2 text-small font-medium text-white hover:opacity-90 disabled:opacity-60";
const ghostBtn =
  "transition-warm inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-small hover:bg-accent/20";

type CategoryDraft = { id?: string; name: string; sort_order: string };
type DishDraft = {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  allergens: string[];
  image_url: string | null;
  is_available: boolean;
  is_menu_del_dia: boolean;
  sort_order: string;
};

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="safe-px fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] items-start justify-center overflow-y-auto overscroll-contain bg-dark-brown/50 p-4 py-10">
      <div className="mb-[env(safe-area-inset-bottom,0px)] w-full max-w-lg rounded-md bg-cream p-6 shadow-warm-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-h3">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="tap-target transition-warm inline-flex items-center justify-center rounded-sm px-2 text-small underline hover:text-terracota"
          >
            Cerrar
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/**
 * Botón opcional de redacción asistida. Siempre visible; deshabilitado con
 * tooltip cuando el entorno no tiene el asistente configurado.
 */
function AiDescriptionButton({
  configured,
  name,
  category,
  allergens,
  onSuggestion,
}: {
  configured: boolean;
  name: string;
  category: string;
  allergens: string[];
  onSuggestion: (text: string) => void;
}) {
  const suggestFn = useServerFn(suggestDishDescription);
  const mutation = useMutation({
    mutationFn: () => suggestFn({ data: { name: name.trim(), category, allergens } }),
    onSuccess: (result) => {
      onSuggestion(result.suggestion);
      toast.success("Sugerencia lista: revísala antes de guardar");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const hasName = name.trim().length >= 2;
  const disabled = !configured || !hasName || mutation.isPending;
  const title = !configured
    ? "IA no configurada en este entorno"
    : !hasName
      ? "Escribe primero el nombre del plato"
      : "Genera una sugerencia de descripción";

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${ghostBtn} tap-target disabled:cursor-not-allowed`}
    >
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4 text-gold" />
      )}
      {mutation.isPending ? "Redactando…" : "Sugerir descripción con IA"}
    </button>
  );
}

export function CartaSection() {
  const queryClient = useQueryClient();
  const fetchMenu = useServerFn(getAdminMenu);
  const { data, isLoading } = useQuery({ queryKey: ["admin-menu"], queryFn: () => fetchMenu() });

  const aiStatusFn = useServerFn(getAiAssistantStatus);
  const { data: aiStatus } = useQuery({
    queryKey: ["ai-assistant-status"],
    queryFn: () => aiStatusFn(),
    staleTime: 10 * 60 * 1000,
  });
  const aiConfigured = aiStatus?.configured ?? false;


  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [dishDraft, setDishDraft] = useState<DishDraft | null>(null);

  const saveCategoryFn = useServerFn(saveCategory);
  const deleteCategoryFn = useServerFn(deleteCategory);
  const saveDishFn = useServerFn(saveDish);
  const deleteDishFn = useServerFn(deleteDish);
  const toggleFn = useServerFn(toggleDishAvailability);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
  const onError = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : "Operación no permitida");

  const categoryMutation = useMutation({
    mutationFn: saveCategoryFn,
    onSuccess: () => {
      setCategoryDraft(null);
      toast.success("Categoría guardada");
      void invalidate();
    },
    onError,
  });
  const categoryDelete = useMutation({
    mutationFn: deleteCategoryFn,
    onSuccess: () => {
      toast.success("Categoría eliminada");
      void invalidate();
    },
    onError,
  });
  const dishMutation = useMutation({
    mutationFn: saveDishFn,
    onSuccess: () => {
      setDishDraft(null);
      toast.success("Plato guardado");
      void invalidate();
    },
    onError,
  });
  const dishDelete = useMutation({
    mutationFn: deleteDishFn,
    onSuccess: () => {
      toast.success("Plato eliminado");
      void invalidate();
    },
    onError,
  });
  const availability = useMutation({
    mutationFn: toggleFn,
    onSuccess: () => void invalidate(),
    onError,
  });

  const categories: Category[] = data?.categories ?? [];
  const dishesByCategory = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const dish of data?.dishes ?? []) {
      const list = map.get(dish.category_id) ?? [];
      list.push(dish);
      map.set(dish.category_id, list);
    }
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-md bg-muted/70" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h2">Carta</h2>
        <button
          type="button"
          className={primaryBtn}
          onClick={() => setCategoryDraft({ name: "", sort_order: "0" })}
        >
          <Plus className="size-4" /> Nueva categoría
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const dishes = dishesByCategory.get(category.id) ?? [];
          const isOpen = open[category.id] ?? true;
          return (
            <section key={category.id} className="rounded-md bg-card shadow-warm">
              <header className="flex flex-wrap items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setOpen((s) => ({ ...s, [category.id]: !isOpen }))}
                  className="flex items-center gap-2 text-left"
                >
                  <ChevronDown
                    className={`transition-warm size-4 ${isOpen ? "" : "-rotate-90"}`}
                  />
                  <span className="font-display text-h3">{category.name}</span>
                  <span className="text-small text-muted-foreground">
                    ({dishes.length} platos · orden {category.sort_order})
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() =>
                      setDishDraft({
                        category_id: category.id,
                        name: "",
                        description: "",
                        price: "",
                        allergens: [],
                        image_url: null,
                        is_available: true,
                        is_menu_del_dia: false,
                        sort_order: "0",
                      })
                    }
                  >
                    <Plus className="size-4" /> Añadir plato
                  </button>
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() =>
                      setCategoryDraft({
                        id: category.id,
                        name: category.name,
                        sort_order: String(category.sort_order),
                      })
                    }
                  >
                    <Pencil className="size-4" /> Editar
                  </button>
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => {
                      if (
                        window.confirm("Esto eliminará también todos sus platos. ¿Continuar?")
                      ) {
                        categoryDelete.mutate({ data: { id: category.id } });
                      }
                    }}
                  >
                    <Trash2 className="size-4" /> Eliminar
                  </button>
                </div>
              </header>

              {isOpen && (
                <div className="grid gap-4 border-t border-border/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {dishes.length === 0 && (
                    <p className="text-small text-muted-foreground">Sin platos todavía.</p>
                  )}
                  {dishes.map((dish) => (
                    <article
                      key={dish.id}
                      className="group overflow-hidden rounded-md bg-background shadow-warm"
                    >
                      <div className="h-32 overflow-hidden bg-muted">
                        {dish.image_url && (
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            loading="lazy"
                            className="transition-warm size-full object-cover duration-300 group-hover:scale-[1.03]"
                          />
                        )}
                      </div>
                      <div className="space-y-2 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-body font-semibold">{dish.name}</h4>
                          <span className="text-body font-medium text-terracota">
                            {Number(dish.price).toFixed(2)} €
                          </span>
                        </div>
                        {dish.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dish.allergens.map((a) => (
                              <span
                                key={a}
                                className="rounded-full bg-gold/25 px-2 py-0.5 text-small"
                              >
                                {ALLERGEN_LABELS[a] ?? a}
                              </span>
                            ))}
                          </div>
                        )}
                        {dish.is_menu_del_dia && (
                          <span className="inline-block rounded-full bg-olive px-2 py-0.5 text-small text-white">
                            Menú del día
                          </span>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 text-small">
                            <input
                              type="checkbox"
                              checked={dish.is_available}
                              onChange={(e) =>
                                availability.mutate({
                                  data: { id: dish.id, is_available: e.target.checked },
                                })
                              }
                            />
                            {dish.is_available ? "Disponible" : "No disponible"}
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              aria-label={`Editar ${dish.name}`}
                              className={ghostBtn}
                              onClick={() =>
                                setDishDraft({
                                  id: dish.id,
                                  category_id: dish.category_id,
                                  name: dish.name,
                                  description: dish.description ?? "",
                                  price: String(dish.price),
                                  allergens: dish.allergens,
                                  image_url: dish.image_url,
                                  is_available: dish.is_available,
                                  is_menu_del_dia: dish.is_menu_del_dia,
                                  sort_order: String(dish.sort_order),
                                })
                              }
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Eliminar ${dish.name}`}
                              className={ghostBtn}
                              onClick={() => {
                                if (window.confirm(`¿Eliminar "${dish.name}"?`)) {
                                  dishDelete.mutate({ data: { id: dish.id } });
                                }
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {categoryDraft && (
        <Modal
          title={categoryDraft.id ? "Editar categoría" : "Nueva categoría"}
          onClose={() => setCategoryDraft(null)}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const name = categoryDraft.name.trim();
              if (!name) {
                toast.error("El nombre es obligatorio");
                return;
              }
              categoryMutation.mutate({
                data: {
                  ...(categoryDraft.id ? { id: categoryDraft.id } : {}),
                  name,
                  sort_order: Number(categoryDraft.sort_order || 0),
                },
              });
            }}
          >
            <label className="block space-y-1">
              <span className="text-small font-medium">Nombre</span>
              <input
                className={inputClass}
                placeholder="Ej: Postres Caseros"
                required
                value={categoryDraft.name}
                onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-small font-medium">Orden</span>
              <input
                className={inputClass}
                type="number"
                placeholder="0"
                required
                value={categoryDraft.sort_order}
                onChange={(e) =>
                  setCategoryDraft({ ...categoryDraft, sort_order: e.target.value })
                }
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghostBtn} onClick={() => setCategoryDraft(null)}>
                Cancelar
              </button>
              <button type="submit" className={primaryBtn} disabled={categoryMutation.isPending}>
                Guardar categoría
              </button>
            </div>
          </form>
        </Modal>
      )}

      {dishDraft && (
        <Modal
          title={dishDraft.id ? "Editar plato" : "Nuevo plato"}
          onClose={() => setDishDraft(null)}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const name = dishDraft.name.trim();
              const price = Number(dishDraft.price);
              if (!name) {
                toast.error("El nombre es obligatorio");
                return;
              }
              if (!Number.isFinite(price) || price < 0) {
                toast.error("Precio no válido");
                return;
              }
              dishMutation.mutate({
                data: {
                  ...(dishDraft.id ? { id: dishDraft.id } : {}),
                  category_id: dishDraft.category_id,
                  name,
                  description: dishDraft.description.trim() || null,
                  price,
                  allergens: dishDraft.allergens,
                  image_url: dishDraft.image_url,
                  is_available: dishDraft.is_available,
                  is_menu_del_dia: dishDraft.is_menu_del_dia,
                  sort_order: Number(dishDraft.sort_order || 0),
                },
              });
            }}
          >
            <label className="block space-y-1">
              <span className="text-small font-medium">Nombre</span>
              <input
                className={inputClass}
                placeholder="Ej: Arroz del senyoret"
                required
                value={dishDraft.name}
                onChange={(e) => setDishDraft({ ...dishDraft, name: e.target.value })}
              />
            </label>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-small font-medium" id="dish-description-label">
                  Descripción
                </span>
                <AiDescriptionButton
                  configured={aiConfigured}
                  name={dishDraft.name}
                  category={categories.find((c) => c.id === dishDraft.category_id)?.name ?? ""}
                  allergens={dishDraft.allergens}
                  onSuggestion={(text) =>
                    setDishDraft((prev) => (prev ? { ...prev, description: text } : prev))
                  }
                />
              </div>
              <textarea
                aria-labelledby="dish-description-label"
                className={inputClass}
                rows={3}
                placeholder="Describe el plato brevemente"
                value={dishDraft.description}
                onChange={(e) => setDishDraft({ ...dishDraft, description: e.target.value })}
              />
              <p className="text-small text-muted-foreground">
                Revisa y edita la sugerencia antes de guardar: nunca se guarda sola.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-small font-medium">Precio</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="14.50"
                  required
                  value={dishDraft.price}
                  onChange={(e) => setDishDraft({ ...dishDraft, price: e.target.value })}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-small font-medium">Categoría</span>
                <select
                  className={inputClass}
                  required
                  value={dishDraft.category_id}
                  onChange={(e) => setDishDraft({ ...dishDraft, category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-small font-medium">Alérgenos</legend>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((a) => {
                  const active = dishDraft.allergens.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() =>
                        setDishDraft({
                          ...dishDraft,
                          allergens: active
                            ? dishDraft.allergens.filter((x) => x !== a)
                            : [...dishDraft.allergens, a],
                        })
                      }
                      className={`transition-warm rounded-full px-3 py-1 text-small ${
                        active ? "bg-olive text-white" : "border border-input bg-background"
                      }`}
                    >
                      {ALLERGEN_LABELS[a]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <ImageField
              bucket="dish-images"
              label="Imagen del plato"
              value={dishDraft.image_url}
              onChange={(url) => setDishDraft({ ...dishDraft, image_url: url })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-small">
                <input
                  type="checkbox"
                  checked={dishDraft.is_available}
                  onChange={(e) => setDishDraft({ ...dishDraft, is_available: e.target.checked })}
                />
                Disponible
              </label>
              <label className="flex items-center gap-2 text-small">
                <input
                  type="checkbox"
                  checked={dishDraft.is_menu_del_dia}
                  onChange={(e) =>
                    setDishDraft({ ...dishDraft, is_menu_del_dia: e.target.checked })
                  }
                />
                Marcar como menú del día
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-small font-medium">Orden</span>
              <input
                className={inputClass}
                type="number"
                placeholder="0"
                value={dishDraft.sort_order}
                onChange={(e) => setDishDraft({ ...dishDraft, sort_order: e.target.value })}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghostBtn} onClick={() => setDishDraft(null)}>
                Cancelar
              </button>
              <button type="submit" className={primaryBtn} disabled={dishMutation.isPending}>
                Guardar plato
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
