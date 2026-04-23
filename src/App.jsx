import { useState, useMemo, lazy, Suspense } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'

/* ─── Design tokens (Light Mode) ────────────────────────────────── */
const T = {
  white:       '#FFFFFF',
  bg:          '#F8FAFC',
  sidebar:     '#F1F5F9',
  border:      '#E2E8F0',
  borderLight: '#F1F5F9',
  text:        '#0F172A',
  textMid:     '#475569',
  textMuted:   '#94A3B8',
  blue:        '#2563EB',
  blueDim:     '#DBEAFE',
  blueDeep:    '#1D4ED8',
  emerald:     '#059669',
  emeraldDim:  '#D1FAE5',
  amber:       '#D97706',
  amberDim:    '#FEF3C7',
  rose:        '#E11D48',
  roseDim:     '#FFE4E6',
  slate:       '#64748B',
}

const F = {
  head: "'DM Serif Display', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'DM Mono', 'Courier New', monospace",
}

/* ─── Helpers ────────────────────────────────────────────────────── */
let entryCounter = 1

function generateId() {
  const id = `JE-2026-${String(entryCounter).padStart(4, '0')}`
  entryCounter++
  return id
}

function calcVAT(grossAmount, taxCategory, type) {
  const gross = parseFloat(grossAmount) || 0
  if (taxCategory === '12% VAT') {
    const net = gross / 1.12
    const vat = gross / 1.12 * 0.12
    return {
      gross: parseFloat(gross.toFixed(2)),
      net:   parseFloat(net.toFixed(2)),
      vat:   parseFloat(vat.toFixed(2)),
      outputVAT: type === 'income' ? parseFloat(vat.toFixed(2)) : 0,
      inputVAT:  type === 'expense' ? parseFloat(vat.toFixed(2)) : 0,
    }
  }
  return {
    gross: parseFloat(gross.toFixed(2)),
    net:   parseFloat(gross.toFixed(2)),
    vat:   0,
    outputVAT: 0,
    inputVAT:  0,
  }
}

function fmt(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ─── Seed data ──────────────────────────────────────────────────── */
const SEED = [
  { id: 'JE-2026-0001', type: 'income',  taxCategory: '12% VAT', description: 'IT Consultancy Fee', gross: 112000, net: 100000, vat: 12000, outputVAT: 12000, inputVAT: 0, timestamp: '2026-04-01T09:15:00Z', user: 'R. Santos' },
  { id: 'JE-2026-0002', type: 'expense', taxCategory: '12% VAT', description: 'Office Supplies',    gross:  11200, net:  10000, vat:  1200, outputVAT: 0,     inputVAT: 1200, timestamp: '2026-04-05T10:30:00Z', user: 'M. Reyes' },
  { id: 'JE-2026-0003', type: 'income',  taxCategory: '0% VAT',  description: 'Export Services',    gross:  80000, net:  80000, vat:     0, outputVAT: 0,     inputVAT: 0, timestamp: '2026-04-10T14:00:00Z', user: 'R. Santos' },
  { id: 'JE-2026-0004', type: 'expense', taxCategory: '12% VAT', description: 'Rent Expense',       gross:  56000, net:  50000, vat:  6000, outputVAT: 0,     inputVAT: 6000, timestamp: '2026-04-15T08:45:00Z', user: 'C. Lim' },
  { id: 'JE-2026-0005', type: 'income',  taxCategory: '12% VAT', description: 'Software License',   gross:  44800, net:  40000, vat:  4800, outputVAT: 4800,  inputVAT: 0, timestamp: '2026-04-18T11:20:00Z', user: 'R. Santos' },
]
entryCounter = 6

/* ─── Shared UI ──────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: F.mono,
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: T.textMuted,
      marginBottom: 8,
    }}>
      {children}
    </p>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: F.head,
      fontSize: '1.05rem',
      fontWeight: 400,
      color: T.text,
      marginBottom: '1rem',
    }}>
      {children}
    </h2>
  )
}

function Badge({ children, color, bg }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 99,
      fontSize: 11,
      fontFamily: F.mono,
      fontWeight: 500,
      background: bg,
      color,
    }}>
      {children}
    </span>
  )
}

/* ─── Summary Cards ──────────────────────────────────────────────── */
function SummaryStrip({ totals }) {
  const cards = [
    { label: 'Total Sales (Net)',  value: fmt(totals.totalNet),    color: T.blue,    bg: T.blueDim  },
    { label: 'Total Output VAT',   value: fmt(totals.outputVAT),   color: T.blue,    bg: T.blueDim  },
    { label: 'Total Input VAT',    value: fmt(totals.inputVAT),    color: T.emerald, bg: T.emeraldDim },
    { label: 'Net VAT Payable',    value: fmt(totals.netVAT),      color: totals.netVAT >= 0 ? T.rose : T.emerald, bg: totals.netVAT >= 0 ? T.roseDim : T.emeraldDim },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      {cards.map(c => (
        <Card key={c.label} style={{ padding: '1rem 1.2rem', borderTop: `3px solid ${c.color}` }}>
          <SectionLabel>{c.label}</SectionLabel>
          <p style={{ fontFamily: F.mono, fontSize: '1.3rem', fontWeight: 500, color: T.text, lineHeight: 1 }}>
            {c.value}
          </p>
        </Card>
      ))}
    </div>
  )
}

/* ─── New Entry Form ─────────────────────────────────────────────── */
function EntryForm({ onAdd }) {
  const [type,        setType]        = useState('income')
  const [taxCategory, setTaxCategory] = useState('12% VAT')
  const [amount,      setAmount]      = useState('')
  const [description, setDescription] = useState('')
  const [preview,     setPreview]     = useState(null)
  const [error,       setError]       = useState('')

  function handleAmountChange(val) {
    setAmount(val)
    if (parseFloat(val) > 0) {
      setPreview(calcVAT(val, taxCategory, type))
    } else {
      setPreview(null)
    }
  }

  function handleTaxChange(val) {
    setTaxCategory(val)
    if (parseFloat(amount) > 0) {
      setPreview(calcVAT(amount, val, type))
    }
  }

  function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return }
    if (!description.trim()) { setError('Please enter a description.'); return }
    setError('')
    const calc = calcVAT(amount, taxCategory, type)
    onAdd({
      id: generateId(),
      type,
      taxCategory,
      description: description.trim(),
      timestamp: new Date().toISOString(),
      user: 'R. Santos',
      ...calc,
    })
    setAmount('')
    setDescription('')
    setPreview(null)
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    fontFamily: F.body,
    fontSize: 13,
    color: T.text,
    background: T.white,
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: T.textMid,
    marginBottom: 5,
    fontFamily: F.body,
  }

  return (
    <Card>
      <SectionTitle>New journal entry</SectionTitle>

      {/* Type toggle */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Transaction type</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['income', 'Income / Sale'], ['expense', 'Expense / Purchase']].map(([val, label]) => (
            <button key={val} onClick={() => setType(val)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
              fontFamily: F.body, fontSize: 13, fontWeight: 500, border: 'none',
              background: type === val ? (val === 'income' ? T.blue : T.rose) : T.sidebar,
              color: type === val ? T.white : T.textMid,
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tax category */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Tax category</label>
        <select value={taxCategory} onChange={e => handleTaxChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option>12% VAT</option>
          <option>0% VAT</option>
          <option>VAT Exempt</option>
        </select>
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Gross amount (PHP)</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={e => handleAmountChange(e.target.value)}
          style={{ ...inputStyle, fontFamily: F.mono }}
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description / particulars</label>
        <input
          type="text"
          placeholder="e.g. Service Fee, Office Supplies"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* VAT Preview */}
      {preview && taxCategory === '12% VAT' && (
        <div style={{
          background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 14,
        }}>
          <SectionLabel>VAT breakdown preview</SectionLabel>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              ['Gross', fmt(preview.gross)],
              ['Net',   fmt(preview.net)],
              [type === 'income' ? 'Output VAT' : 'Input VAT', fmt(preview.vat)],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 10, color: T.textMuted, fontFamily: F.mono }}>{k}</p>
                <p style={{ fontSize: 13, fontFamily: F.mono, color: T.text, fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: T.rose, marginBottom: 10, fontFamily: F.body }}>{error}</p>}

      <button onClick={handleSubmit} style={{
        width: '100%', padding: '10px', borderRadius: 8,
        background: T.blue, color: T.white, border: 'none',
        fontFamily: F.body, fontSize: 14, fontWeight: 500,
        cursor: 'pointer', letterSpacing: '0.01em',
        transition: 'background 0.15s',
      }}>
        Post Entry
      </button>
    </Card>
  )
}

/* ─── VAT Chart ──────────────────────────────────────────────────── */
function VATChart({ transactions }) {
  const monthlyData = useMemo(() => {
    const map = {}
    transactions.forEach(tx => {
      const m = new Date(tx.timestamp).toLocaleString('en-PH', { month: 'short' })
      if (!map[m]) map[m] = { month: m, output: 0, input: 0 }
      map[m].output += tx.outputVAT
      map[m].input  += tx.inputVAT
    })
    return Object.values(map)
  }, [transactions])

  return (
    <Card>
      <SectionTitle>VAT trend — Output vs Input</SectionTitle>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.blue}    stopOpacity={0.15} />
              <stop offset="95%" stopColor={T.blue}    stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.emerald} stopOpacity={0.15} />
              <stop offset="95%" stopColor={T.emerald} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
          <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11, fontFamily: F.mono }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 10, fontFamily: F.mono }} axisLine={false} tickLine={false}
            tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: F.mono, fontSize: 12 }}
            formatter={(v, n) => [fmt(v), n === 'output' ? 'Output VAT' : 'Input VAT']}
          />
          <Area type="monotone" dataKey="output" stroke={T.blue}    strokeWidth={2} fill="url(#gOut)" dot={false} />
          <Area type="monotone" dataKey="input"  stroke={T.emerald} strokeWidth={2} fill="url(#gIn)"  dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        {[['Output VAT', T.blue], ['Input VAT', T.emerald]].map(([label, color]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted, fontFamily: F.mono }}>
            <span style={{ width: 18, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
            {label}
          </span>
        ))}
      </div>
    </Card>
  )
}

/* ─── Ledger Table ───────────────────────────────────────────────── */
function LedgerTable({ transactions }) {
  const sorted = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return (
    <Card style={{ gridColumn: '1 / -1' }}>
      <SectionTitle>General ledger — all entries</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.mono, fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Entry ID', 'Timestamp', 'Type', 'Description', 'Tax Category', 'Gross', 'Net Amount', 'VAT', 'Preparer'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '9px 12px',
                  color: T.textMuted, fontWeight: 500, fontSize: 10,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  borderBottom: `1px solid ${T.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: T.textMuted, fontFamily: F.body }}>
                  No entries yet. Post your first journal entry above.
                </td>
              </tr>
            )}
            {sorted.map((e, i) => (
              <tr key={e.id} style={{
                background: i % 2 === 0 ? T.white : T.bg,
                transition: 'background 0.1s',
              }}>
                <td style={{ padding: '10px 12px', color: T.blue, whiteSpace: 'nowrap' }}>{e.id}</td>
                <td style={{ padding: '10px 12px', color: T.textMuted, whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(e.timestamp)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <Badge
                    color={e.type === 'income' ? T.blueDeep : T.rose}
                    bg={e.type === 'income' ? T.blueDim : T.roseDim}
                  >
                    {e.type === 'income' ? 'Sale' : 'Expense'}
                  </Badge>
                </td>
                <td style={{ padding: '10px 12px', color: T.text }}>{e.description}</td>
                <td style={{ padding: '10px 12px' }}>
                  <Badge
                    color={e.taxCategory === '12% VAT' ? T.amber : T.slate}
                    bg={e.taxCategory === '12% VAT' ? T.amberDim : T.borderLight}
                  >
                    {e.taxCategory}
                  </Badge>
                </td>
                <td style={{ padding: '10px 12px', color: T.text, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(e.gross)}</td>
                <td style={{ padding: '10px 12px', color: T.emerald, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(e.net)}</td>
                <td style={{ padding: '10px 12px', color: T.amber, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(e.vat)}</td>
                <td style={{ padding: '10px 12px', color: T.textMuted }}>{e.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ─── Deadline Tracker ───────────────────────────────────────────── */
const DEADLINES = [
  { date: 'Apr 25', form: '1601-EQ', desc: 'Q1 Expanded Withholding Tax', urgent: true },
  { date: 'Apr 30', form: '2550-M',  desc: 'March Monthly VAT Return', urgent: true },
  { date: 'May 10', form: '1601-C',  desc: 'April Withholding on Compensation', urgent: false },
  { date: 'May 15', form: '0619-E',  desc: 'Monthly EWT Remittance', urgent: false },
  { date: 'May 30', form: '2550-M',  desc: 'April Monthly VAT Return', urgent: false },
]

function DeadlineTracker() {
  return (
    <Card>
      <SectionTitle>Upcoming BIR deadlines</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DEADLINES.map(d => (
          <div key={d.form + d.date} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 8,
            background: d.urgent ? T.roseDim : T.bg,
            border: `1px solid ${d.urgent ? '#FECDD3' : T.border}`,
          }}>
            <div style={{ textAlign: 'center', minWidth: 44 }}>
              <p style={{ fontSize: 9, color: T.textMuted, fontFamily: F.mono, textTransform: 'uppercase' }}>Due</p>
              <p style={{ fontSize: 13, fontWeight: 500, fontFamily: F.mono, color: d.urgent ? T.rose : T.blue }}>
                {d.date}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <Badge color={d.urgent ? T.rose : T.blueDeep} bg={d.urgent ? '#FECDD3' : T.blueDim}>{d.form}</Badge>
              <p style={{ fontSize: 12, color: T.textMid, marginTop: 3, fontFamily: F.body }}>{d.desc}</p>
            </div>
            {d.urgent && (
              <span style={{ fontSize: 10, color: T.rose, fontFamily: F.mono, fontWeight: 500, whiteSpace: 'nowrap' }}>URGENT</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ─── Sidebar ────────────────────────────────────────────────────── */
const NAV = ['Dashboard', 'Journal Entries', 'EIS Invoices', 'VAT Returns', 'Payroll', 'Audit Log']

function Sidebar({ active, onSelect }) {
  return (
    <aside style={{
      width: 224,
      background: T.sidebar,
      borderRight: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      flexShrink: 0,
    }}>
      {/* Branding */}
      <div style={{ padding: '0 1.25rem 1.25rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10,
          background: T.blue, marginBottom: 10,
        }}>
          <span style={{ color: T.white, fontFamily: F.mono, fontSize: 16, fontWeight: 500 }}>₱</span>
        </div>
        <p style={{ fontFamily: F.head, fontSize: '0.95rem', color: T.text, lineHeight: 1.3 }}>
          SME Tax &<br />Payroll Hub
        </p>
        <p style={{ fontFamily: F.mono, fontSize: 10, color: T.blue, marginTop: 3, fontWeight: 500 }}>2026 — Phase 2</p>
      </div>

      <div style={{ height: 1, background: T.border, margin: '0 1.25rem 1rem' }} />

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0.75rem' }}>
        {NAV.map(item => (
          <button key={item} onClick={() => onSelect(item)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '8px 12px', borderRadius: 8,
            fontSize: 13, fontFamily: F.body,
            color: active === item ? T.blue : T.textMid,
            background: active === item ? T.blueDim : 'transparent',
            fontWeight: active === item ? 500 : 400,
            transition: 'all 0.12s',
          }}>
            {item}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        <div style={{ height: 1, background: T.border, marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: T.blueDim, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: F.mono, fontSize: 11, color: T.blue, fontWeight: 500,
          }}>RS</div>
          <div>
            <p style={{ fontSize: 13, color: T.text, fontFamily: F.body, fontWeight: 500 }}>R. Santos</p>
            <p style={{ fontSize: 10, color: T.textMuted, fontFamily: F.mono }}>Fund Accountant</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ─── Header ─────────────────────────────────────────────────────── */
function Header() {
  const now = new Date()
  const formatted = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 2rem',
      borderBottom: `1px solid ${T.border}`,
      background: T.white,
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{
          fontFamily: F.head, fontSize: '1.5rem', fontWeight: 400,
          color: T.text, lineHeight: 1,
        }}>
          SME Tax &amp; Payroll Hub{' '}
          <span style={{ color: T.blue }}>2026</span>
        </h1>
        <p style={{ fontFamily: F.mono, fontSize: 11, color: T.textMuted, marginTop: 3 }}>
          {formatted} &nbsp;&middot;&nbsp; Fiscal Year 2026 &nbsp;&middot;&nbsp; RDO 040 &mdash; Cubao
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Badge color={T.emerald} bg={T.emeraldDim}>EIS Connected</Badge>
        <Badge color={T.amber}   bg={T.amberDim}>BIR eFPS Active</Badge>
      </div>
    </header>
  )
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
function Dashboard({ transactions, onAdd }) {
  const totals = useMemo(() => {
    const outputVAT  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.outputVAT, 0)
    const inputVAT   = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.inputVAT, 0)
    const totalNet   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.net, 0)
    const netVAT     = outputVAT - inputVAT
    return { outputVAT, inputVAT, netVAT, totalNet }
  }, [transactions])

  return (
    <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: T.bg }}>
      <SummaryStrip totals={totals} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <VATChart transactions={transactions} />
          <LedgerTable transactions={transactions} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <EntryForm onAdd={onAdd} />
          <DeadlineTracker />
        </div>
      </div>
    </main>
  )
}

/* ─── Root App ───────────────────────────────────────────────────── */
export default function App() {
  const [activeNav, setActiveNav]     = useState('Dashboard')
  const [transactions, setTransactions] = useState(SEED)

  function handleAdd(entry) {
    setTransactions(prev => [...prev, entry])
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.bg, fontFamily: F.body }}>
      <Sidebar active={activeNav} onSelect={setActiveNav} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        {activeNav === 'Dashboard'
          ? <Dashboard transactions={transactions} onAdd={handleAdd} />
          : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 10,
              background: T.bg,
            }}>
              <p style={{ fontFamily: F.head, fontSize: '1.5rem', color: T.textMuted }}>{activeNav}</p>
              <p style={{ fontFamily: F.mono, fontSize: 12, color: T.textMuted }}>
                module not yet scaffolded &mdash; coming in Phase 3
              </p>
            </div>
          )
        }
      </div>
    </div>
  )
}
