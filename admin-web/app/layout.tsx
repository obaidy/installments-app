import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Installments Admin',
  description: 'Admin dashboard for payments and installments',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

