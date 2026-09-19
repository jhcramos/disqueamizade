-- Server-owned household simulation. Browsers cannot read or overwrite snapshots directly.
create table if not exists public.house_resident_world (
 id text primary key check (id = 'main'),
 revision bigint not null default 0,
 payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.house_resident_world enable row level security;
revoke all on public.house_resident_world from public, anon, authenticated;
grant select, insert, update on public.house_resident_world to service_role;
insert into public.house_resident_world (id) values ('main') on conflict do nothing;
