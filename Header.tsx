"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import { useApp } from "./Providers";

const links = [
  ["/shop/men", "nav.men"], ["/shop/women", "nav.women"], ["/shop/gymwear", "nav.gymwear"],
  ["/shop/new", "nav.new"], ["/shop/best", "nav.best"],
] as const;

export default function Header() {
  const { t, locale, setLocale, count } = useApp();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 h-20 transition duration-500 ${solid || open ? "border-b border-gold/15 bg-ink/90 backdrop-blur-md" : "bg-gradient-to-b from-ink/80 to-transparent"}`}>
      <div className="container-x flex h-full items-center justify-between gap-4">
        <Link href="/" aria-label="NOXÉRA home"><Logo /></Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map(([href, key]) => (
            <Link key={href} href={href} className={`text-[11px] uppercase tracking-[0.3em] transition hover:text-gold rtl:text-sm rtl:tracking-normal ${path === href ? "text-gold" : "text-soft/80"}`}>
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-soft/90">
          <button onClick={() => setLocale(locale === "en" ? "ar" : "en")} className="text-xs tracking-widest hover:text-gold" aria-label="Switch language">
            {locale === "en" ? "العربية" : "EN"}
          </button>
          <Link href="/account" className="hidden text-xs uppercase tracking-[0.25em] hover:text-gold sm:block rtl:tracking-normal rtl:text-sm">{t("nav.account")}</Link>
          <Link href="/cart" className="relative text-xs uppercase tracking-[0.25em] hover:text-gold rtl:tracking-normal rtl:text-sm" aria-label={t("nav.cart")}>
            {t("nav.cart")}
            {count > 0 && <span className="absolute -top-3 -end-4 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink">{count}</span>}
          </Link>
          <button className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label={t("nav.menu")} aria-expanded={open}>
            <span className="block h-px w-6 bg-soft" /><span className="mt-1.5 block h-px w-6 bg-soft" /><span className="mt-1.5 block h-px w-4 bg-gold" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-0 top-20 flex h-[calc(100svh-5rem)] flex-col gap-6 bg-ink/95 px-8 py-10 backdrop-blur-xl lg:hidden">
            {links.map(([href, key]) => (
              <Link key={href} href={href} className="font-display text-3xl font-light tracking-wide text-soft hover:text-gold rtl:font-arabic">{t(key)}</Link>
            ))}
            <Link href="/account" className="mt-4 text-sm uppercase tracking-[0.3em] text-gold rtl:tracking-normal">{t("nav.account")}</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
