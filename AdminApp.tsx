"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "../Providers";

/* The admin console is English-only. All access control is enforced by Postgres RLS (is_admin()). */

const TABS = ["Overview", "Products", "Orders", "Coupons", "Customers"] as const;
type Tab = (typeof TABS)[number];
const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const useSb = () => useMemo(() => createClient(), []);
const card = "border border-white/10 bg-graphite p-5";
const th = "py-2 pe-4 text-start text-[11px] font-normal uppercase tracking-widest text-soft/50";

export default function AdminApp() {
  const [tab, setTab] = useState<Tab>("Overview");
  return (
    <div className="container-x py-12">
      <p className="eyebrow">NOXÉRA</p>
      <h1 className="h-display mt-2">Admin</h1>
      <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${tab === t ? "bg-gold text-ink" : "border border-white/15 text-soft/70 hover:border-gold"}`}>{t}</button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "Overview" && <Overview />}
        {tab === "Products" && <Products />}
        {tab === "Orders" && <Orders />}
        {tab === "Coupons" && <Coupons />}
        {tab === "Customers" && <Customers />}
      </div>
    </div>
  );
}

/* ───────────────────────── Overview ───────────────────────── */
function Overview() {
  const sb = useSb();
  const { money } = useApp();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const [o, i, c] = await Promise.all([
        sb.from("orders").select("id,total,status"),
        sb.from("order_items").select("order_id,name,qty"),
        sb.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      if (o.error || i.error) { setErr((o.error || i.error)!.message); return; }
      const live = (o.data ?? []).filter((x) => x.status !== "cancelled");
      const liveIds = new Set(live.map((x) => x.id));
      const by: Record<string, number> = {};
      (i.data ?? []).forEach((r) => { if (liveIds.has(r.order_id)) by[r.name] = (by[r.name] ?? 0) + r.qty; });
      setD({
        orders: (o.data ?? []).length,
        revenue: live.reduce((s, x) => s + Number(x.total), 0),
        pending: (o.data ?? []).filter((x) => x.status === "pending").length,
        customers: c.count ?? 0,
        best: Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 5),
      });
    })();
  }, [sb]);

  if (err) return <p className="text-red-400">{err}</p>;
  if (!d) return <p className="text-soft/50">Loading…</p>;
  const stat = (label: string, v: string | number) => (
    <div className={card}><p className="text-[11px] uppercase tracking-widest text-soft/50">{label}</p><p className="mt-2 font-display text-4xl gold-text">{v}</p></div>
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat("Revenue", money(d.revenue))}{stat("Total orders", d.orders)}{stat("Pending", d.pending)}{stat("Customers", d.customers)}
      </div>
      <div className={`${card} mt-6`}>
        <p className="label">Best sellers</p>
        {d.best.length === 0 ? <p className="text-sm text-soft/50">No sales yet.</p> : (
          <ol className="space-y-2 text-sm">{d.best.map(([n, q]: [string, number]) => <li key={n} className="flex justify-between"><span>{n}</span><span className="text-gold">{q} sold</span></li>)}</ol>
        )}
      </div>
    </>
  );
}

/* ───────────────────────── Products ───────────────────────── */
const emptyForm = {
  slug: "", name_en: "", name_ar: "", desc_en: "", desc_ar: "", material_en: "", material_ar: "",
  gender: "men", collection: "gymwear", type: "", price: "", sale_price: "", sizes: "S,M,L,XL",
  colors: "Black:#080808", stock: "0", images: "", featured: false, is_new: false, best_seller: false, active: true,
};

function Products() {
  const sb = useSb();
  const { money } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
    if (error) setMsg(error.message); else setRows(data ?? []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  const f = (k: string) => (e: any) => setForm((s: any) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  function edit(p: any) {
    setEditing(p.id); setOpen(true); setMsg("");
    setForm({
      ...emptyForm, ...p, price: String(p.price), sale_price: p.sale_price == null ? "" : String(p.sale_price), stock: String(p.stock),
      sizes: (p.sizes ?? []).join(","), colors: (p.colors ?? []).map((c: any) => `${c.name}:${c.hex}`).join(", "), images: (p.images ?? []).join("\n"),
    });
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg("");
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await sb.storage.from("product-images").upload(path, file, { cacheControl: "31536000", upsert: false });
    if (error) setMsg(error.message);
    else {
      const url = sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      setForm((s: any) => ({ ...s, images: s.images ? `${s.images}\n${url}` : url }));
    }
    setBusy(false);
    e.target.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const colors = String(form.colors).split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
      const [name, hex] = s.split(":");
      return { name: name.trim(), hex: (hex ?? "#080808").trim() };
    });
    const payload = {
      slug: String(form.slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      name_en: form.name_en, name_ar: form.name_ar, desc_en: form.desc_en, desc_ar: form.desc_ar,
      material_en: form.material_en, material_ar: form.material_ar, gender: form.gender, collection: form.collection, type: form.type,
      price: Number(form.price), sale_price: form.sale_price === "" ? null : Number(form.sale_price),
      sizes: String(form.sizes).split(",").map((s) => s.trim()).filter(Boolean), colors,
      images: String(form.images).split("\n").map((s) => s.trim()).filter(Boolean),
      stock: Math.max(0, Math.floor(Number(form.stock))), featured: form.featured, is_new: form.is_new, best_seller: form.best_seller, active: form.active,
    };
    const { error } = editing ? await sb.from("products").update(payload).eq("id", editing) : await sb.from("products").insert(payload);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setOpen(false); setEditing(null); setForm(emptyForm); load();
  }

  async function del(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) setMsg(error.message); else load();
  }

  const inp = (k: string, label: string, props: any = {}) => (
    <div><label className="label">{label}</label><input className="field" value={form[k]} onChange={f(k)} {...props} /></div>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="label !mb-0">{rows.length} products</p>
        <button className="btn-gold !px-5 !py-3" onClick={() => { setOpen(!open); setEditing(null); setForm(emptyForm); setMsg(""); }}>{open ? "Close" : "Add product"}</button>
      </div>
      {msg && <p role="alert" className="mt-3 text-sm text-red-400">{msg}</p>}

      {open && (
        <form onSubmit={save} className={`${card} mt-6 grid gap-4 sm:grid-cols-2`}>
          {inp("name_en", "Name (EN)", { required: true })}
          {inp("name_ar", "Name (AR)", { dir: "rtl" })}
          {inp("slug", "Slug (url)", { required: true })}
          {inp("type", "Type (e.g. Oversized Tee)")}
          <div><label className="label">Gender</label><select className="field" value={form.gender} onChange={f("gender")}><option>men</option><option>women</option><option>unisex</option></select></div>
          <div><label className="label">Collection</label><select className="field" value={form.collection} onChange={f("collection")}>{["gymwear", "oversized", "compression", "essentials", "accessories"].map((c) => <option key={c}>{c}</option>)}</select></div>
          {inp("price", "Price", { required: true, type: "number", step: "0.01", min: 0 })}
          {inp("sale_price", "Sale price (optional)", { type: "number", step: "0.01", min: 0 })}
          {inp("sizes", "Sizes (comma separated)")}
          {inp("colors", "Colors (Name:#hex, Name:#hex)")}
          {inp("stock", "Stock", { type: "number", min: 0, required: true })}
          {inp("material_en", "Material (EN)")}
          {inp("material_ar", "Material (AR)", { dir: "rtl" })}
          <div className="sm:col-span-2"><label className="label">Description (EN)</label><textarea className="field" rows={3} value={form.desc_en} onChange={f("desc_en")} /></div>
          <div className="sm:col-span-2"><label className="label">Description (AR)</label><textarea dir="rtl" className="field" rows={3} value={form.desc_ar} onChange={f("desc_ar")} /></div>
          <div className="sm:col-span-2">
            <label className="label">Images (one URL per line)</label>
            <textarea className="field" rows={3} value={form.images} onChange={f("images")} dir="ltr" />
            <input type="file" accept="image/*" onChange={upload} disabled={busy} className="mt-2 text-xs text-soft/60" />
          </div>
          <div className="flex flex-wrap gap-5 text-sm sm:col-span-2">
            {(["featured", "is_new", "best_seller", "active"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" className="accent-[#C6A66A]" checked={form[k]} onChange={f(k)} />{k.replace("_", " ")}</label>
            ))}
          </div>
          <button disabled={busy} className="btn-gold sm:col-span-2">{editing ? "Save changes" : "Create product"}</button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={th}>Product</th><th className={th}>Price</th><th className={th}>Stock</th><th className={th}>Status</th><th className={th} /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="py-3 pe-4">{p.name_en}</td>
                <td className="pe-4">{money(p.sale_price ?? p.price)}</td>
                <td className={`pe-4 ${p.stock <= 5 ? "text-red-400" : ""}`}>{p.stock}</td>
                <td className="pe-4 text-soft/60">{p.active ? "Active" : "Hidden"}</td>
                <td className="whitespace-nowrap text-end">
                  <button className="me-4 text-gold hover:underline" onClick={() => edit(p)}>Edit</button>
                  <button className="text-red-400 hover:underline" onClick={() => del(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Orders ───────────────────────── */
function Orders() {
  const sb = useSb();
  const { money } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [track, setTrack] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data, error } = await sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
    if (error) setMsg(error.message); else setRows(data ?? []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  async function patch(id: string, values: Record<string, any>) {
    setMsg("");
    const { error } = await sb.from("orders").update(values).eq("id", id);
    if (error) setMsg(error.message); else load();
  }

  return (
    <div className="space-y-4">
      {msg && <p role="alert" className="text-sm text-red-400">{msg}</p>}
      {rows.length === 0 && <p className="text-soft/50">No orders yet.</p>}
      {rows.map((o) => (
        <div key={o.id} className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>#{o.order_no} <span className="text-soft/50">· {new Date(o.created_at).toLocaleString()}</span></p>
            <p className="text-gold-light">{money(Number(o.total))}</p>
          </div>
          <p className="mt-2 text-sm text-soft/70">{o.full_name} · {o.email} · {o.phone}</p>
          <p className="text-sm text-soft/50">{o.address}, {o.city}, {o.country} · {o.payment_method === "cod" ? "Cash on delivery" : "Bank transfer"}</p>
          <ul className="mt-3 space-y-1 text-sm text-soft/70">
            {o.order_items?.map((i: any) => <li key={i.id}>{i.qty}× {i.name} ({i.size}{i.color ? `, ${i.color}` : ""}) · {money(Number(i.unit_price))}</li>)}
          </ul>
          {o.notes && <p className="mt-2 text-xs text-soft/50">Note: {o.notes}</p>}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Status</label>
              <select className="field !w-auto" value={o.status} onChange={(e) => patch(o.id, { status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="label">Tracking number</label>
              <div className="flex gap-2">
                <input className="field" dir="ltr" value={track[o.id] ?? o.tracking_number ?? ""} onChange={(e) => setTrack((s) => ({ ...s, [o.id]: e.target.value }))} />
                <button className="btn-ghost !px-4" onClick={() => patch(o.id, { tracking_number: (track[o.id] ?? o.tracking_number ?? "").trim() || null })}>Save</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Coupons ───────────────────────── */
function Coupons() {
  const sb = useSb();
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [c, setC] = useState({ code: "", percent: "10", min_subtotal: "0", expires_at: "" });

  const load = useCallback(async () => {
    const { data, error } = await sb.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) setMsg(error.message); else setRows(data ?? []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const { error } = await sb.from("coupons").insert({
      code: c.code.trim().toUpperCase(), percent: Number(c.percent), min_subtotal: Number(c.min_subtotal || 0),
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString() : null,
    });
    if (error) setMsg(error.message); else { setC({ code: "", percent: "10", min_subtotal: "0", expires_at: "" }); load(); }
  }
  async function toggle(code: string, active: boolean) { await sb.from("coupons").update({ active: !active }).eq("code", code); load(); }
  async function del(code: string) { if (confirm(`Delete ${code}?`)) { await sb.from("coupons").delete().eq("code", code); load(); } }

  return (
    <div>
      <form onSubmit={create} className={`${card} grid gap-4 sm:grid-cols-5`}>
        <div><label className="label">Code</label><input required className="field" dir="ltr" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} /></div>
        <div><label className="label">Percent off</label><input required type="number" min={1} max={100} className="field" value={c.percent} onChange={(e) => setC({ ...c, percent: e.target.value })} /></div>
        <div><label className="label">Min subtotal</label><input type="number" min={0} className="field" value={c.min_subtotal} onChange={(e) => setC({ ...c, min_subtotal: e.target.value })} /></div>
        <div><label className="label">Expires (optional)</label><input type="date" className="field" value={c.expires_at} onChange={(e) => setC({ ...c, expires_at: e.target.value })} /></div>
        <div className="flex items-end"><button className="btn-gold w-full !px-4">Create</button></div>
      </form>
      {msg && <p role="alert" className="mt-3 text-sm text-red-400">{msg}</p>}
      <table className="mt-6 w-full text-sm">
        <thead><tr><th className={th}>Code</th><th className={th}>Off</th><th className={th}>Min</th><th className={th}>Expires</th><th className={th} /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code} className="border-t border-white/10">
              <td className="py-3 pe-4 text-gold-light">{r.code}</td><td className="pe-4">{r.percent}%</td><td className="pe-4">{r.min_subtotal}</td>
              <td className="pe-4 text-soft/60">{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "Never"}</td>
              <td className="whitespace-nowrap text-end">
                <button className="me-4 text-gold hover:underline" onClick={() => toggle(r.code, r.active)}>{r.active ? "Disable" : "Enable"}</button>
                <button className="text-red-400 hover:underline" onClick={() => del(r.code)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── Customers ───────────────────────── */
function Customers() {
  const sb = useSb();
  const { money } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [p, o] = await Promise.all([
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("orders").select("id,order_no,user_id,total,status,created_at"),
    ]);
    if (p.error) setMsg(p.error.message); else setRows(p.data ?? []);
    setOrders(o.data ?? []);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  async function setRole(id: string, role: string) {
    if (!confirm(`Change role to "${role}"?`)) return;
    const { error } = await sb.from("profiles").update({ role }).eq("id", id);
    if (error) setMsg(error.message); else load();
  }

  return (
    <div className="space-y-3">
      {msg && <p role="alert" className="text-sm text-red-400">{msg}</p>}
      {rows.map((p) => {
        const mine = orders.filter((o) => o.user_id === p.id && o.status !== "cancelled");
        return (
          <div key={p.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p>{p.full_name || "—"}</p><p className="text-xs text-soft/50" dir="ltr">{p.email}</p></div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-soft/60">{mine.length} orders · {money(mine.reduce((s, o) => s + Number(o.total), 0))}</span>
                <select className="field !w-auto !py-2" value={p.role} onChange={(e) => setRole(p.id, e.target.value)}><option>customer</option><option>admin</option></select>
                <button className="text-gold hover:underline" onClick={() => setOpen(open === p.id ? null : p.id)}>History</button>
              </div>
            </div>
            {open === p.id && (
              <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm text-soft/70">
                {orders.filter((o) => o.user_id === p.id).length === 0 && <li>No orders.</li>}
                {orders.filter((o) => o.user_id === p.id).map((o) => <li key={o.id}>#{o.order_no} · {new Date(o.created_at).toLocaleDateString()} · {o.status} · {money(Number(o.total))}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
