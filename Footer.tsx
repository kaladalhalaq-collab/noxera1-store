"use client";
import Link from "next/link";
import Logo from "./Logo";
import { useApp } from "./Providers";

export default function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t border-gold/15 bg-ink py-16">
      <div className="container-x grid gap-10 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-5 text-xs uppercase tracking-[0.4em] text-soft/60 rtl:tracking-normal">{t("hero.tag1")} {t("hero.tag2")}</p>
        </div>
        <div>
          <p className="eyebrow mb-4">{t("foot.shop")}</p>
          <ul className="space-y-2 text-sm text-soft/70">
            <li><Link className="hover:text-gold" href="/shop/men">{t("nav.men")}</Link></li>
            <li><Link className="hover:text-gold" href="/shop/women">{t("nav.women")}</Link></li>
            <li><Link className="hover:text-gold" href="/shop/gymwear">{t("nav.gymwear")}</Link></li>
            <li><Link className="hover:text-gold" href="/shop/all">{t("shop.all")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">{t("foot.help")}</p>
          <ul className="space-y-2 text-sm text-soft/70">
            <li><Link className="hover:text-gold" href="/account">{t("nav.account")}</Link></li>
            <li><Link className="hover:text-gold" href="/cart">{t("nav.cart")}</Link></li>
          </ul>
          <p className="mt-5 text-xs text-soft/50">{t("foot.ship")}</p>
        </div>
      </div>
      <p className="container-x mt-12 text-xs text-soft/40">© {new Date().getFullYear()} NOXÉRA. {t("foot.rights")}</p>
    </footer>
  );
}
