"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeCtx = {
  dark: boolean;
  rtl: boolean;
  locale: 'ar' | 'en' | 'ku';
  toggleDark(): void;
  toggleRtl(): void;
  setLocale(l: 'ar' | 'en' | 'ku'): void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(true);
  const [locale, setLocale] = useState<'ar' | 'en' | 'ku'>('ar');


  // Load saved preferences once on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('app.locale') as 'ar'|'en'|'ku' | null;
      const savedDark = localStorage.getItem('app.dark');
      if (savedLocale) setLocale(savedLocale);
      if (savedDark != null) setDark(savedDark == '1');
    } catch {}
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    try { localStorage.setItem('app.dark', dark ? '1' : '0'); } catch {}
  }, [dark, rtl]);

  useEffect(() => {
    // rtl for Arabic and Kurdish by default
    setRtl(locale !== 'en');
    try { localStorage.setItem('app.locale', locale); } catch {}
  }, [locale]);

  return (
    <Ctx.Provider value={{ dark, rtl, locale, toggleDark: () => setDark(d => !d), toggleRtl: () => setRtl(r => !r), setLocale }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used within ThemeProvider');
  return v;
}
