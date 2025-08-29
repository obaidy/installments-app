"use client";
import React from 'react';

export function BarChart({ values, labels, height = 80 }: { values: number[]; labels?: string[]; height?: number }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {values.map((v, i) => {
        const h = Math.round((v / max) * (height - 20));
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-8 bg-primary/60 rounded-sm" style={{ height: h }} title={`${labels?.[i] ?? ''} ${v}`} />
            {labels ? <div className="text-[10px] opacity-70 whitespace-nowrap">{labels[i]}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

