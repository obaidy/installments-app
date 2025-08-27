"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeCtx = {
  dark: boolean;
  rtl: boolean;
  toggleDark(): void;
  toggleRtl(): void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  }, [dark, rtl]);

  return (
    <Ctx.Provider value={{ dark, rtl, toggleDark: () => setDark(d => !d), toggleRtl: () => setRtl(r => !r) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used within ThemeProvider');
  return v;
}

