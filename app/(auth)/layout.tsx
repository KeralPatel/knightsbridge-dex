export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-[#00FFA3] rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-[#0B0F14]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
          <div>
            <div className="text-base font-semibold text-[#E5E7EB]">Knightsbridge DEX</div>
            <div className="text-xs text-[#00FFA3]">INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
