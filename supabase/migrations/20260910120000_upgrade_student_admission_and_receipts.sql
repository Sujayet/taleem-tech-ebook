-- Taleem Tech admission + receipt upgrade
-- Adds fields from the centre's admission process and receipt reference.

alter table public.students add column if not exists qualification text;
alter table public.students add column if not exists school_college text;
alter table public.students add column if not exists address text;
alter table public.students add column if not exists dob date;
alter table public.students add column if not exists gender text;
alter table public.students add column if not exists whatsapp text;
alter table public.students add column if not exists admission_fee numeric(12,2) not null default 0 check (admission_fee >= 0);

create index if not exists students_course_idx on public.students(course);
create index if not exists students_join_date_idx on public.students(join_date);

-- Automatic receipt numbering for new payments. Existing receipt numbers are preserved.
create sequence if not exists public.fee_receipt_no_seq start 6697;
do $$
declare
  max_no bigint;
begin
  select max(receipt_no::bigint) into max_no
  from public.fee_payments
  where receipt_no ~ '^[0-9]+$';
  if max_no is not null and max_no >= 6697 then
    perform setval('public.fee_receipt_no_seq', max_no, true);
  else
    perform setval('public.fee_receipt_no_seq', 6696, true);
  end if;
end $$;

alter table public.fee_payments
  alter column receipt_no set default nextval('public.fee_receipt_no_seq')::text;

create unique index if not exists fee_payments_receipt_no_uidx
on public.fee_payments(receipt_no)
where receipt_no is not null and receipt_no <> '';
