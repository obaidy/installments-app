"use client";
import { useState } from 'react'
import { Shell } from '@/components/Shell'
import { Toolbar } from '@/components/Toolbar'
import { DataTable, type Column } from '@/components/DataTable'
import { Modal } from '@/components/ui/modal'

type Complex = { id: number; name: string; code: string; units: number };
const MOCK: Complex[] = [
  { id: 1, name: 'Al Noor', code: 'al-noor', units: 120 },
  { id: 2, name: 'Rose Gardens', code: 'rose-gardens', units: 80 },
  { id: 3, name: 'Palm Grove', code: 'palm-grove', units: 64 },
];

export default function ComplexesPage() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState(MOCK)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [tempName, setTempName] = useState('')
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const columns: Column<Complex>[] = [
    { key: 'name', label: 'Name', render: (r) => (
      editingId === r.id ? (
        <span className="inline-flex items-center gap-2">
          <span>🏢</span>
          <input autoFocus className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={tempName} onChange={(e) => setTempName(e.target.value)} />
          <button className="px-2 py-1 text-sm rounded-md border border-border" onClick={() => {
            if (!tempName.trim()) return;
            setRows(rs => rs.map(x => x.id === r.id ? { ...x, name: tempName.trim() } : x));
            setEditingId(null);
          }}>Save</button>
          <button className="px-2 py-1 text-sm rounded-md border border-border" onClick={() => setEditingId(null)}>Cancel</button>
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <span>🏢</span>
          <span>{r.name}</span>
          <button className="px-2 py-0.5 text-xs rounded-md border border-border" onClick={() => { setEditingId(r.id); setTempName(r.name); }}>Edit</button>
        </span>
      )
    ) },
    { key: 'code', label: 'Code', render: (r) => <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs bg-muted/30">{r.code}</span> },
    { key: 'units', label: 'Units', width: '120px', render: (r) => <span className="opacity-80">{r.units} units</span> },
    {
      key: 'id',
      label: 'Actions',
      width: '200px',
      render: (r) => (
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => { setName(r.name); setCode(r.code); setOpen(true); }}>Edit</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => setConfirmId(r.id)}>Delete</button>
        </div>
      )
    },
  ]

  function onSearch() {
    const q = query.toLowerCase().trim()
    if (!q) { setRows(MOCK); return }
    setRows(MOCK.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)))
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-2">Complexes</h1>
      <Toolbar
        query={query}
        setQuery={setQuery}
        onSearch={onSearch}
        right={<button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={() => { setName(''); setCode(''); setOpen(true) }}>Add Complex</button>}
      />
      <DataTable columns={columns} rows={rows} />

      <Modal open={open} onClose={() => setOpen(false)} title="Complex">
        <div className="grid gap-2">
          <label className="text-sm">Name</label>
          <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="text-sm">Code</label>
          <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end">
          <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={() => setOpen(false)}>Save</button>
        </div>
      </Modal>

      <Modal open={confirmId !== null} onClose={() => setConfirmId(null)} title="Confirm Delete">
        <div>Are you sure you want to delete this complex?</div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => setConfirmId(null)}>Cancel</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => { setRows(rs => rs.filter(x => x.id !== confirmId)); setConfirmId(null); }}>Delete</button>
        </div>
      </Modal>
    </Shell>
  )
}
