-- Knightsbridge DEX — Seed Data
-- Run after migrations to populate initial data

-- =============================================================================
-- KNOWN SMART WALLETS (Ethereum mainnet)
-- =============================================================================

insert into wallets (address, chain, label, is_smart_money, is_dev_wallet, total_pnl_usd, win_rate, tx_count, risk_score)
values
  ('0xd8da6bf26964af9d7eed9e03e53415d37aa96045', '1', 'Vitalik.eth', true, false, 4200000, 0.78, 892, 10),
  ('0xab5801a7d398351b8be11c439e05c5b3259aec9b', '1', null, true, false, 1850000, 0.72, 1247, 15),
  ('0x00000000219ab540356cbb839cbe05303d7705fa', '1', 'ETH2 Deposit Contract', false, false, null, null, 50000, 5),
  ('0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', '1', 'Uniswap Router', false, false, null, null, 9000000, 0),
  ('0x7a250d5630b4cf539739df2c5dacb4c659f2488d', '1', 'Uniswap V2 Router', false, false, null, null, 8000000, 0)
on conflict (address, chain) do nothing;

-- =============================================================================
-- WALLET CLUSTERS (examples)
-- =============================================================================

insert into wallet_clusters (chain, label, wallet_count, behavior_tags, risk_level)
values
  ('1', 'Alpha Traders', 7, array['coordinated', 'synchronized', 'early_entry'], 'low'),
  ('1', 'Suspected Insider Group', 4, array['pre_launch', 'coordinated', 'same_funder'], 'high'),
  ('1', 'Wash Trading Ring', 3, array['round_trip', 'gas_match', 'coordinated'], 'critical'),
  ('8453', 'Base Smart Money', 5, array['synchronized', 'whale'], 'low')
on conflict do nothing;

-- =============================================================================
-- INITIAL INDEXER CHECKPOINTS
-- =============================================================================

-- Start indexing from recent blocks (adjust to current block - 1000 for faster initial sync)
update indexer_checkpoints set last_block = 19000000 where chain = '1';
update indexer_checkpoints set last_block = 8000000 where chain = '8453';
