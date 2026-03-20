'use client'

import { useState, createContext, useContext } from 'react'

interface TabsContextValue {
  active: string
  setActive: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue>({ active: '', setActive: () => {} })

interface TabsProps {
  defaultTab: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultTab, children, className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultTab)
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: React.ReactNode
  className?: string
}

export function TabList({ children, className = '' }: TabListProps) {
  return (
    <div className={`flex items-center gap-0 border-b border-[#1F2A37] ${className}`}>
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  children: React.ReactNode
}

export function Tab({ value, children }: TabProps) {
  const { active, setActive } = useContext(TabsContext)
  const isActive = active === value
  return (
    <button
      onClick={() => setActive(value)}
      className={`
        px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
        ${isActive
          ? 'border-[#00FFA3] text-[#00FFA3]'
          : 'border-transparent text-[#9CA3AF] hover:text-[#E5E7EB]'
        }
      `}
    >
      {children}
    </button>
  )
}

interface TabPanelProps {
  value: string
  children: React.ReactNode
}

export function TabPanel({ value, children }: TabPanelProps) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null
  return <div className="animate-fade-in">{children}</div>
}
