import Image from "next/image";
import { Monogram } from "./Logo";
import type { Product } from "@/lib/types";

/** Fills its (relatively-positioned) parent. Shows the uploaded photo, or a branded tile until one is uploaded. */
export default function ProductVisual({ product, index = 0, sizes = "(min-width:1024px) 25vw, 50vw", priority = false }:
  { product: Product; index?: number; sizes?: string; priority?: boolean }) {
  const src = product.images?.[index];
  if (src) return <Image src={src} alt={product.name_en} fill sizes={sizes} priority={priority} className="object-cover" />;
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,#2a2418,#101010_70%)]">
      <Monogram className="h-1/3 w-1/3 opacity-80" />
      <span className="absolute bottom-4 text-[10px] uppercase tracking-[0.4em] text-gold/70">{product.type}</span>
    </div>
  );
}
