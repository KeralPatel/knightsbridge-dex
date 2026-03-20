'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { AddressTag } from '@/components/common/AddressTag'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  tier: string
  rate_limit_rpm: number
  last_used_at: string | null
  usage_count: number
  is_active: boolean
  created_at: string
}

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  const fetchKeys = async () => {
    const token = localStorage.getItem('kbdex_token')
    const res = await fetch('/api/user/api-keys', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setKeys(data.keys)
    }
    setLoading(false)
  }

  useEffect(() => { fetchKeys() }, [])

  const createKey = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    const token = localStorage.getItem('kbdex_token')
    const res = await fetch('/api/user/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newKeyName }),
    })
    const data = await res.json()
    if (res.ok) {
      setNewKey(data.key)
      setNewKeyName('')
      fetchKeys()
    }
    setCreating(false)
  }

  const deleteKey = async (id: string) => {
    const token = localStorage.getItem('kbdex_token')
    await fetch(`/api/user/api-keys?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchKeys()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#E5E7EB]">API Keys</h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Use these keys to access the Knightsbridge DEX API</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + New Key
        </Button>
      </div>

      {/* API base URL */}
      <div className="bg-[#0B0F14] border border-[#1F2A37] rounded px-3 py-2">
        <p className="text-xs text-[#9CA3AF] mb-1">Base URL</p>
        <code className="text-xs text-[#00FFA3] font-mono">{process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api</code>
      </div>

      {/* Keys list */}
      <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-[#9CA3AF]">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#9CA3AF]">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Tier</th>
                <th>Rate Limit</th>
                <th>Last Used</th>
                <th>Usage</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="font-medium text-[#E5E7EB]">{key.name}</td>
                  <td>
                    <code className="text-xs font-mono text-[#9CA3AF] bg-[#0B0F14] px-2 py-0.5 rounded">
                      {key.key_prefix}••••••••
                    </code>
                  </td>
                  <td><Badge variant={key.tier === 'pro' ? 'blue' : key.tier === 'enterprise' ? 'yellow' : 'default'} size="xs">{key.tier}</Badge></td>
                  <td className="tabular-nums text-[#9CA3AF]">{key.rate_limit_rpm} rpm</td>
                  <td className="text-[#9CA3AF]">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</td>
                  <td className="tabular-nums text-[#9CA3AF]">{key.usage_count.toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => deleteKey(key.id)}
                      className="text-xs text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* API docs reference */}
      <div className="bg-[#0B0F14] border border-[#1F2A37] rounded-lg p-4">
        <p className="text-xs font-semibold text-[#E5E7EB] mb-2">Quick Reference</p>
        <pre className="text-xs text-[#9CA3AF] font-mono overflow-x-auto">
{`# Example: Get token risk score
curl -H "Authorization: Bearer kbdex_your_key" \\
  /api/tokens/0xabc.../risk

# Example: Get DEX quote
curl "/api/dex/quote?sellToken=ETH&buyToken=USDC&sellAmount=1000000000000000000"`}
        </pre>
      </div>

      {/* Create key modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setNewKey(null) }} title="Create API Key">
        {newKey ? (
          <div className="space-y-4">
            <div className="bg-[rgba(0,255,163,0.05)] border border-[rgba(0,255,163,0.2)] rounded p-3">
              <p className="text-xs text-[#00FFA3] font-medium mb-2">Copy this key — it will only be shown once</p>
              <code className="text-xs font-mono text-[#E5E7EB] break-all">{newKey}</code>
            </div>
            <Button fullWidth onClick={() => { navigator.clipboard.writeText(newKey) }}>
              Copy Key
            </Button>
            <Button variant="outline" fullWidth onClick={() => { setShowCreate(false); setNewKey(null) }}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Key Name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production App"
            />
            <Button fullWidth loading={creating} onClick={createKey}>
              Generate Key
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function SubscriptionTab() {
  const TIERS = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['Token data & risk scores', 'Basic signals (free tier only)', 'DEX swap via 0x', '30 API calls/minute', '1 API key'],
      tier: 'free',
    },
    {
      name: 'Pro',
      price: '$99',
      period: '/month USDT',
      features: ['Everything in Free', 'Wallet intelligence (Pro)', 'Advanced signals (all types)', 'Insider detection alerts', '60 API calls/minute', '5 API keys', 'Holder distribution data'],
      tier: 'pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$499',
      period: '/month USDT',
      features: ['Everything in Pro', 'Custom alert webhooks', '1,000 API calls/minute', '20 API keys', 'Priority support', 'Dedicated onboarding'],
      tier: 'enterprise',
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#E5E7EB]">Subscription Plans</h3>
        <p className="text-xs text-[#9CA3AF] mt-0.5">Pay with USDT on Ethereum or Base</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TIERS.map((tier) => (
          <div
            key={tier.tier}
            className={`bg-[#0B0F14] border rounded-lg p-4 relative
              ${tier.popular ? 'border-[#00FFA3]' : 'border-[#1F2A37]'}`}
          >
            {tier.popular && (
              <div className="absolute -top-2.5 left-4">
                <Badge variant="green" size="xs">Most Popular</Badge>
              </div>
            )}
            <div className="mb-4">
              <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">{tier.name}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-semibold text-[#E5E7EB]">{tier.price}</span>
                <span className="text-xs text-[#9CA3AF]">{tier.period}</span>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-[#9CA3AF]">
                  <svg className="w-3 h-3 text-[#00FFA3] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            {tier.tier !== 'free' && (
              <div className="bg-[#11161D] border border-[#1F2A37] rounded p-3">
                <p className="text-xs text-[#9CA3AF] mb-1">Send USDT to:</p>
                <AddressTag address="0xYourUSDTReceivingWalletHere" showCopy showLink={false} />
                <p className="text-xs text-[#9CA3AF] mt-2">Then email proof to: billing@kbdex.io</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="p-5 max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#E5E7EB]">Settings</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Manage your account, API keys, and subscription</p>
      </div>

      <Tabs defaultTab="api-keys">
        <TabList>
          <Tab value="api-keys">API Keys</Tab>
          <Tab value="subscription">Subscription</Tab>
        </TabList>

        <div className="mt-5">
          <TabPanel value="api-keys"><ApiKeysTab /></TabPanel>
          <TabPanel value="subscription"><SubscriptionTab /></TabPanel>
        </div>
      </Tabs>
    </div>
  )
}
