-- Knightsbridge DEX — Initial Schema
-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- =============================================================================
-- ENUMS
-- =============================================================================

create type subscription_tier as enum ('free', 'pro', 'enterprise');

create type signal_type as enum (
  'smart_money_entry',
  'large_transfer',
  'insider_buy',
  'liquidity_removal',
  'rug_pattern',
  'honeypot_detected',
  'dev_wallet_move',
  'whale_accumulation',
  'unusual_volume'
);

create type supported_chain as enum ('1', '8453');

create type listing_status as enum ('pending', 'live', 'ended', 'cancelled');

create type risk_level as enum ('low', 'medium', 'high', 'critical');

-- =============================================================================
-- USER PROFILES (extends auth.users)
-- =============================================================================

create table user_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  username        text unique,
  tier            subscription_tier not null default 'free',
  tier_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- API KEYS
-- =============================================================================

create table api_keys (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references user_profiles(id) on delete cascade,
  name           text not null,
  key_hash       text not null unique,
  key_prefix     text not null,
  tier           subscription_tier not null,
  rate_limit_rpm integer not null default 60,
  last_used_at   timestamptz,
  usage_count    bigint not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index idx_api_keys_user on api_keys(user_id);
create index idx_api_keys_hash on api_keys(key_hash);

-- =============================================================================
-- API KEY USAGE (sliding window rate limit)
-- =============================================================================

create table api_key_usage (
  id          bigserial primary key,
  key_id      uuid not null references api_keys(id) on delete cascade,
  endpoint    text not null,
  timestamp   timestamptz not null default now(),
  response_ms integer
);

create index idx_api_usage_key_time on api_key_usage(key_id, timestamp desc);

-- Auto-delete usage records older than 24h (keep index small)
create or replace function cleanup_api_usage() returns trigger as $$
begin
  delete from api_key_usage where timestamp < now() - interval '24 hours';
  return null;
end;
$$ language plpgsql;

create trigger trg_cleanup_api_usage
  after insert on api_key_usage
  for each row execute function cleanup_api_usage();

-- =============================================================================
-- WALLETS
-- =============================================================================

create table wallets (
  address        text not null,
  chain          supported_chain not null,
  label          text,
  is_contract    boolean not null default false,
  is_smart_money boolean not null default false,
  is_dev_wallet  boolean not null default false,
  cluster_id     integer,
  total_pnl_usd  numeric(20,4),
  win_rate       numeric(5,4),
  tx_count       integer not null default 0,
  first_seen_at  timestamptz,
  last_active_at timestamptz,
  risk_score     integer,
  metadata       jsonb not null default '{}',
  updated_at     timestamptz not null default now(),
  primary key (address, chain)
);

create index idx_wallets_smart_money on wallets(is_smart_money) where is_smart_money = true;
create index idx_wallets_dev on wallets(is_dev_wallet) where is_dev_wallet = true;
create index idx_wallets_cluster on wallets(cluster_id);
create index idx_wallets_pnl on wallets(total_pnl_usd desc nulls last);

-- =============================================================================
-- WALLET CLUSTERS
-- =============================================================================

create table wallet_clusters (
  id            serial primary key,
  chain         supported_chain not null,
  label         text,
  wallet_count  integer not null default 0,
  total_volume  numeric(20,4),
  behavior_tags text[] not null default '{}',
  risk_level    risk_level,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- TOKENS
-- =============================================================================

create table tokens (
  address          text not null,
  chain            supported_chain not null,
  name             text not null,
  symbol           text not null,
  decimals         integer not null default 18,
  total_supply     numeric(40,0),
  deployer         text,
  deploy_block     bigint,
  deploy_tx        text,
  logo_url         text,
  website          text,
  twitter          text,
  telegram         text,
  price_usd        numeric(30,18),
  market_cap_usd   numeric(20,4),
  volume_24h_usd   numeric(20,4),
  liquidity_usd    numeric(20,4),
  holder_count     integer,
  price_change_1h  numeric(10,4),
  price_change_24h numeric(10,4),
  is_verified      boolean not null default false,
  is_honeypot      boolean,
  has_fake_lp      boolean,
  risk_score       integer,
  risk_level       risk_level,
  last_indexed_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (address, chain)
);

create index idx_tokens_chain on tokens(chain);
create index idx_tokens_risk on tokens(risk_score);
create index idx_tokens_volume on tokens(volume_24h_usd desc nulls last);
create index idx_tokens_symbol_trgm on tokens using gin(symbol gin_trgm_ops);
create index idx_tokens_name_trgm on tokens using gin(name gin_trgm_ops);

-- =============================================================================
-- RISK SCORES (audit trail)
-- =============================================================================

create table risk_scores (
  id             bigserial primary key,
  entity_type    text not null,
  entity_address text not null,
  chain          supported_chain not null,
  score          integer not null,
  factors        jsonb not null,
  computed_at    timestamptz not null default now()
);

create index idx_risk_entity on risk_scores(entity_address, chain, computed_at desc);

-- =============================================================================
-- TRANSACTIONS
-- =============================================================================

create table transactions (
  hash          text not null,
  chain         supported_chain not null,
  block_number  bigint not null,
  block_time    timestamptz not null,
  from_address  text not null,
  to_address    text,
  token_address text,
  token_chain   supported_chain,
  value_eth     numeric(30,18),
  value_usd     numeric(20,4),
  gas_used      bigint,
  tx_type       text,
  dex_protocol  text,
  raw_log       jsonb,
  primary key (hash, chain)
);

create index idx_txns_from on transactions(from_address, block_time desc);
create index idx_txns_token on transactions(token_address, token_chain, block_time desc);
create index idx_txns_block on transactions(chain, block_number desc);

-- =============================================================================
-- SIGNALS
-- =============================================================================

create table signals (
  id             uuid primary key default uuid_generate_v4(),
  type           signal_type not null,
  chain          supported_chain not null,
  token_address  text,
  wallet_address text,
  title          text not null,
  description    text,
  strength       integer not null check (strength between 1 and 100),
  tier_required  subscription_tier not null default 'free',
  metadata       jsonb not null default '{}',
  tx_hash        text,
  block_number   bigint,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index idx_signals_type on signals(type);
create index idx_signals_token on signals(token_address);
create index idx_signals_created on signals(created_at desc);
create index idx_signals_tier on signals(tier_required);
create index idx_signals_chain_created on signals(chain, created_at desc);
create index idx_signals_active on signals(is_active) where is_active = true;

-- =============================================================================
-- LAUNCHPAD LISTINGS
-- =============================================================================

create table launchpad_listings (
  id                uuid primary key default uuid_generate_v4(),
  token_address     text,
  token_chain       supported_chain,
  name              text not null,
  symbol            text not null,
  description       text,
  logo_url          text,
  total_supply      numeric(40,0) not null,
  creator_wallet    text not null,
  creator_user      uuid references user_profiles(id),
  deploy_tx         text,
  factory_address   text,
  status            listing_status not null default 'pending',
  launch_at         timestamptz,
  liquidity_eth     numeric(20,8),
  lock_duration_days integer,
  locker_address    text,
  lock_tx           text,
  risk_score        integer,
  smart_money_count integer not null default 0,
  raise_target_eth  numeric(20,8),
  raise_current_eth numeric(20,8) not null default 0,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_listings_status on launchpad_listings(status);
create index idx_listings_launch_at on launchpad_listings(launch_at);
create index idx_listings_creator on launchpad_listings(creator_user);

-- =============================================================================
-- INDEXER CHECKPOINTS (worker state)
-- =============================================================================

create table indexer_checkpoints (
  chain        supported_chain primary key,
  last_block   bigint not null default 0,
  updated_at   timestamptz not null default now()
);

insert into indexer_checkpoints (chain, last_block) values ('1', 0), ('8453', 0);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table user_profiles enable row level security;
alter table api_keys enable row level security;
alter table api_key_usage enable row level security;

-- Users can only read/update their own profile
create policy "Users read own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users update own profile" on user_profiles
  for update using (auth.uid() = id);

-- Users can only access their own API keys
create policy "Users read own keys" on api_keys
  for select using (auth.uid() = user_id);

create policy "Users insert own keys" on api_keys
  for insert with check (auth.uid() = user_id);

create policy "Users update own keys" on api_keys
  for update using (auth.uid() = user_id);

-- Public read access on tokens, wallets, signals (no auth needed for basic data)
alter table tokens enable row level security;
alter table wallets enable row level security;
alter table signals enable row level security;
alter table launchpad_listings enable row level security;
alter table transactions enable row level security;
alter table risk_scores enable row level security;
alter table wallet_clusters enable row level security;

create policy "Public read tokens" on tokens for select using (true);
create policy "Public read wallets" on wallets for select using (true);
create policy "Public read signals" on signals for select using (true);
create policy "Public read listings" on launchpad_listings for select using (true);
create policy "Public read transactions" on transactions for select using (true);
create policy "Public read risk scores" on risk_scores for select using (true);
create policy "Public read clusters" on wallet_clusters for select using (true);

-- Service role can do everything (used by worker and server-side code)
-- (Service role bypasses RLS by default in Supabase)

-- =============================================================================
-- REALTIME
-- =============================================================================

-- Enable Realtime on signals table
alter publication supabase_realtime add table signals;
