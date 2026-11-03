export type Locale = "en" | "ar";

export type Product = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  material_en: string;
  material_ar: string;
  gender: "men" | "women" | "unisex";
  collection: "gymwear" | "oversized" | "compression" | "essentials" | "accessories";
  type: string;
  price: number;
  sale_price: number | null;
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  stock: number;
  featured: boolean;
  is_new: boolean;
  best_seller: boolean;
  active: boolean;
  created_at?: string;
};

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name_en: string;
  name_ar: string;
  price: number;
  size: string;
  color: string;
  qty: number;
  image: string | null;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  author: string;
  rating: number;
  body: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
  qty: number;
  unit_price: number;
};

export type Order = {
  id: string;
  order_no: number;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  payment_method: string;
  tracking_number: string | null;
  created_at: string;
  order_items?: OrderItem[];
};
