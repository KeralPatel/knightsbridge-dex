'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="p-4 bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded text-sm">
          <p className="text-[#EF4444] font-medium mb-1">Something went wrong</p>
          <p className="text-[#9CA3AF] text-xs font-mono">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-xs text-[#9CA3AF] hover:text-[#E5E7EB] underline"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
