-- Taleem Tech Student & Fees CRM
-- Safe to run after the initial manual migration; objects are created idempotently.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  admission_no text unique not null,
  full_name text not null,
  guardian_name text,
  phone text,
  email text,
  course text,
  batch text,
  join_date date not null default current_date,
  status text not null default 'active' check (status in ('active','completed','inactive')),
  total_fee numeric(12,2) not null default 0 check (total_fee >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  paid_on date not null default current_date,
  method text not null default 'cash' check (method in ('cash','upi','bank','card','other')),
  receipt_no text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists students_status_idx on public.students(status);
create index if not exists students_phone_idx on public.students(phone);
create index if not exists students_admission_no_idx on public.students(admission_no);
create index if not exists fee_payments_student_id_idx on public.fee_payments(student_id);
create index if not exists fee_payments_paid_on_idx on public.fee_payments(paid_on);
create unique index if not exists fee_payments_receipt_no_uidx on public.fee_payments(receipt_no) where receipt_no is not null and receipt_no <> '';

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.students_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists students_set_updated_at_trigger on public.students;
create trigger students_set_updated_at_trigger before update on public.students for each row execute function public.students_set_updated_at();

alter table public.students enable row level security;
alter table public.fee_payments enable row level security;

drop policy if exists "admins can manage students" on public.students;
create policy "admins can manage students" on public.students for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins can manage fee payments" on public.fee_payments;
create policy "admins can manage fee payments" on public.fee_payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
