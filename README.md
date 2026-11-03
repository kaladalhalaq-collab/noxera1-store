# NOXÉRA — Beyond Limits. Beyond Ordinary.

Luxury fitness-fashion store: Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · Supabase (Postgres, Auth, Storage, RLS).
English + Arabic (full RTL). Deploys to Vercel.

## What is included
- **Storefront:** cinematic founder hero (layered CSS-3D parallax, pointer/touch tilt, animated gold aura, gold particles), men / women / gymwear / new / best-seller / all collections with type filters, product page (gallery + hover zoom, color & size, quantity, size guide, stock state, related products, reviews), persistent cart, checkout, account with order history and tracking numbers.
- **Admin (`/admin`):** overview analytics, product CRUD with image upload to Supabase Storage, order management (status, tracking, auto-restock on cancel), coupons, customers (purchase history, roles).
- **Security:** Row Level Security on every table; `is_admin()` role check; orders are created only by a server route calling a service-role-only SQL function that recomputes prices, stock, coupon and shipping. The service key never reaches the browser.
- **Payments:** Cash on delivery and manual bank transfer only. No payment is ever simulated. To add a card gateway later, create the order as `pending` and confirm it from the gateway's webhook.

## 1. Run locally
```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run dev                     # http://localhost:3000
```
Without Supabase variables the site still browses a built-in sample catalog; checkout, login and admin stay disabled until Supabase is configured.

## 2. Supabase setup
1. Create a project at supabase.com.
2. **SQL Editor** → paste all of `supabase/schema.sql` → Run. This creates tables, RLS policies, the `create_order` function, the `product-images` storage bucket and a sample catalog.
3. **Project Settings → API**: copy the Project URL, `anon` key and `service_role` key into `.env.local`.
4. **Authentication → URL Configuration**: set Site URL to your domain (and add `http://localhost:3000` for dev). Optional: disable "Confirm email" while testing.
5. Register an account on the site, then make it admin in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
6. Open `/admin`. Upload real product photos from the Products tab.

## 3. Environment variables
| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon key (safe; protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Used by `/api/checkout` and `/api/coupon`. Never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_CURRENCY` | public | ISO code, default `USD` |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL for metadata |

## 4. Upload to GitHub manually
Unzip, then in the project folder (do **not** commit `.env.local`; `.gitignore` already excludes it):
```bash
git init
git add .
git commit -m "NOXÉRA storefront"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```
Using the website instead: create an empty repo → "uploading an existing file" → drag the **contents** of the folder in (keep folder structure; GitHub Desktop is easier for many files).

## 5. Deploy on Vercel
1. vercel.com → Add New → Project → import the GitHub repo (framework auto-detects Next.js).
2. Add the five environment variables above (Production + Preview).
3. Deploy. Then set Supabase Auth → Site URL to the Vercel/custom domain.
Build command `next build`, output handled by Vercel automatically.

## Notes & next steps
- `next.config.mjs` sets `ignoreBuildErrors` / `ignoreDuringBuilds` because this code was written without being compiled. Run `npm run typecheck`, fix anything it reports, then delete those two lines.
- Stock is tracked per product (not per size/color variant).
- Shipping rule (free ≥ 150, else 15) lives in `lib/pricing.ts` and `create_order()` — edit both together.
- Not included yet: standalone content pages (FAQ, policies, contact), order-confirmation emails, wishlist, currency switcher, a Three.js emblem. The hero depth effect uses CSS 3D and Framer Motion instead.
- Product photos: until you upload images, cards show a branded gold-monogram tile.
