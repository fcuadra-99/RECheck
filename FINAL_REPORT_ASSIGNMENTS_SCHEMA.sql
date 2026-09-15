-- Final Report Assignments schema (Supabase/PostgreSQL)
-- Run this in Supabase SQL Editor.

-- 1) Create assignment table used by finalReportService.ts
create table if not exists public.final_report_assignments (
  id uuid primary key default gen_random_uuid(),
  final_report_id uuid not null references public.final_reports(id) on delete cascade,
  assignee_id uuid not null references auth.users(id) on delete cascade,
  assignee_name text not null,
  assignee_role text,
  assigned_by_id uuid not null references auth.users(id) on delete restrict,
  assigned_by_name text not null,
  assigned_at timestamptz not null default now(),
  status text not null default 'assigned' check (status in ('assigned', 'submitted')),
  submitted_file_path text,
  submitted_file_name text,
  submitted_comments text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (final_report_id, assignee_id)
);

-- 2) Helpful indexes
create index if not exists idx_final_report_assignments_assignee_id
  on public.final_report_assignments(assignee_id);

create index if not exists idx_final_report_assignments_final_report_id
  on public.final_report_assignments(final_report_id);

create index if not exists idx_final_report_assignments_status
  on public.final_report_assignments(status);

-- 3) Keep updated_at fresh
create or replace function public.set_final_report_assignments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_final_report_assignments_updated_at on public.final_report_assignments;
create trigger trg_final_report_assignments_updated_at
before update on public.final_report_assignments
for each row
execute function public.set_final_report_assignments_updated_at();

-- 4) RLS
alter table public.final_report_assignments enable row level security;

-- Chairperson/Admin can read all assignments
drop policy if exists "final_report_assignments_select_chair_admin" on public.final_report_assignments;
create policy "final_report_assignments_select_chair_admin"
on public.final_report_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in ('chairperson', 'admin')
  )
);

-- Chairperson/Admin can insert assignments
drop policy if exists "final_report_assignments_insert_chair_admin" on public.final_report_assignments;
create policy "final_report_assignments_insert_chair_admin"
on public.final_report_assignments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in ('chairperson', 'admin')
  )
);

-- Chairperson/Admin can delete assignments (used when reassigning)
drop policy if exists "final_report_assignments_delete_chair_admin" on public.final_report_assignments;
create policy "final_report_assignments_delete_chair_admin"
on public.final_report_assignments
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in ('chairperson', 'admin')
  )
);

-- Assignees can read their own assignment rows
drop policy if exists "final_report_assignments_select_assignee" on public.final_report_assignments;
create policy "final_report_assignments_select_assignee"
on public.final_report_assignments
for select
to authenticated
using (assignee_id = auth.uid());

-- Assignees can update only their own rows (submit workflow)
drop policy if exists "final_report_assignments_update_assignee" on public.final_report_assignments;
create policy "final_report_assignments_update_assignee"
on public.final_report_assignments
for update
to authenticated
using (assignee_id = auth.uid())
with check (assignee_id = auth.uid());

-- 5) final_reports access for assigned staff (required for assignee pages)
-- Assignees can read final_reports rows that are assigned to them.
drop policy if exists "final_reports_select_assigned_staff" on public.final_reports;
create policy "final_reports_select_assigned_staff"
on public.final_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.final_report_assignments fra
    where fra.final_report_id = final_reports.id
      and fra.assignee_id = auth.uid()
  )
);

-- Assignees can update final_reports rows assigned to them (attachments/status/last_updated_at update flow).
drop policy if exists "final_reports_update_assigned_staff" on public.final_reports;
create policy "final_reports_update_assigned_staff"
on public.final_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.final_report_assignments fra
    where fra.final_report_id = final_reports.id
      and fra.assignee_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.final_report_assignments fra
    where fra.final_report_id = final_reports.id
      and fra.assignee_id = auth.uid()
  )
);
