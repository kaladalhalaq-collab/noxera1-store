"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

export default function AccountPage() {
  const { t, money } = useApp();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "unconfigured">("loading");
  const [profile, setProfile] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!supabaseConfigured()) { setState("unconfigured"); return; }
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.replace("/login?next=/account"); return; }
      const [p, o] = await Promise.all([
        sb.from("profiles").select("full_name,email,role").eq("id", user.id).single(),
        sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      ]);
      setProfile(p.data ?? { full_name: "", email: user.email ?? "", role: "customer" });
      if (o.error) setErr(o.error.message); else setOrders((o.data ?? []) as Order[]);
      setState("ready");
    })();
  }, [router]);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (state === "unconfigured") return <div className="container-x py-24 text-center text-soft/60">{t("auth.notConf")}</div>;
  if (state === "loading") return <div className="container-x py-24 text-center text-soft/40">…</div>;

  return (
    <div className="container-x py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("acc.title")}</p>
          <h1 className="h-display mt-3">{profile?.full_name || profile?.email}</h1>
        </div>
        <div className="flex gap-3">
          {profile?.role === "admin" && <Link href="/admin" className="btn-gold !px-5 !py-3">{t("acc.admin")}</Link>}
          <button onClick={logout} className="btn-ghost !px-5 !py-3">{t("auth.logout")}</button>
        </div>
      </div>

      <h2 className="label mt-14">{t("acc.orders")}</h2>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      {orders.length === 0 ? (
        <p className="mt-6 text-soft/60">{t("acc.none")}</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {orders.map((o) => (
            <li key={o.id} className="border border-white/10 bg-graphite p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">{t("acc.no")} <span className="text-gold-light">#{o.order_no}</span> · <span className="text-soft/50">{new Date(o.created_at).toLocaleDateString()}</span></p>
                <span className="border border-gold/50 px-3 py-1 text-[11px] uppercase tracking-widest text-gold rtl:tracking-normal">{t(`st.${o.status}`)}</span>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-soft/70">
                {o.order_items?.map((i) => <li key={i.id}>{i.qty}× {i.name} <span className="text-soft/40">({i.size}{i.color ? `, ${i.color}` : ""})</span></li>)}
              </ul>
              <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 text-sm">
                <span className="text-soft/50">{o.tracking_number ? `${t("acc.tracking")}: ${o.tracking_number}` : ""}</span>
                <span className="text-gold-light">{money(o.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
