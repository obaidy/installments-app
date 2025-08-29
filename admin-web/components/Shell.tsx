"use client";
import Link from 'next/link'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'
import { cn } from '@/components/ui/utils'
import { usePathname } from 'next/navigation'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabaseClient'
import { DashboardIcon, ApprovalsIcon, ComplexesIcon, UnitsIcon, InstallmentsIcon, ServiceFeesIcon, PaymentsIcon, ReconciliationIcon, UsersIcon } from '@/components/icons'

const nav = [
  { href: '/', key: 'dashboard' as const, icon: '📊' },
  { href: '/approvals', key: 'approvals' as const, icon: '✅' },
  { href: '/complexes', key: 'complexes' as const, icon: '🏢' },
  { href: '/units', key: 'units' as const, icon: '🏠' },
  { href: '/installments', key: 'installments' as const, icon: '🧾' },
  { href: '/service-fees', key: 'serviceFees' as const, icon: '🛠️' },
  { href: '/payments', key: 'payments' as const, icon: '💸' },
  { href: '/reconciliation', key: 'reconciliation' as const, icon: '📒' },
  { href: '/users', key: 'users' as const, icon: '👤' },
]

// Icon-based nav variant used for rendering
const NAV = [
  { href: '/', key: 'dashboard' as const, icon: DashboardIcon },
  { href: '/approvals', key: 'approvals' as const, icon: ApprovalsIcon },
  { href: '/complexes', key: 'complexes' as const, icon: ComplexesIcon },
  { href: '/units', key: 'units' as const, icon: UnitsIcon },
  { href: '/installments', key: 'installments' as const, icon: InstallmentsIcon },
  { href: '/service-fees', key: 'serviceFees' as const, icon: ServiceFeesIcon },
  { href: '/payments', key: 'payments' as const, icon: PaymentsIcon },
  { href: '/reconciliation', key: 'reconciliation' as const, icon: ReconciliationIcon },
  { href: '/users', key: 'users' as const, icon: UsersIcon },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { dark, toggleDark, rtl, toggleRtl, locale, setLocale } = useTheme()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-dvh grid md:grid-cols-[220px_1fr] grid-cols-1">
      <aside className="bg-[#0A2540] text-white p-4 space-y-2 hidden md:block">
        <div className="text-lg font-semibold mb-4">Admin</div>
        <nav className="space-y-2">
          {NAV.map((n) => {
            const active = pathname === n.href
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn('relative block px-3 py-2 rounded-md transition transform hover:scale-[0.99]', active ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/10')}
              >
                <span className="inline-flex items-center gap-2">
                  <n.icon size={16} />
                  <span>{t(locale, n.key)}</span>
                </span>
                {active ? <span className={cn('absolute top-1/2 -translate-y-1/2 h-5 w-1 bg-white/70 rounded', rtl ? 'right-0' : 'left-0')} /> : null}
              </Link>
            )
          })}
        </nav>
        <div className="mt-6 grid gap-2">
          <button className="text-left text-sm opacity-80 hover:opacity-100" onClick={toggleDark}>{dark ? 'Light' : 'Dark'} mode</button>
          <button className="text-left text-sm opacity-80 hover:opacity-100" onClick={toggleRtl}>{rtl ? 'LTR' : 'RTL'}</button>
          <div className="flex gap-2 mt-2">
            <button className={cn('text-xs px-2 py-1 rounded', locale==='ar'?'bg-white/20':'hover:bg-white/10')} onClick={() => setLocale('ar')}>العربية</button>
            <button className={cn('text-xs px-2 py-1 rounded', locale==='en'?'bg-white/20':'hover:bg-white/10')} onClick={() => setLocale('en')}>English</button>
            <button className={cn('text-xs px-2 py-1 rounded', locale==='ku'?'bg-white/20':'hover:bg-white/10')} onClick={() => setLocale('ku')}>کوردی</button>
          </div>
        </div>
      </aside>
      <section className="bg-background min-h-dvh">
        <header className="border-b border-border px-4 md:px-6 py-3 flex items-center justify-between bg-card/60 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button className="md:hidden inline-flex items-center justify-center rounded-md px-2 py-1 bg-[#0A2540] text-white" onClick={() => setOpen(true)}>
              ☰
            </button>
            <div className="text-lg font-semibold">{t(locale,'adminTitle')}</div>
          </div>
          <div className="flex items-center gap-3 text-sm opacity-80">
            <span>{locale.toUpperCase()}</span>
            <button
              className="px-3 py-1.5 rounded-md border border-border opacity-80 hover:opacity-100"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                } finally {
                  try { document.cookie = 'sb-access-token=; Max-Age=0; Path=/'; document.cookie = 'sb-refresh-token=; Max-Age=0; Path=/'; } catch {}
                  window.location.href = '/auth/login';
                }
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-4 md:p-6">{children}</div>
      </section>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute top-0 bottom-0 right-0 w-72 bg-[#0A2540] text-white p-4 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Admin</div>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav className="space-y-2">
              {NAV.map((n) => {
                const active = pathname === n.href
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn('relative block px-3 py-2 rounded-md transition transform hover:scale-[0.99]', active ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/10')}
                    onClick={() => setOpen(false)}
                  >
                    <span className="inline-flex items-center gap-2">
                  <n.icon size={16} />
                  <span>{t(locale, n.key)}</span>
                </span>
                {active ? <span className={cn('absolute top-1/2 -translate-y-1/2 h-5 w-1 bg-white/70 rounded', rtl ? 'right-0' : 'left-0')} /> : null}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-6 grid gap-2">
              <button className="text-left text-sm opacity-80 hover:opacity-100" onClick={toggleDark}>{dark ? 'Light' : 'Dark'} mode</button>
              <button className="text-left text-sm opacity-80 hover:opacity-100" onClick={toggleRtl}>{rtl ? 'LTR' : 'RTL'}</button>
              <div className="flex gap-2 mt-2">
                <button className={cn('text-xs px-2 py-1 rounded', locale==='ar'?'bg-white/20':'hover:bg-white/10')} onClick={() => setLocale('ar')}>العربية</button>
                <button className={cn('text-xs px-2 py-1 rounded', locale==='en'?'bg-white/20':'hover:bg-white/10')} onClick={() => setLocale('en')}>English</button>
                <button className={cn('text-xs px-2 py-1 rounded', locale==='ku'?'bg-white/20':'hover:bg-white/10')} onClick={() => setLocale('ku')}>کوردی</button>
              </div>
              <button
                className="mt-2 text-left text-sm opacity-80 hover:opacity-100"
                onClick={async () => {
                  try { await supabase.auth.signOut(); } finally {
                    try { document.cookie = 'sb-access-token=; Max-Age=0; Path=/'; document.cookie = 'sb-refresh-token=; Max-Age=0; Path=/'; } catch {}
                    window.location.href = '/auth/login';
                  }
                }}
              >Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




