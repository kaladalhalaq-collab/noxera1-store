-- NOXÉRA database schema. Paste into Supabase > SQL Editor > Run (once).
create extension if not exists pgcrypto;

-- ───────────── Tables ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  phone text default '',
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_ar text not null default '',
  desc_en text not null default '',
  desc_ar text not null default '',
  material_en text not null default '',
  material_ar text not null default '',
  gender text not null default 'men' check (gender in ('men','women','unisex')),
  collection text not null default 'gymwear' check (collection in ('gymwear','oversized','compression','essentials','accessories')),
  type text not null default '',
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  sizes text[] not null default '{S,M,L,XL}',
  colors jsonb not null default '[]',
  images text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  is_new boolean not null default false,
  best_seller boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  code text primary key,
  percent integer not null check (percent between 1 and 100),
  min_subtotal numeric(10,2) not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  country text not null,
  payment_method text not null check (payment_method in ('cod','bank_transfer')),
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  coupon_code text,
  tracking_number text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  size text,
  color text,
  qty integer not null check (qty > 0),
  unit_price numeric(10,2) not null
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null default '',
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_items_order on public.order_items(order_id);
create index if not exists idx_reviews_product on public.reviews(product_id);

-- ───────────── Helper functions & triggers ─────────────
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Restock inventory when an order is cancelled
create or replace function public.restock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    for r in select product_id, sum(qty) as q from public.order_items
             where order_id = new.id and product_id is not null group by product_id loop
      update public.products set stock = stock + r.q where id = r.product_id;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists orders_restock on public.orders;
create trigger orders_restock after update of status on public.orders
  for each row execute function public.restock_on_cancel();

-- Atomic order creation. Prices, stock, coupon and shipping are computed HERE, never trusted from the browser.
-- Shipping rule: free when (subtotal - discount) >= 150, otherwise 15. Keep in sync with lib/pricing.ts.
create or replace function public.create_order(
  p_user uuid, p_email text, p_name text, p_phone text, p_address text, p_city text, p_country text,
  p_payment text, p_coupon text, p_notes text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid; v_no bigint; v_item jsonb; v_prod public.products%rowtype;
  v_qty int; v_unit numeric(10,2);
  v_subtotal numeric(10,2) := 0; v_discount numeric(10,2) := 0; v_shipping numeric(10,2) := 0; v_total numeric(10,2);
  v_pct int; v_min numeric; v_code text := nullif(upper(trim(coalesce(p_coupon, ''))), '');
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if p_payment not in ('cod','bank_transfer') then raise exception 'BAD_PAYMENT'; end if;

  insert into public.orders (user_id, email, full_name, phone, address, city, country, payment_method, coupon_code, notes)
  values (p_user, p_email, p_name, p_phone, p_address, p_city, p_country, p_payment, v_code, p_notes)
  returning id, order_no into v_order_id, v_no;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'BAD_QTY'; end if;

    select * into v_prod from public.products
      where id = (v_item->>'product_id')::uuid and active for update;
    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    if not (coalesce(v_item->>'size','') = any (v_prod.sizes)) then raise exception 'BAD_SIZE'; end if;
    if v_prod.stock < v_qty then raise exception 'OUT_OF_STOCK:%', v_prod.name_en; end if;

    v_unit := coalesce(v_prod.sale_price, v_prod.price);
    update public.products set stock = stock - v_qty where id = v_prod.id;
    insert into public.order_items (order_id, product_id, name, size, color, qty, unit_price)
    values (v_order_id, v_prod.id, v_prod.name_en, v_item->>'size', v_item->>'color', v_qty, v_unit);
    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  if v_code is not null then
    select percent, min_subtotal into v_pct, v_min from public.coupons
      where code = v_code and active and (expires_at is null or expires_at > now());
    if not found then raise exception 'BAD_COUPON'; end if;
    if v_subtotal < v_min then raise exception 'COUPON_MIN'; end if;
    v_discount := round(v_subtotal * v_pct / 100.0, 2);
  end if;

  v_shipping := case when v_subtotal - v_discount >= 150 then 0 else 15 end;
  v_total := v_subtotal - v_discount + v_shipping;

  update public.orders set subtotal = v_subtotal, discount = v_discount, shipping = v_shipping, total = v_total
  where id = v_order_id;

  return jsonb_build_object('id', v_order_id, 'order_no', v_no, 'total', v_total);
end $$;

-- Only the server (service role) may create orders.
revoke all on function public.create_order(uuid,text,text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_order(uuid,text,text,text,text,text,text,text,text,text,jsonb) to service_role;

-- ───────────── Row Level Security ─────────────
alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.coupons     enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews     enable row level security;

-- profiles
create policy "profiles: read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own (role locked)" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));
create policy "profiles: admin all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- products
create policy "products: public read active" on public.products for select using (active or public.is_admin());
create policy "products: admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- coupons: admin only (customers validate via the server API)
create policy "coupons: admin all" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- orders: customers read their own; only admins modify; inserts happen via create_order() on the server
create policy "orders: read own or admin" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "orders: admin delete" on public.orders for delete using (public.is_admin());

create policy "order_items: read own or admin" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "order_items: admin write" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- reviews
create policy "reviews: public read" on public.reviews for select using (true);
create policy "reviews: insert own" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews: admin delete" on public.reviews for delete using (public.is_admin());

-- ───────────── Storage (product images) ─────────────
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;
create policy "product-images: public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product-images: admin insert" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin update" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin delete" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());

-- ───────────── Seed catalog ─────────────
insert into public.products (slug,name_en,name_ar,desc_en,desc_ar,material_en,material_ar,gender,collection,type,price,sale_price,sizes,colors,stock,featured,is_new,best_seller) values
('oversized-gym-tee','Oversized Gym Tee','تيشيرت جيم واسع','A heavyweight boxy tee with a dropped shoulder and tonal gold embroidery.','تيشيرت ثقيل بقصّة واسعة وكتف منخفض مع تطريز ذهبي.','240gsm combed cotton','قطن ممشّط 240 غرام','men','oversized','Oversized Tee',48,null,'{S,M,L,XL,XXL}','[{"name":"Black","hex":"#080808"},{"name":"Graphite","hex":"#171717"}]',60,true,true,true),
('compression-shirt','Compression Shirt','قميص ضغط','Second-skin compression that supports the muscle and moves with every rep.','قميص ضغط يلتصق بالجسم ويدعم العضلات مع كل حركة.','82% polyamide, 18% elastane','82% بولي أميد، 18% إيلاستين','men','compression','Compression Shirt',56,45,'{S,M,L,XL}','[{"name":"Black","hex":"#080808"}]',40,true,false,true),
('stringer-tank','Stringer Tank','تانك سترينجر','A deep-cut stringer built for heavy sessions and the gym floor.','تانك بقصّة عميقة مصمم للتمارين الثقيلة.','Cotton-modal blend','مزيج قطن وموداك','men','gymwear','Stringer Tank',38,null,'{S,M,L,XL}','[{"name":"Black","hex":"#080808"},{"name":"Champagne","hex":"#C6A66A"}]',35,false,true,false),
('training-shorts','Training Shorts','شورت تدريب','Lightweight 7-inch shorts with a hidden zip pocket.','شورت خفيف بطول 7 إنش مع جيب مخفي بسحاب.','Recycled stretch-woven nylon','نايلون مرن معاد تدويره','men','gymwear','Training Shorts',52,null,'{S,M,L,XL}','[{"name":"Black","hex":"#080808"},{"name":"Graphite","hex":"#171717"}]',50,false,false,true),
('gym-hoodie','Gym Hoodie','هودي جيم','Heavy fleece hoodie with a structured hood and gold monogram.','هودي من الفليس الثقيل بقبعة مدعّمة وشعار ذهبي.','400gsm brushed fleece','فليس مبطّن 400 غرام','men','gymwear','Gym Hoodie',98,null,'{S,M,L,XL,XXL}','[{"name":"Black","hex":"#080808"}]',25,true,false,false),
('premium-joggers','Premium Joggers','جوجر فاخر','Tapered joggers with a clean silhouette for training and travel.','جوجر بقصّة ضيقة عند الساق للتدريب والسفر.','French terry cotton','قطن تيري فرنسي','men','essentials','Joggers',88,null,'{S,M,L,XL}','[{"name":"Black","hex":"#080808"},{"name":"Graphite","hex":"#171717"}]',30,false,true,false),
('sculpt-sports-bra','Sculpt Sports Bra','حمالة رياضية سكَلبت','High-support, sculpting bra with a seamless gold-trimmed band.','حمالة بدعم عالٍ وتصميم منحوت وشريط ذهبي.','Buttery-soft nylon-elastane','نايلون وإيلاستين ناعم','women','gymwear','Sports Bra',44,null,'{XS,S,M,L}','[{"name":"Black","hex":"#080808"}]',45,true,true,false),
('seamless-leggings','Seamless Leggings','ليجنز سلس','High-waist seamless leggings that stay put through every set.','ليجنز بخصر عالٍ وتصميم سلس يثبت أثناء التمرين.','Seamless knit, 4-way stretch','تريكو سلس مرن بأربعة اتجاهات','women','gymwear','Leggings',76,62,'{XS,S,M,L}','[{"name":"Black","hex":"#080808"},{"name":"Graphite","hex":"#171717"}]',55,true,false,true),
('performance-set','Performance Set','طقم أداء','Matching bra and leggings set, designed to be worn together or apart.','طقم متناسق من حمالة وليجنز يمكن ارتداؤهما معاً أو منفصلين.','Seamless knit, 4-way stretch','تريكو سلس مرن بأربعة اتجاهات','women','gymwear','Performance Set',120,null,'{XS,S,M,L}','[{"name":"Black","hex":"#080808"}]',20,false,true,false),
('oversized-tee-women','Oversized Tee','تيشيرت واسع نسائي','Relaxed oversized tee with a soft drape and a subtle gold mark.','تيشيرت واسع بانسيابية ناعمة وشعار ذهبي هادئ.','220gsm combed cotton','قطن ممشّط 220 غرام','women','oversized','Oversized Tee',46,null,'{XS,S,M,L}','[{"name":"Black","hex":"#080808"},{"name":"Soft White","hex":"#F5F3EF"}]',40,false,false,true),
('noxera-shaker','NOXÉRA Shaker','شيكر نوكسيرا','Matte black 700ml shaker with a gold-foil monogram.','شيكر أسود مطفي سعة 700 مل مع شعار ذهبي.','BPA-free Tritan','تريتان خالٍ من BPA','unisex','accessories','Water Bottle',24,null,'{"One Size"}','[{"name":"Black","hex":"#080808"}]',80,false,true,true),
('noxera-gym-bag','NOXÉRA Gym Bag','حقيبة جيم نوكسيرا','Structured duffel with a ventilated shoe compartment.','حقيبة دوفل مهيكلة مع حجرة تهوية للحذاء.','Water-resistant ballistic nylon','نايلون مقاوم للماء','unisex','accessories','Gym Bag',85,null,'{"One Size"}','[{"name":"Black","hex":"#080808"}]',18,false,false,false)
on conflict (slug) do nothing;

-- ───────────── Make yourself admin (run AFTER you register on the site) ─────────────
-- update public.profiles set role = 'admin' where email = 'you@example.com';
