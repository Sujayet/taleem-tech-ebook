-- Harden order creation for the digital store.
-- The checkout Edge Function validates products and creates the order atomically at the application layer.
-- Keep client-side direct writes blocked; only the authenticated Edge Function should create order records.

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "users can insert own orders" on public.orders;
drop policy if exists "users can insert own order items" on public.order_items;

-- Customers can read their own orders/items, while creation is handled by create-order-v2.
drop policy if exists "users can view own orders" on public.orders;
create policy "users can view own orders" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "users can view own order items" on public.order_items;
create policy "users can view own order items" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );
