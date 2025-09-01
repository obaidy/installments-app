"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { supabase } from '@/lib/supabaseClient';

type Unit = {
  id: number;
  name?: string | null;
  unit_number?: string | null;
  service_fee?: number | null;
  complex_id?: number | null;
  user_id?: string | null;
  complex?: { name?: string | null } | null;
};

type Profile = { email?: string | null; full_name?: string | null };

export default function UnitDetail({ params }: { params: { id: string } }) {
  const unitId = Number(params.id);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: u } = await supabase
        .from('units')
        .select('id, name, unit_number, service_fee, complex_id, user_id, complexes(name)')
        .eq('id', unitId)
        .maybeSingle();
      setUnit(u as any);
      if ((u as any)?.user_id) {
        const { data: p } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', (u as any).user_id)
          .maybeSingle();
        setOwner(p as any);
      } else {
        setOwner(null);
      }
      setLoading(false);
    })();
  }, [unitId]);

  return (
    <Shell>
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Unit Details</h1>
          <Link href="/units" className="text-sm underline">Back to Units</Link>
        </div>
        {unit ? (
          <div className="grid gap-2">
            <div className="text-sm opacity-80">ID: {unit.id}</div>
            <div className="text-sm">Name: {unit.name || '-'}</div>
            <div className="text-sm">Number: {unit.unit_number || '-'}</div>
            <div className="text-sm">Complex: {unit.complexes?.name || '-'}</div>
            <div className="text-sm">Service Fee: {unit.service_fee ?? '-'}</div>
            <div className="text-sm">Owner: {owner?.full_name || owner?.email || unit.user_id || '-'}</div>
          </div>
        ) : (!loading ? <div className="text-sm opacity-70">Unit not found</div> : null)}
      </main>
    </Shell>
  );
}

