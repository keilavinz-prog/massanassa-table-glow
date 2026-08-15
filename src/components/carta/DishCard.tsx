import { ALLERGEN_LABELS } from "@/lib/admin-schemas";
import type { PublicDish } from "@/lib/restaurant.functions";

export function DishCard({
  dish,
  eager = false,
  showMenuBadge = false,
}: {
  dish: PublicDish;
  eager?: boolean;
  showMenuBadge?: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-md bg-background shadow-warm">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {dish.image_url ? (
          <img
            src={dish.image_url}
            alt={dish.name}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="transition-warm size-full object-cover lg:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-small text-muted-foreground">
            Sin imagen
          </div>
        )}
        {showMenuBadge && dish.is_menu_del_dia && (
          <span className="absolute left-3 top-3 rounded-full bg-olive px-3 py-1 text-small font-medium text-cream">
            Menú del día
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-h3 leading-tight">{dish.name}</h3>
          <span className="whitespace-nowrap font-semibold text-primary">
            {dish.price.toFixed(2)} €
          </span>
        </div>
        {dish.description && (
          <p className="line-clamp-2 text-small text-muted-foreground">{dish.description}</p>
        )}
        {dish.allergens.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {dish.allergens.map((a) => (
              <li
                key={a}
                className="rounded-full border border-gold/60 px-2 py-0.5 text-small text-foreground/70"
              >
                {ALLERGEN_LABELS[a] ?? a}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function DishCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md bg-background shadow-warm">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded-sm bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-sm bg-muted" />
      </div>
    </div>
  );
}
