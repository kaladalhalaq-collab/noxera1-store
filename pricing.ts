import type { Product } from "./types";

// Keep in sync with public.create_order() in supabase/schema.sql
export const FREE_SHIPPING_OVER = 150;
export const FLAT_SHIPPING = 15;

export const unitPrice = (p: Pick<Product, "price" | "sale_price">) => p.sale_price ?? p.price;
export const shippingFor = (afterDiscount: number) =>
  afterDiscount <= 0 || afterDiscount >= FREE_SHIPPING_OVER ? 0 : FLAT_SHIPPING;
