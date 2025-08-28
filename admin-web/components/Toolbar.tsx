"use client";
import React from 'react';

export function Toolbar({
  query,
  setQuery,
  onSearch,
  right,
}: {
  query: string;
  setQuery: (s: string) => void;
  onSearch: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <input
        className="w-full md:w-auto flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={onSearch}>Search</button>
      {right}
    </div>
  );
}
