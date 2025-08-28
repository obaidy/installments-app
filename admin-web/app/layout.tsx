import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '../lib/theme'
import { Inter } from 'next/font/google'
import { RequireRole } from '../components/RequireRole'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'Installments Admin',
  description: 'Admin dashboard for payments and installments',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeProvider>
          <RequireRole allowed={[ 'admin' ]}>{children}</RequireRole>
        </ThemeProvider>
      </body>
    </html>
  )
}
