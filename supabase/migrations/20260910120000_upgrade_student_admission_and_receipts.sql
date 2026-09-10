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

-- Keep the receipt number unique when staff enter one manually.
create unique index if not exists fee_payments_receipt_no_uidx
on public.fee_payments(receipt_no)
where receipt_no is not null and receipt_no <> '';
