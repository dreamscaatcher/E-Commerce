export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

const CART_STORAGE_KEY = "neo4j_dashboard_cart_v1";
const CART_EVENT = "neo4j_dashboard_cart_updated";

function canUseDom() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitCartUpdated() {
  if (!canUseDom()) return;
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCartItems(): CartItem[] {
  if (!canUseDom()) return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<CartItem>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.price === "number" &&
        Number.isFinite(candidate.price) &&
        typeof candidate.quantity === "number" &&
        Number.isFinite(candidate.quantity)
      );
    });
  } catch {
    return [];
  }
}

export function setCartItems(items: CartItem[]) {
  if (!canUseDom()) return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  emitCartUpdated();
}

export function addToCart(
  item: Omit<CartItem, "quantity">,
  quantity: number = 1
) {
  const qty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
  const cart = getCartItems();
  const index = cart.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    const existing = cart[index];
    cart[index] = { ...existing, quantity: existing.quantity + qty };
  } else {
    cart.push({ ...item, quantity: qty });
  }
  setCartItems(cart);
}

export function removeFromCart(id: string) {
  const cart = getCartItems().filter((item) => item.id !== id);
  setCartItems(cart);
}

export function setCartQuantity(id: string, quantity: number) {
  const qty = Number.isFinite(quantity) ? Math.floor(quantity) : 0;
  const cart = getCartItems();
  const index = cart.findIndex((item) => item.id === id);
  if (index < 0) return;

  if (qty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index] = { ...cart[index], quantity: qty };
  }
  setCartItems(cart);
}

export function clearCart() {
  setCartItems([]);
}

export function getCartCount(items?: CartItem[]) {
  const list = items ?? getCartItems();
  return list.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function getCartTotal(items?: CartItem[]) {
  const list = items ?? getCartItems();
  return list.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function subscribeToCartUpdates(callback: () => void) {
  if (!canUseDom()) return () => {};
  const handler = () => callback();

  window.addEventListener(CART_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(CART_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

