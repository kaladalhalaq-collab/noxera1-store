import { createClient, supabaseConfigured } from "./supabase/server";
import { SEED } from "./seed";
import type { Product, Review } from "./types";

export async function getProducts(): Promise<Product[]> {
  if (!supabaseConfigured()) return SEED;
  try {
    const { data, error } = await createClient()
      .from("products").select("*").eq("active", true).order("created_at", { ascending: false });
    if (error) return SEED;
    return (data ?? []) as Product[];
  } catch {
    return SEED;
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getReviews(productId: string): Promise<Review[]> {
  if (!supabaseConfigured()) return [];
  try {
    const { data } = await createClient()
      .from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
    return (data ?? []) as Review[];
  } catch {
    return [];
  }
}

export const COLLECTIONS = ["men", "women", "gymwear", "new", "best", "all"] as const;
export type CollectionSlug = (typeof COLLECTIONS)[number];

export function filterCollection(products: Product[], slug: CollectionSlug): Product[] {
  switch (slug) {
    case "men": return products.filter((p) => p.gender === "men" || p.gender === "unisex");
    case "women": return products.filter((p) => p.gender === "women" || p.gender === "unisex");
    case "gymwear": return products.filter((p) => ["gymwear", "compression", "oversized"].includes(p.collection));
    case "new": return products.filter((p) => p.is_new);
    case "best": return products.filter((p) => p.best_seller);
    default: return products;
  }
}
