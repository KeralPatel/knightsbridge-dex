const BASE_URLS: Record<number, string> = {
  1:    'https://api.0x.org',
  8453: 'https://base.api.0x.org',
}

export function get0xBaseUrl(chainId: number = 1): string {
  const url = BASE_URLS[chainId]
  if (!url) throw new Error(`0x API not supported on chain ${chainId}`)
  return url
}

export async function fetch0x(path: string, chainId: number = 1, params?: Record<string, string>) {
  const baseUrl = get0xBaseUrl(chainId)
  const url = new URL(`${baseUrl}${path}`)
  // 0x v2 requires chainId as a query param
  url.searchParams.set('chainId', chainId.toString())
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: {
      '0x-api-key': process.env.ZERO_EX_API_KEY!,
      '0x-version': 'v2',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ reason: 'Unknown error' }))
    throw new Error(err.reason || `0x API error ${res.status}`)
  }

  return res.json()
}
