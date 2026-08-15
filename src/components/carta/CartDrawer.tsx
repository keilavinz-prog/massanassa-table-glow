import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import {
  clearCart,
  removeFromCart,
  setQuantity,
  useCart,
  type CartItem,
} from "@/lib/cart";

export function CartLines({ items }: { items: CartItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.dish_id} className="rounded-md bg-background p-3 shadow-warm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium leading-tight">{item.name}</p>
              <p className="text-small text-muted-foreground">
                {item.price.toFixed(2)} € / ud.
              </p>
            </div>
            <button
              type="button"
              aria-label={`Eliminar ${item.name}`}
              onClick={() => removeFromCart(item.dish_id)}
              className="tap-target transition-warm inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-primary"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Quitar una unidad"
                onClick={() => setQuantity(item.dish_id, item.quantity - 1)}
                className="tap-target transition-warm inline-flex items-center justify-center rounded-sm border border-border hover:border-primary"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-6 text-center text-small font-medium">{item.quantity}</span>
              <button
                type="button"
                aria-label="Añadir una unidad"
                onClick={() => setQuantity(item.dish_id, Math.min(99, item.quantity + 1))}
                className="tap-target transition-warm inline-flex items-center justify-center rounded-sm border border-border hover:border-primary"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <span className="font-semibold text-primary">
              {(item.price * item.quantity).toFixed(2)} €
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CartFab() {
  const { hydrated, count, total, items } = useCart();
  const [open, setOpen] = useState(false);

  if (!hydrated || count === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="transition-warm fab-bottom fab-right tap-target fixed z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 font-medium text-primary-foreground shadow-warm hover:brightness-110"
      >
        <ShoppingBag className="size-5" /> Carrito
        <span className="rounded-full bg-cream px-2 py-0.5 text-small font-semibold text-primary">
          {count}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex h-[100dvh] justify-end bg-dark-brown/50">
          <aside className="flex h-full w-full max-w-sm flex-col bg-cream shadow-warm-lg">
            <div className="flex items-center justify-between border-b border-border/60 p-6">
              <h2 className="font-display text-h3">Tu pedido</h2>
              <button
                type="button"
                aria-label="Cerrar carrito"
                onClick={() => setOpen(false)}
                className="tap-target transition-warm inline-flex items-center justify-center rounded-full border border-border hover:bg-background"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <CartLines items={items} />
            </div>

            <div className="space-y-3 border-t border-border/60 p-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display text-h3 font-bold text-primary">
                  {total.toFixed(2)} €
                </span>
              </div>
              <Link
                to="/pedido"
                onClick={() => setOpen(false)}
                className="transition-warm block w-full rounded-md bg-primary py-3 text-center font-medium text-primary-foreground shadow-warm hover:brightness-110"
              >
                Ir a pagar
              </Link>
              <button
                type="button"
                onClick={() => clearCart()}
                className="transition-warm w-full text-small text-muted-foreground underline underline-offset-4 hover:text-primary"
              >
                Vaciar carrito
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
