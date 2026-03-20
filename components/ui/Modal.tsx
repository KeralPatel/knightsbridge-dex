'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className={`relative w-full ${width} bg-[#11161D] border border-[#1F2A37] rounded-lg shadow-2xl animate-fade-in`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2A37]">
            <h3 className="text-base font-semibold text-[#E5E7EB]">{title}</h3>
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors p-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
