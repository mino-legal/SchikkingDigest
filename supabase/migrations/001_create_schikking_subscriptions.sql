-- SchikkingDigest email subscriptions.
-- Stored in the shared Mino Supabase project, but this agent is open / unauthenticated:
-- there is no user_id link, email itself is the identity, and tokens prove consent.
-- Only the service role touches this table; RLS is enabled with no policies.

create table if not exists public.schikking_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed_at timestamptz,
  confirm_token text not null unique,
  unsubscribe_token text not null unique,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists schikking_subscriptions_confirmed_idx
  on public.schikking_subscriptions (confirmed_at)
  where confirmed_at is not null;

alter table public.schikking_subscriptions enable row level security;
