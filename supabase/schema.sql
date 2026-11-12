-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전하도록 작성되어 있습니다.

-- 1. 답변 저장 테이블 ------------------------------------------------------
create table if not exists public.entries (
  owner_id   uuid        not null default auth.uid() references auth.users (id),
  key        text        not null,
  value      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner_id, key)
);

alter table public.entries enable row level security;

drop policy if exists "entries_owner_all" on public.entries;
create policy "entries_owner_all" on public.entries
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 2. 첨부 파일 목록 테이블 --------------------------------------------------
create table if not exists public.attachments (
  id         uuid        primary key default gen_random_uuid(),
  owner_id   uuid        not null default auth.uid() references auth.users (id),
  field_key  text        not null,
  name       text        not null,
  path       text        not null,
  size       bigint      not null default 0,
  mime       text,
  created_at timestamptz not null default now()
);

create index if not exists attachments_owner_field on public.attachments (owner_id, field_key);

alter table public.attachments enable row level security;

drop policy if exists "attachments_owner_all" on public.attachments;
create policy "attachments_owner_all" on public.attachments
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 3. 첨부 파일 저장소 (비공개 버킷) ----------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- 파일 경로는 "<사용자 id>/<파일>" 형식이고, 본인 폴더만 접근할 수 있습니다.
drop policy if exists "attachments_bucket_select" on storage.objects;
create policy "attachments_bucket_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "attachments_bucket_insert" on storage.objects;
create policy "attachments_bucket_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "attachments_bucket_delete" on storage.objects;
create policy "attachments_bucket_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. 일시 정지 방지용 기록 (Vercel Cron 이 매일 호출) -------------------------
create table if not exists public.keepalive (
  id        int         primary key default 1,
  pinged_at timestamptz not null default now(),
  count     bigint      not null default 0,
  constraint keepalive_single_row check (id = 1)
);

alter table public.keepalive enable row level security;
-- 정책을 만들지 않으므로 테이블에 직접 접근은 불가능하고, 아래 함수로만 기록됩니다.

create or replace function public.keepalive_ping()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  t timestamptz;
begin
  insert into public.keepalive (id, pinged_at, count)
  values (1, now(), 1)
  on conflict (id) do update
    set pinged_at = now(), count = public.keepalive.count + 1
  returning pinged_at into t;
  return t;
end;
$$;

revoke all on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon, authenticated;

-- 로그인한 본인은 마지막 유지 기록 시간을 화면에서 확인할 수 있습니다.
drop policy if exists "keepalive_read" on public.keepalive;
create policy "keepalive_read" on public.keepalive
  for select to authenticated
  using (true);
