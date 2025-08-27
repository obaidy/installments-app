import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: [ 'class' ],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme driven by CSS vars; fallback values provided
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        cardForeground: 'hsl(var(--card-foreground))',
        primary: 'hsl(var(--primary))',
        primaryForeground: 'hsl(var(--primary-foreground))',
        muted: 'hsl(var(--muted))',
        mutedForeground: 'hsl(var(--muted-foreground))',
        ring: 'hsl(var(--ring))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        accent: 'hsl(var(--accent))',
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}

export default config

