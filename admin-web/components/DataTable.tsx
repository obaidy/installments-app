"use client";
import React, { useMemo, useState } from 'react';

export type Column<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
};

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  selectable,
  selected,
  onToggleRow,
  onToggleAll,
}: {
  columns: Column<T>[];
  rows: T[];
  selectable?: boolean;
  selected?: Record<string | number, boolean>;
  onToggleRow?: (row: T) => void;
  onToggleAll?: (checked: boolean) => void;
}) {
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortBy) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortBy] as any;
      const bv = b[sortBy] as any;
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortBy, dir]);

  function click(col: keyof T) {
    if (sortBy === col) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setDir('asc');
    }
  }

  const Arrow = ({ active }: { active: boolean }) => (
    <span className="ml-1 text-xs opacity-70">{active ? (dir === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  const allSelected = selectable && selected && rows.length > 0 && rows.every((r) => selected[String(r.id)]);
  const someSelected = selectable && selected && rows.some((r) => selected[String(r.id)]) && !allSelected;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 sticky top-0 z-10 backdrop-blur">
          <tr>
            {selectable ? (
              <th className="p-3 w-[42px]">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={!!allSelected}
                  onChange={(e) => onToggleAll?.(e.target.checked)}
                />
              </th>
            ) : null}
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className="text-left p-3 cursor-pointer select-none"
                style={{ width: c.width }}
                onClick={() => click(c.key)}
              >
                {c.label}
                <Arrow active={sortBy === c.key} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card">
          {sorted.map((r, i) => (
            <tr
              key={String(r.id)}
              className={
                'border-t border-border transition-colors ' +
                (i % 2 === 1 ? 'bg-muted/10 ' : '') +
                (selectable && selected && selected[String(r.id)] ? ' bg-primary/5 ' : '') +
                'hover:bg-muted/20'
              }
            >
              {selectable ? (
                <td className="p-3 w-[42px]">
                  <input
                    type="checkbox"
                    aria-label={`Select row ${String(r.id)}`}
                    checked={!!selected?.[String(r.id)]}
                    onChange={() => onToggleRow?.(r)}
                  />
                </td>
              ) : null}
              {columns.map((c) => (
                <td key={String(c.key)} className="p-3">
                  {c.render ? c.render(r) : (r[c.key] as any)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
