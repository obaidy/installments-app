"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { supabase } from '@/lib/supabaseClient';

type Complex = { id: number; name: string; code?: string | null };
type Unit = { id: number; name?: string | null; unit_number?: string | null };

export default function ComplexDetail({ params }: { params: { id: string } }) {
  const complexId = Number(params.id);
  const [complex, setComplex] = useState<Complex | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: c }, { data: u }] = await Promise.all([
        supabase.from('complexes').select('id, name, code').eq('id', complexId).maybeSingle(),
        supabase.from('units').select('id, name, unit_number').eq('complex_id', complexId).order('name'),
      ]);
      setComplex(c as Complex | null);
      setUnits(((u as any[]) || []) as Unit[]);
      setLoading(false);
    })();
  }, [complexId]);

  return (
    <Shell>
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{complex ? complex.name : 'Complex'}</h1>
          <Link href="/complexes" className="text-sm underline">Back to Complexes</Link>
        </div>
        {complex?.code ? <div className="text-sm opacity-80">Code: {complex.code}</div> : null}
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Units</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-2 text-left">Unit</th>
                  <th className="p-2 text-left">Number</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-2">{u.name || '-'}</td>
                    <td className="p-2">{u.unit_number || '-'}</td>
                    <td className="p-2">
                      <Link href={`/units/${u.id}`} className="px-3 py-1.5 rounded-md border border-border inline-block">View</Link>
                    </td>
                  </tr>
                ))}
                {(!loading && units.length === 0) ? (
                  <tr><td className="p-3 text-sm opacity-70" colSpan={3}>No units</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </Shell>
  );
}

