alter table public.products
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

comment on column public.products.image_urls is 'Additional product/gallery image URLs for e-book product pages.';
