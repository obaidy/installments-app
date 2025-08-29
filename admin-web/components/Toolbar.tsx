"use client";
import React from 'react';
import { useTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

export function Toolbar({
  query,
  setQuery,
  onSearch,
  right,
  placeholder,
}: {
  query: string;
  setQuery: (s: string) => void;
  onSearch: () => void;
  right?: React.ReactNode;
  placeholder?: string;
}) {
  const { locale } = useTheme();
  return (
    <div className="flex items-center gap-2 mb-4">
      <input
        className="w-full md:w-auto flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder={placeholder || t(locale, 'searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={onSearch}>Search</button>
      {right}
    </div>
  );
}
