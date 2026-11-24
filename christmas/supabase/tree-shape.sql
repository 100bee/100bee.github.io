-- Tree shape setting for 100bee.github.io/christmas
-- Run once in the Supabase SQL Editor.
-- Before running: replace 'YOUR_ADMIN_EMAIL@example.com' below with the email you use to log in at #admin
-- (if you have more than one admin, list them all in the array).

-- 1. Site-wide settings, readable by everyone
create table if not exists public.site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "settings are public" on public.site_settings;
create policy "settings are public" on public.site_settings
  for select to anon, authenticated using (true);
-- No insert/update/delete policies: only the function below can change settings.

grant select on public.site_settings to anon, authenticated;

-- 2. Only the admin can change a setting, and only to an allowed value
create or replace function public.admin_set_setting(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> all (array['YOUR_ADMIN_EMAIL@example.com']) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if p_key = 'tree_shape' and p_value in ('tiers', 'spiky', 'cone') then
    insert into public.site_settings (key, value, updated_at)
    values (p_key, p_value, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  else
    raise exception 'bad_setting' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.admin_set_setting(text, text) from public, anon;
grant execute on function public.admin_set_setting(text, text) to authenticated;

-- 3. Start with the 5-tier tree
insert into public.site_settings (key, value) values ('tree_shape', 'tiers')
on conflict (key) do nothing;
