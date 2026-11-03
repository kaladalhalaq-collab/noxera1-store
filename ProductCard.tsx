"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import ProductVisual from "./ProductVisual";
import { useApp } from "./Providers";
import { unitPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { locale, t, money } = useApp();
  const name = locale === "ar" ? product.name_ar || product.name_en : product.name_en;
  const sold = product.stock <= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: Math.min(index, 4) * 0.08 }}>
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden border border-white/5 bg-graphite transition duration-500 group-hover:border-gold/40 group-hover:shadow-[0_0_40px_rgba(198,166,106,.15)]">
          <div className="absolute inset-0 transition duration-[1200ms] group-hover:scale-105"><ProductVisual product={product} /></div>
          <div className="absolute start-3 top-3 flex flex-col gap-1.5">
            {product.sale_price !== null && <span className="bg-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink rtl:tracking-normal">{t("badge.sale")}</span>}
            {product.is_new && <span className="border border-gold/60 bg-ink/70 px-2 py-1 text-[10px] uppercase tracking-widest text-gold-light rtl:tracking-normal">{t("badge.new")}</span>}
          </div>
          {sold && <div className="absolute inset-0 grid place-items-center bg-ink/70 text-xs uppercase tracking-[0.3em] rtl:tracking-normal">{t("badge.sold")}</div>}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <h3 className="text-sm tracking-wide text-soft transition group-hover:text-gold">{name}</h3>
          <p className="shrink-0 text-sm">
            {product.sale_price !== null && <span className="me-2 text-soft/40 line-through">{money(product.price)}</span>}
            <span className="text-gold-light">{money(unitPrice(product))}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
