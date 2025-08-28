"use client";
import { useState } from 'react'
import { Shell } from '@/components/Shell'
import { Toolbar } from '@/components/Toolbar'
import { DataTable, type Column } from '@/components/DataTable'

type User = { id: string; email: string; role: 'admin' | 'manager' | 'client'; status: 'active' | 'disabled' };
const MOCK: User[] = [
  { id: 'u_1', email: 'admin@example.com', role: 'admin', status: 'active' },
  { id: 'u_2', email: 'manager@example.com', role: 'manager', status: 'active' },
  { id: 'u_3', email: 'client@example.com', role: 'client', status: 'active' },
]

export default function UsersPage() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState(MOCK)

  const columns: Column<User>[] = [
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', width: '140px', render: (r) => <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs bg-muted/30">{r.role.toUpperCase()}</span> },
    { key: 'status', label: 'Status', width: '140px', render: (r) => <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs " style={{ backgroundColor: r.status==='active' ? '#DCFCE7' : '#FEE2E2', borderColor: r.status==='active' ? '#86EFAC' : '#FCA5A5', color: r.status==='active' ? '#166534' : '#991B1B' }}>{r.status.toUpperCase()}</span> },
    {
      key: 'id',
      label: 'Actions',
      width: '220px',
      render: (r) => (
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => setRows(rs => rs.map(x => x.id===r.id ? { ...x, role: nextRole(x.role) } : x))}>Change Role</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => setRows(rs => rs.map(x => x.id===r.id ? { ...x, status: x.status==='active'?'disabled':'active' } : x))}>{r.status === 'active' ? 'Disable' : 'Enable'}</button>
        </div>
      )
    },
  ]

  function onSearch() {
    const q = query.toLowerCase().trim()
    if (!q) { setRows(MOCK); return }
    setRows(MOCK.filter(r => r.email.toLowerCase().includes(q) || r.role.toLowerCase().includes(q)))
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-2">Users</h1>
      <Toolbar query={query} setQuery={setQuery} onSearch={onSearch} />
      <DataTable columns={columns} rows={rows} />
    </Shell>
  )
}

function nextRole(role: User['role']): User['role'] {
  if (role === 'admin') return 'manager'
  if (role === 'manager') return 'client'
  return 'admin'
}
