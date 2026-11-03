"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductVisual from "./ProductVisual";
import ProductCard from "./ProductCard";
import { useApp } from "./Providers";
import { unitPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

const GUIDE = [
  ["XS", "81–86", "66–71"], ["S", "86–91", "71–76"], ["M", "91–97", "76–81"],
  ["L", "97–104", "81–89"], ["XL", "104–112", "89–97"], ["XXL", "112–120", "97–107"],
];

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { t, locale, money, add } = useApp();
  const router = useRouter();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [qty, setQty] = useState(1);
  const [guide, setGuide] = useState(false);
  const [msg, setMsg] = useState("");
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const ar = locale === "ar";
  const name = ar ? product.name_ar || product.name_en : product.name_en;
  const desc = ar ? product.desc_ar || product.desc_en : product.desc_en;
  const material = ar ? product.material_ar || product.material_en : product.material_en;
  const sold = product.stock <= 0;
  const price = unitPrice(product);
  const photos = product.images.length > 0 ? product.images : [""];

  function commit(): boolean {
    if (!size) { setMsg(t("p.selectSize")); return false; }
    add({
      key: `${product.id}|${size}|${color}`, productId: product.id, slug: product.slug,
      name_en: product.name_en, name_ar: product.name_ar, price, size, color, qty,
      image: product.images[0] ?? null,
    });
    return true;
  }

  return (
    <div className="container-x py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] cursor-zoom-in overflow-hidden border border-white/5 bg-graphite"
            onMouseMove={(e) => {
              if (!product.images.length) return;
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onMouseLeave={() => setZoom(null)}>
            <div className="absolute inset-0 transition-transform duration-200"
              style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
              <ProductVisual product={product} index={img} sizes="(min-width:1024px) 50vw, 100vw" priority />
            </div>
          </div>
          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}
                  className={`relative aspect-square overflow-hidden border ${i === img ? "border-gold" : "border-white/10"}`}>
                  <ProductVisual product={product} index={i} sizes="120px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="eyebrow">{product.type}</p>
          <h1 className="h-display mt-3">{name}</h1>
          <p className="mt-4 text-2xl">
            {product.sale_price !== null && <span className="me-3 text-base text-soft/40 line-through">{money(product.price)}</span>}
            <span className="text-gold-light">{money(price)}</span>
          </p>
          <p className={`mt-2 text-xs uppercase tracking-[0.25em] rtl:tracking-normal rtl:text-sm ${sold ? "text-red-400" : "text-gold"}`}>
            {sold ? t("p.out") : product.stock <= 5 ? `${t("badge.low")} (${product.stock})` : t("p.in")}
          </p>
          <p className="mt-6 leading-relaxed text-soft/70">{desc}</p>

          {product.colors.length > 0 && (
            <div className="mt-8">
              <span className="label">{t("p.color")}: <span className="text-soft">{color}</span></span>
              <div className="flex gap-3">
                {product.colors.map((c) => (
                  <button key={c.name} onClick={() => setColor(c.name)} aria-label={c.name} title={c.name}
                    className={`h-9 w-9 rounded-full border-2 transition ${color === c.name ? "border-gold scale-110" : "border-white/20"}`}
                    style={{ background: c.hex }} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <span className="label">{t("p.size")}</span>
              <button onClick={() => setGuide(true)} className="label text-gold underline underline-offset-4">{t("p.guide")}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => { setSize(s); setMsg(""); }}
                  className={`min-w-12 border px-4 py-3 text-sm transition ${size === s ? "border-gold bg-gold text-ink" : "border-white/15 hover:border-gold"}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <span className="label !mb-0">{t("p.qty")}</span>
            <div className="flex items-center border border-white/15">
              <button className="px-4 py-2 hover:text-gold" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button className="px-4 py-2 hover:text-gold" onClick={() => setQty((q) => Math.min(Math.min(20, product.stock || 1), q + 1))} aria-label="Increase">+</button>
            </div>
          </div>

          {msg && <p role="alert" className="mt-4 text-sm text-red-400">{msg}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button disabled={sold} className="btn-gold flex-1" onClick={() => { if (commit()) setMsg(t("p.added")); }}>{t("p.add")}</button>
            <button disabled={sold} className="btn-ghost flex-1" onClick={() => { if (commit()) router.push("/checkout"); }}>{t("p.buy")}</button>
          </div>

          <dl className="mt-10 space-y-5 border-t border-white/10 pt-8 text-sm">
            <div><dt className="label">{t("p.material")}</dt><dd className="text-soft/70">{material}</dd></div>
            <div><dt className="label">{t("p.delivery")}</dt><dd className="text-soft/70">{t("p.deliveryText")}</dd></div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="h-display mb-10">{t("p.related")}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {guide && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-5" onClick={() => setGuide(false)} role="dialog" aria-modal="true">
          <div className="w-full max-w-md border border-gold/30 bg-graphite p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl">{t("p.guide")}</h3>
              <button onClick={() => setGuide(false)} aria-label="Close" className="text-2xl text-soft/60 hover:text-gold">×</button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-start text-soft/50"><th className="py-2 text-start font-normal">{t("p.size")}</th><th className="text-start font-normal">Chest (cm)</th><th className="text-start font-normal">Waist (cm)</th></tr></thead>
              <tbody>{GUIDE.map(([s, c, w]) => <tr key={s} className="border-t border-white/10"><td className="py-2">{s}</td><td>{c}</td><td>{w}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
