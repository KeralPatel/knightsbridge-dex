'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      localStorage.setItem('kbdex_token', data.token)
      localStorage.setItem('kbdex_user', JSON.stringify(data.user))
      router.push('/')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-6">
      <h1 className="text-xl font-semibold text-[#E5E7EB] mb-1">Create Account</h1>
      <p className="text-sm text-[#9CA3AF] mb-6">Join the intelligence platform</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Username (optional)"
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="satoshi"
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Min 8 characters"
          hint="At least 8 characters"
          required
        />

        {error && (
          <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded px-3 py-2 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          Create Account
        </Button>
      </form>

      {/* Tier comparison */}
      <div className="mt-5 border border-[#1F2A37] rounded overflow-hidden">
        <div className="bg-[#0B0F14] px-3 py-2 border-b border-[#1F2A37]">
          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Free plan includes</p>
        </div>
        {['Token data & risk scores', 'Basic DEX swap', 'Public signals feed', '30 API calls/minute'].map((item) => (
          <div key={item} className="flex items-center gap-2 px-3 py-1.5">
            <svg className="w-3 h-3 text-[#00FFA3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs text-[#9CA3AF]">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-[#9CA3AF]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#00FFA3] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
