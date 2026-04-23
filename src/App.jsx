import { useState, lazy, Suspense } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'

/* ─── Design tokens ─────────────────────────────────────────────── */
const T = {
  navy:      '#0f1a2e',
  navyMid:   '#162236',
  navyLight: '#1e3356',
  sky:       '#38bdf8',
  skyDim:    '#0ea5e9',
  gold:      '#f59e0b',
  emerald:   '#10b981',
  rose:      '#f43f5e',
  textBright:'#f0f6ff',
  textMuted: '#8ba3c7',
  border:    'rgba(56,189,248,0.12)',
}

const css = {
  fontHead: "'DM Serif Display', Georgia, serif",
  fontBody: "'DM Sans', system-ui, sans-serif",
  fontMono: "'DM Mono', 'Courier New', monospace",
}

/* ─── Mock data ──────────────────────────────────────────────────── */
const vatTrendData = [
  { month: 'Nov', output: 142000, input: 89000 },
  { month: 'Dec', output: 198000, input: 112000 },
  { month: 'Jan', output: 163000, input: 94000 },
  { month: 'Feb', output: 211000, input: 128000 },
  { month: 'Mar', output: 187000, input: 103000 },
  { month: 'Apr', output: 224000, input: 141000 },
]

const withholdingData = [
  { type: 'EWT 2%',  amount: 18400, color: T.sky },
  { type: 'EWT 5%',  amount: 31200, color: T.gold },
  { type: 'EWT 10%', amount: 12800, color: T.emerald },
  { type: 'EWT 15%', amount: 8600,  color: T.rose },
]

const deadlines = [
  { date: 'Apr 25', form: '1601-EQ', desc: 'Q1 Expanded Withholding Tax', urgent: true },
  { date: 'Apr 30', form: '2550-M',  desc: 'March Monthly VAT Return', urgent: true },
  { date: 'May 10', form: '1601-C',  desc: 'April Withholding on Compensation', urgent: false },
  { date: 'May 15', form: '0619-E',  desc: 'Monthly EWT Remittance', urgent: false },
  { date: 'May 30', form: '2550-M',  desc: 'April Monthly VAT Return', urgent: false },
]

const summaryCards = [
  { label: 'Output VAT (Apr)',   value: '₱224,000', delta: '+19.8%', up: true,  color: T.sky },
  { label: 'Input VAT Credits',  value: '₱141,000', delta: '+36.9%', up: true,  color: T.emerald },
  { label: 'Net VAT Payable',    value: '₱83,000',  delta: '-8.2%',  up: false, color: T.gold },
  { label: 'EWT Withheld (Apr)', value: '₱71,000',  delta: '+4.1%',  up: true,  color: T.rose },
]

const recentEntries = [
  { id: 'JE-2026-0441', date: 'Apr 22', acct: 'Output VAT',             debit: '',         credit: '₱24,000', user: 'R. Santos' },
  { id: 'JE-2026-0440', date: 'Apr 22', acct: 'Accounts Receivable',    debit: '₱224,000', credit: '',        user: 'R. Santos' },
  { id: 'JE-2026-0439', date: 'Apr 21', acct: 'EWT Payable — 2%',       debit: '',         credit: '₱3,200',  user: 'M. Reyes' },
  { id: 'JE-2026-0438', date: 'Apr 21', acct: 'Professional Fees Exp.', debit: '₱160,000', credit: '',        user: 'M. Reyes' },
  { id: 'JE-2026-0437', date: 'Apr 20', acct: 'Input VAT',              debit: '₱18,600',  credit: '',        user: 'C. Lim' },
]

/* ─── Shared sub-components ──────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.navyMid,
      border: `0.5px solid ${T.border}`,
      borderRadius: 12,
      padding: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: css.fontHead,
      fontSize: '1.05rem',
      fontWeight: 400,
      color: T.textBright,
      marginBottom: '1rem',
      letterSpacing: '0.01em',
    }}>
      {children}
    </h2>
  )
}

function Badge({ children, color }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 9px',
      borderRadius: 99,
      fontSize: 11,
      fontFamily: css.fontMono,
      fontWeight: 500,
      background: color + '22',
      color,
      border: `0.5px solid ${color}44`,
    }}>
      {children}
    </span>
  )
}

/* ─── Chart loading fallback ─────────────────────────────────────── */
function ChartLoader() {
  return (
    <Card>
      <div style={{
        height: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: T.textMuted,
        fontFamily: css.fontMono,
        fontSize: 12,
        gap: 8,
      }}>
        <span style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: T.sky,
          opacity: 0.5,
        }} />
        Loading chart…
      </div>
    </Card>
  )
}

/* ─── Chart inner components ─────────────────────────────────────── */
function VATChartInner() {
  return (
    <Card>
      <SectionTitle>VAT trend — Output vs Input (6-month)</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={vatTrendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gOutput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.sky}     stopOpacity={0.25} />
              <stop offset="95%" stopColor={T.sky}     stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gInput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.emerald} stopOpacity={0.20} />
              <stop offset="95%" stopColor={T.emerald} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11, fontFamily: css.fontMono }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 10, fontFamily: css.fontMono }} axisLine={false} tickLine={false}
            tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: T.navyLight, border: `0.5px solid ${T.border}`, borderRadius: 8, fontFamily: css.fontMono, fontSize: 12 }}
            labelStyle={{ color: T.textMuted }}
            formatter={(v, n) => [`₱${v.toLocaleString()}`, n === 'output' ? 'Output VAT' : 'Input VAT']}
          />
          <Area type="monotone" dataKey="output" stroke={T.sky}     strokeWidth={2} fill="url(#gOutput)" dot={false} />
          <Area type="monotone" dataKey="input"  stroke={T.emerald} strokeWidth={2} fill="url(#gInput)"  dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {[['Output VAT', T.sky], ['Input VAT', T.emerald]].map(([label, color]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted, fontFamily: css.fontMono }}>
            <span style={{ width: 20, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
            {label}
          </span>
        ))}
      </div>
    </Card>
  )
}

function EWTChartInner() {
  return (
    <Card>
      <SectionTitle>EWT breakdown (April)</SectionTitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={withholdingData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
          <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 10, fontFamily: css.fontMono }} axisLine={false} tickLine={false}
            tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="type" tick={{ fill: T.textMuted, fontSize: 11, fontFamily: css.fontMono }} axisLine={false} tickLine={false} width={56} />
          <Tooltip
            contentStyle={{ background: T.navyLight, border: `0.5px solid ${T.border}`, borderRadius: 8, fontFamily: css.fontMono, fontSize: 12 }}
            formatter={v => [`₱${v.toLocaleString()}`, 'Amount']}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {withholdingData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 11, color: T.textMuted, marginTop: 10, fontFamily: css.fontMono }}>
        Total EWT remitted: <span style={{ color: T.textBright }}>₱71,000</span>
      </p>
    </Card>
  )
}

/* ─── Lazy wrappers ──────────────────────────────────────────────── */
const VATChart = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve({ default: VATChartInner }), 0)
  )
)

const EWTChart = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve({ default: EWTChartInner }), 0)
  )
)

/* ─── Dashboard sections ─────────────────────────────────────────── */
function SummaryStrip() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      {summaryCards.map(c => (
        <Card key={c.label} style={{ padding: '1rem 1.2rem' }}>
          <p style={{ fontSize: 11, color: T.textMuted, fontFamily: css.fontMono, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {c.label}
          </p>
          <p style={{ fontFamily: css.fontMono, fontSize: '1.45rem', fontWeight: 500, color: c.color, lineHeight: 1 }}>
            {c.value}
          </p>
          <p style={{ fontSize: 12, color: c.up ? T.emerald : T.rose, marginTop: 6 }}>
            {c.delta} <span style={{ color: T.textMuted }}>vs last month</span>
          </p>
        </Card>
      ))}
    </div>
  )
}

function DeadlineTracker() {
  return (
    <Card>
      <SectionTitle>Upcoming BIR deadlines</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {deadlines.map(d => (
          <div key={d.form} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px',
            borderRadius: 8,
            background: d.urgent ? 'rgba(244,63,94,0.06)' : T.navyLight + '66',
            border: `0.5px solid ${d.urgent ? T.rose + '44' : T.border}`,
          }}>
            <div style={{ textAlign: 'center', minWidth: 44 }}>
              <p style={{ fontSize: 10, color: T.textMuted, fontFamily: css.fontMono }}>DUE</p>
              <p style={{ fontSize: 13, fontWeight: 500, fontFamily: css.fontMono, color: d.urgent ? T.rose : T.sky }}>
                {d.date}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <Badge color={d.urgent ? T.rose : T.sky}>{d.form}</Badge>
              <p style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{d.desc}</p>
            </div>
            {d.urgent && (
              <span style={{ fontSize: 10, color: T.rose, fontFamily: css.fontMono, fontWeight: 500 }}>URGENT</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function JournalTable() {
  return (
    <Card>
      <SectionTitle>Recent journal entries</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: css.fontMono, fontSize: 12 }}>
          <thead>
            <tr>
              {['Entry ID', 'Date', 'Account Title', 'Debit', 'Credit', 'Preparer'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 10px',
                  color: T.textMuted, fontWeight: 500, fontSize: 10,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  borderBottom: `0.5px solid ${T.border}`,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentEntries.map((e, i) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                <td style={{ padding: '9px 10px', color: T.sky }}>{e.id}</td>
                <td style={{ padding: '9px 10px', color: T.textMuted }}>{e.date}</td>
                <td style={{ padding: '9px 10px', color: T.textBright }}>{e.acct}</td>
                <td style={{ padding: '9px 10px', color: T.gold,    textAlign: 'right' }}>{e.debit}</td>
                <td style={{ padding: '9px 10px', color: T.emerald, textAlign: 'right' }}>{e.credit}</td>
                <td style={{ padding: '9px 10px', color: T.textMuted }}>{e.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ─── Nav ────────────────────────────────────────────────────────── */
const navItems = ['Dashboard', 'Journal Entries', 'EIS Invoices', 'VAT Returns', 'Payroll', 'Audit Log']

function Sidebar({ active, onSelect }) {
  return (
    <aside style={{
      width: 220,
      background: T.navyMid,
      borderRight: `0.5px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 1.25rem 1.5rem' }}>
        <p style={{ fontSize: 10, fontFamily: css.fontMono, color: T.sky, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          BIR-Compliant
        </p>
        <p style={{ fontFamily: css.fontHead, fontSize: '1rem', color: T.textBright, lineHeight: 1.3 }}>
          SME Tax &<br />Payroll Hub
        </p>
        <p style={{ fontFamily: css.fontMono, fontSize: 10, color: T.gold, marginTop: 4 }}>2026</p>
      </div>

      <div style={{ width: '80%', height: '0.5px', background: T.border, margin: '0 auto 1rem' }} />

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0.75rem' }}>
        {navItems.map(item => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 7,
              fontSize: 13,
              fontFamily: css.fontBody,
              color: active === item ? T.sky : T.textMuted,
              background: active === item ? T.sky + '15' : 'transparent',
              borderLeft: `2px solid ${active === item ? T.sky : 'transparent'}`,
              transition: 'all 0.15s',
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      <div style={{ padding: '0 1.25rem' }}>
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: T.navyLight,
          border: `0.5px solid ${T.border}`,
        }}>
          <p style={{ fontSize: 10, color: T.textMuted, fontFamily: css.fontMono }}>Logged in as</p>
          <p style={{ fontSize: 12, color: T.textBright, marginTop: 2 }}>R. Santos</p>
          <p style={{ fontSize: 10, color: T.textMuted, fontFamily: css.fontMono }}>Fund Accountant</p>
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.1rem 2rem',
      borderBottom: `0.5px solid ${T.border}`,
      background: T.navy,
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{
          fontFamily: css.fontHead,
          fontSize: '1.55rem',
          fontWeight: 400,
          color: T.textBright,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}>
          SME Tax &amp; Payroll Hub{' '}
          <span style={{ color: T.sky }}>2026</span>
        </h1>
        <p style={{ fontFamily: css.fontMono, fontSize: 11, color: T.textMuted, marginTop: 4 }}>
          {formatted} &nbsp;·&nbsp; Fiscal Year 2026 &nbsp;·&nbsp; RDO 040 — Cubao
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Badge color={T.emerald}>EIS Connected</Badge>
        <Badge color={T.gold}>BIR eFPS Active</Badge>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: T.sky + '22',
          border: `0.5px solid ${T.sky}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: css.fontMono, fontSize: 12, color: T.sky,
          cursor: 'pointer',
        }}>
          RS
        </div>
      </div>
    </header>
  )
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
function Dashboard() {
  return (
    <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <SummaryStrip />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
        <Suspense fallback={<ChartLoader />}>
          <VATChart />
        </Suspense>
        <Suspense fallback={<ChartLoader />}>
          <EWTChart />
        </Suspense>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
        <JournalTable />
        <DeadlineTracker />
      </div>
    </main>
  )
}

/* ─── Root App ───────────────────────────────────────────────────── */
export default function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.navy }}>
      <Sidebar active={activeNav} onSelect={setActiveNav} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        {activeNav === 'Dashboard'
          ? <Dashboard />
          : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: css.fontHead, fontSize: '1.5rem', color: T.textMuted }}>{activeNav}</p>
              <p style={{ fontFamily: css.fontMono, fontSize: 12, color: T.textMuted + '88' }}>
                module not yet scaffolded — coming soon
              </p>
            </div>
          )
        }
      </div>
    </div>
  )
}
