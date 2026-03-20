'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
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
      <h1 className="text-xl font-semibold text-[#E5E7EB] mb-1">Sign In</h1>
      <p className="text-sm text-[#9CA3AF] mb-6">Access your intelligence dashboard</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded px-3 py-2 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          Sign In
        </Button>
      </form>

      <div className="mt-4 pt-4 border-t border-[#1F2A37] text-center text-sm text-[#9CA3AF]">
        No account?{' '}
        <Link href="/signup" className="text-[#00FFA3] hover:underline">
          Create one
        </Link>
      </div>

      {/* Demo credentials note */}
      <div className="mt-3 bg-[#0B0F14] rounded border border-[#1F2A37] px-3 py-2 text-xs text-[#9CA3AF]">
        <span className="text-[#9CA3AF]">Demo: </span>
        <span className="font-mono text-[#E5E7EB]">demo@kbdex.io</span>
        <span className="text-[#9CA3AF]"> / </span>
        <span className="font-mono text-[#E5E7EB]">demo1234</span>
      </div>
    </div>
  )
}
