"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Monogram } from "./Logo";
import { useApp } from "./Providers";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const configured = supabaseConfigured();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setInfo("");
    const sb = createClient();
    if (mode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { setErr(error.message); return; }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/account");
      router.refresh();
    } else {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/login` } });
      setBusy(false);
      if (error) { setErr(error.message); return; }
      if (data.session) { router.push("/account"); router.refresh(); } else setInfo(t("auth.check"));
    }
  }

  return (
    <div className="container-x grid place-items-center py-20">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 border border-gold/20 bg-graphite p-8">
        <div className="flex justify-center"><Monogram className="h-12 w-12" /></div>
        <h1 className="h-display text-center !text-3xl">{t(mode === "login" ? "auth.login" : "auth.register")}</h1>
        {!configured && <p className="text-center text-sm text-red-400">{t("auth.notConf")}</p>}
        {mode === "register" && (
          <div><label className="label" htmlFor="n">{t("auth.name")}</label><input id="n" required className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
        )}
        <div><label className="label" htmlFor="e">{t("auth.email")}</label><input id="e" required type="email" className="field" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        <div><label className="label" htmlFor="p">{t("auth.password")}</label><input id="p" required type="password" minLength={8} className="field" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        {info && <p role="status" className="text-sm text-gold">{info}</p>}
        <button disabled={busy || !configured} className="btn-gold w-full">{t(mode === "login" ? "auth.login" : "auth.register")}</button>
        <p className="text-center text-sm text-soft/60">
          {t(mode === "login" ? "auth.noAcc" : "auth.haveAcc")}{" "}
          <Link href={mode === "login" ? "/register" : "/login"} className="text-gold underline underline-offset-4">{t(mode === "login" ? "auth.register" : "auth.login")}</Link>
        </p>
      </form>
    </div>
  );
}
