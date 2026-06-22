create table if not exists public.coins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  front_image_path text not null,
  back_image_path text not null,
  country text not null,
  year int,
  denomination text not null,
  name text not null,
  material text,
  mint_mark text,
  numista_id text,
  numista_url text,
  price_table jsonb,
  selected_grade text not null,
  estimated_value numeric,
  value_currency text not null default 'PLN',
  value_source text not null check (value_source in ('numista','ai_estimate','manual')),
  mintage bigint,
  rarity_label text,
  purchase_price numeric,
  notes text
);

alter table public.coins enable row level security;

create policy "owner can read" on public.coins
  for select using (auth.uid() = owner_id);
create policy "owner can insert" on public.coins
  for insert with check (auth.uid() = owner_id);
create policy "owner can update" on public.coins
  for update using (auth.uid() = owner_id);
create policy "owner can delete" on public.coins
  for delete using (auth.uid() = owner_id);

insert into storage.buckets (id, name, public)
values ('coin-images', 'coin-images', false)
on conflict (id) do nothing;

create policy "owner rw images" on storage.objects
  for all using (bucket_id = 'coin-images' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'coin-images' and auth.uid()::text = (storage.foldername(name))[1]);
