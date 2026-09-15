-- Digital product CRM fields inspired by the requested commerce workflow.
-- Adds delivery assets, merchandising metadata, specifications and variants.

alter table public.products
  add column if not exists brand text,
  add column if not exists product_type text not null default 'Digital Product',
  add column if not exists tags text[] not null default '{}',
  add column if not exists delivery_url text,
  add column if not exists backup_url text,
  add column if not exists access_instructions text,
  add column if not exists specifications jsonb not null default '{}'::jsonb;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  name text,
  price numeric(12,2) not null default 0 check (price >= 0),
  compare_at_price numeric(12,2) not null default 0 check (compare_at_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  color text,
  size_volume text,
  material text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, sku)
);

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_sku_idx on public.product_variants(sku);

alter table public.product_variants enable row level security;
drop policy if exists "admins can manage product variants" on public.product_variants;
create policy "admins can manage product variants" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

comment on column public.products.delivery_url is 'Primary digital delivery URL such as Google Drive, CDN or direct download.';
comment on column public.products.backup_url is 'Optional backup delivery URL.';
comment on column public.products.access_instructions is 'Customer-facing access notes, passwords or redemption instructions.';
comment on column public.products.specifications is 'Flexible product specification key/value data.';
