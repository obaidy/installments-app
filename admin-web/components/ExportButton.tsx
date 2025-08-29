"use client";
import React from 'react';
import { useTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

type Col<T> = { key: keyof T; label: string };

export function ExportButton<T extends Record<string, any>>({ filename, columns, rows, label }: { filename: string; columns: Col<T>[]; rows: T[]; label?: string }) {
  const { locale } = useTheme();
  function toCsv() {
    const head = columns.map((c) => escapeCsv(String(c.label))).join(',');
    const body = rows
      .map((r) => columns.map((c) => escapeCsv(valueFor(r[c.key]))).join(','))
      .join('\n');
    return head + '\n' + body;
  }
  function download() {
    const csv = toCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button className="rounded-md border border-border px-3 py-2 text-sm" onClick={download} title={t(locale,'exportCsv')}>
      {label || t(locale, 'exportCsv')}
    </button>
  );
}

function valueFor(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function escapeCsv(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
