create table if not exists public.publication_issues (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  issue_date date not null,
  created_at timestamp with time zone default now()
);

alter table public.publication_issues enable row level security;

create unique index if not exists publication_issues_publication_id_issue_date_idx
on public.publication_issues (publication_id, issue_date);

-- In case the table already existed without client_id (partial executions), add it
alter table public.publication_issues
  add column if not exists client_id uuid references public.clients(id) on delete cascade;

create index if not exists publication_issues_client_id_idx
on public.publication_issues (client_id);

drop policy if exists "publication_issues_select_authenticated" on public.publication_issues;
create policy "publication_issues_select_authenticated"
on public.publication_issues for select
to authenticated
using (true);

-- Ensure publications exist and are linked to the matching clients
insert into public.publications (name, dpi_default, min_font_size, bleed_px, safe_px, size_presets, client_id)
select 'COMMUNITY CONNECTION', 300, 6, 0, 0, '[]'::jsonb, c.id
from public.clients c
where c.name = 'COMMUNITY CONNECTION'
and not exists (select 1 from public.publications p where p.name = 'COMMUNITY CONNECTION');

insert into public.publications (name, dpi_default, min_font_size, bleed_px, safe_px, size_presets, client_id)
select 'EZSELL', 300, 6, 0, 0, '[]'::jsonb, c.id
from public.clients c
where c.name = 'EZSELL'
and not exists (select 1 from public.publications p where p.name = 'EZSELL');

insert into public.publications (name, dpi_default, min_font_size, bleed_px, safe_px, size_presets, client_id)
select 'DIEBOTSCHAFT', 300, 6, 0, 0, '[]'::jsonb, c.id
from public.clients c
where c.name = 'DIEBOTSCHAFT'
and not exists (select 1 from public.publications p where p.name = 'DIEBOTSCHAFT');

update public.publications p
set client_id = c.id
from public.clients c
where p.name = 'EZSELL' and c.name = 'EZSELL' and (p.client_id is distinct from c.id);

update public.publications p
set client_id = c.id
from public.clients c
where p.name = 'DIEBOTSCHAFT' and c.name = 'DIEBOTSCHAFT' and (p.client_id is distinct from c.id);

update public.publications p
set client_id = c.id
from public.clients c
where p.name = 'COMMUNITY CONNECTION' and c.name = 'COMMUNITY CONNECTION' and (p.client_id is distinct from c.id);

-- Backfill client_id on publication_issues and enforce not null
update public.publication_issues i
set client_id = p.client_id
from public.publications p
where p.id = i.publication_id and (i.client_id is null or i.client_id is distinct from p.client_id);

-- Keep client_id in sync with publication via trigger
create or replace function public.set_publication_issues_client_id()
returns trigger as $$
begin
  new.client_id := (select client_id from public.publications where id = new.publication_id);
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists publication_issues_set_client_id on public.publication_issues;
create trigger publication_issues_set_client_id
before insert or update on public.publication_issues
for each row execute function public.set_publication_issues_client_id();

alter table public.publication_issues
  alter column client_id set not null;

insert into public.publication_issues (publication_id, client_id, issue_date)
select p.id, p.client_id, v.d::date
from public.publications p
cross join (values ('2025-12-26'), ('2026-01-02'), ('2026-01-09'), ('2026-01-16')) as v(d)
where p.name = 'COMMUNITY CONNECTION'
on conflict (publication_id, issue_date) do nothing;

insert into public.publication_issues (publication_id, client_id, issue_date)
select p.id, p.client_id, v.d::date
from public.publications p
cross join (values ('2026-01-03'), ('2026-01-10'), ('2026-01-17'), ('2026-01-24')) as v(d)
where p.name = 'EZSELL'
on conflict (publication_id, issue_date) do nothing;

insert into public.publication_issues (publication_id, client_id, issue_date)
select p.id, p.client_id, v.d::date
from public.publications p
cross join (values ('2025-12-27'), ('2026-01-03'), ('2026-01-10'), ('2026-01-17')) as v(d)
where p.name = 'DIEBOTSCHAFT'
on conflict (publication_id, issue_date) do nothing;
