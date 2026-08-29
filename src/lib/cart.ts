import { useEffect, useState } from "react";

export type CartItem = {
  dish_id: string;
  name: string;
  price: number;
  quantity: number;
};

const STORAGE_KEY = "chicken-garden-cart-v1";
const EVENT = "chicken-garden-cart-change";

function isItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["dish_id"] === "string" &&
    typeof v["name"] === "string" &&
    typeof v["price"] === "number" &&
    typeof v["quantity"] === "number" &&
    v["quantity"] > 0
  );
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isItem);
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = readCart();
  const existing = items.find((i) => i.dish_id === item.dish_id);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + quantity);
    existing.price = item.price;
    existing.name = item.name;
  } else {
    items.push({ ...item, quantity: Math.min(99, Math.max(1, quantity)) });
  }
  writeCart(items);
}

export function setQuantity(dishId: string, quantity: number) {
  const items = readCart()
    .map((i) => (i.dish_id === dishId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  writeCart(items);
}

export function removeFromCart(dishId: string) {
  writeCart(readCart().filter((i) => i.dish_id !== dishId));
}

export function clearCart() {
  writeCart([]);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

/** Carrito reactivo, hidratado tras el montaje para evitar mismatch de SSR. */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    setHydrated(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    items,
    hydrated,
    count: cartCount(items),
    total: cartTotal(items),
  };
}
