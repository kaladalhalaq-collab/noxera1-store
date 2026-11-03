"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { tr } from "@/lib/i18n";
import type { CartItem, Locale } from "@/lib/types";

type Ctx = {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
  money: (n: number) => string;
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  ready: boolean;
};

const AppContext = createContext<Ctx | null>(null);
const CART_KEY = "noxera_cart";

export function Providers({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLoc] = useState<Locale>(initialLocale);
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => setLoc(initialLocale), [initialLocale]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore corrupted storage */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items, ready]);

  const setLocale = useCallback((l: Locale) => {
    document.cookie = `noxera_locale=${l}; path=/; max-age=31536000; samesite=lax`;
    setLoc(l);
    router.refresh();
  }, [router]);

  const t = useCallback((k: string) => tr(locale, k), [locale]);

  const money = useCallback((n: number) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "USD";
    return new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", { style: "currency", currency }).format(n);
  }, [locale]);

  const add = useCallback((item: CartItem) => {
    setItems((cur) => {
      const found = cur.find((i) => i.key === item.key);
      if (found) return cur.map((i) => (i.key === item.key ? { ...i, qty: Math.min(20, i.qty + item.qty) } : i));
      return [...cur, item];
    });
  }, []);
  const setQty = useCallback((key: string, qty: number) =>
    setItems((cur) => cur.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(20, qty)) } : i))), []);
  const remove = useCallback((key: string) => setItems((cur) => cur.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(() => ({
    locale, t, setLocale, money, items, add, setQty, remove, clear, ready,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
  }), [locale, t, setLocale, money, items, add, setQty, remove, clear, ready]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <Providers>");
  return ctx;
}
