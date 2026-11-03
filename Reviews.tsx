"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "./Providers";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type { Review } from "@/lib/types";

const Stars = ({ n }: { n: number }) => <span aria-label={`${n} / 5`} className="text-gold">{"★".repeat(n)}<span className="text-white/20">{"★".repeat(5 - n)}</span></span>;

export default function Reviews({ productId, initial }: { productId: string; initial: Review[] }) {
  const { t } = useApp();
  const [reviews, setReviews] = useState<Review[]>(initial);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = supabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    createClient().auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) setUser({ id: u.id, name: (u.user_metadata?.full_name as string) || u.email?.split("@")[0] || "" });
    });
  }, [configured]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true); setErr("");
    const { data, error } = await createClient().from("reviews")
      .insert({ product_id: productId, user_id: user.id, author: user.name, rating, body: body.trim().slice(0, 1000) })
      .select().single();
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setReviews((r) => [data as Review, ...r]);
    setBody("");
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="container-x border-t border-white/10 py-16">
      <div className="flex items-baseline gap-4">
        <h2 className="h-display">{t("p.reviews")}</h2>
        {reviews.length > 0 && <span className="text-sm text-soft/60"><Stars n={Math.round(avg)} /> {avg.toFixed(1)} ({reviews.length})</span>}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ul className="space-y-6">
          {reviews.length === 0 && <li className="text-soft/50">{t("p.noReviews")}</li>}
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-white/10 pb-6">
              <Stars n={r.rating} />
              <p className="mt-2 text-sm text-soft/80">{r.body}</p>
              <p className="mt-2 text-xs text-soft/40">{r.author} · {new Date(r.created_at).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>

        {configured && (
          user ? (
            <form onSubmit={submit} className="space-y-4">
              <p className="label">{t("p.write")}</p>
              <div className="flex gap-1 text-2xl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={n <= rating ? "text-gold" : "text-white/20"}>★</button>
                ))}
              </div>
              <textarea required maxLength={1000} rows={4} className="field" placeholder={t("p.comment")} value={body} onChange={(e) => setBody(e.target.value)} />
              {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
              <button disabled={busy} className="btn-gold">{t("p.submit")}</button>
            </form>
          ) : (
            <p className="text-sm text-soft/60"><Link href="/login" className="text-gold underline underline-offset-4">{t("p.loginReview")}</Link></p>
          )
        )}
      </div>
    </section>
  );
}
