"use client";
import React from 'react';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-card">
        {title ? <div className="text-lg font-semibold mb-2">{title}</div> : null}
        <div className="space-y-3">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
