import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").trim().toUpperCase().slice(0, 40);
  const subtotal = Number(url.searchParams.get("subtotal") ?? 0);
  if (!code) return NextResponse.json({ error: "BAD_COUPON" }, { status: 400 });

  const { data } = await createAdminClient()
    .from("coupons").select("code,percent,min_subtotal,expires_at,active").eq("code", code).maybeSingle();

  const valid = data && data.active && (!data.expires_at || new Date(data.expires_at) > new Date()) && subtotal >= Number(data.min_subtotal);
  if (!valid) return NextResponse.json({ error: "BAD_COUPON" }, { status: 404 });
  return NextResponse.json({ code: data.code, percent: data.percent });
}
