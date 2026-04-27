import { useState, useMemo } from "react";
import {
  LayoutDashboard, BookOpen, Plus, X, ChevronRight,
  TrendingUp, TrendingDown, Minus, AlertCircle, Building2,
  FileText, ChevronsUpDown, Check, ArrowUpRight
} from "lucide-react";

/* ── COA Master ─────────────────────────────────────────────────── */
const COA = [
  { code: "10101", title: "Cash on Hand",         type: "asset"   },
  { code: "10201", title: "Accounts Receivable",  type: "asset"   },
  { code: "20101", title: "Accounts Payable",      type: "liability"},
  { code: "20201", title: "Output VAT",            type: "liability"},
  { code: "20202", title: "Input VAT",             type: "asset"   },
  { code: "20301", title: "EWT Payable",           type: "liability"},
  { code: "30101", title: "Owner's Equity",        type: "equity"  },
  { code: "40101", title: "Sales Revenue",         type: "income"  },
  { code: "40201", title: "Service Income",        type: "income"  },
  { code: "50101", title: "Operating Expenses",    type: "expense" },
  { code: "50201", title: "Rent Expense",          type: "expense" },
  { code: "50301", title: "Professional Fees",     type: "expense" },
];

/* ── Seed Data ──────────────────────────────────────────────────── */
let _seq = 6;
function nextId() {
  return `JE-2026-${String(_seq++).padStart(4, "0")}`;
}

const SEED = [
  { id:"JE-2026-0001", date:"2026-04-01", accountCode:"40101", accountTitle:"Sales Revenue",       particulars:"IT Consultancy – Q2 Invoice",  side:"credit", grossAmount:112000, netAmount:100000, vatAmount:12000, taxMode:"inclusive", postedBy:"R. Santos" },
  { id:"JE-2026-0002", date:"2026-04-01", accountCode:"20201", accountTitle:"Output VAT",          particulars:"Output VAT – Q2 Invoice",       side:"credit", grossAmount:12000,  netAmount:12000,  vatAmount:0,     taxMode:"inclusive", postedBy:"R. Santos" },
  { id:"JE-2026-0003", date:"2026-04-01", accountCode:"10101", accountTitle:"Cash on Hand",        particulars:"Receipt – IT Consultancy",      side:"debit",  grossAmount:112000, netAmount:112000, vatAmount:0,     taxMode:"exclusive", postedBy:"R. Santos" },
  { id:"JE-2026-0004", date:"2026-04-05", accountCode:"50101", accountTitle:"Operating Expenses",  particulars:"Office Supplies Apr 2026",      side:"debit",  grossAmount:11200,  netAmount:10000,  vatAmount:1200,  taxMode:"inclusive", postedBy:"M. Reyes"  },
  { id:"JE-2026-0005", date:"2026-04-15", accountCode:"50201", accountTitle:"Rent Expense",        particulars:"April 2026 Office Rent",        side:"debit",  grossAmount:56000,  netAmount:50000,  vatAmount:6000,  taxMode:"inclusive", postedBy:"C. Lim"    },
];

/* ── Formatters ─────────────────────────────────────────────────── */
const peso = (n) =>
  "₱" + Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-PH", { month:"short", day:"2-digit", year:"numeric" });

/* ── Tax Engine ─────────────────────────────────────────────────── */
function computeVAT(amount, mode) {
  const g = parseFloat(amount) || 0;
  if (mode === "inclusive") {
    const net = g / 1.12;
    const vat = g - net;
    return { net: +net.toFixed(2), vat: +vat.toFixed(2), total: g };
  } else {
    const vat = g * 0.12;
    const total = g + vat;
    return { net: g, vat: +vat.toFixed(2), total: +total.toFixed(2) };
  }
}

/* ════════════════════════════════════════════════════════════════ */
/*  MODAL                                                          */
/* ════════════════════════════════════════════════════════════════ */
function Modal({ onClose, onPost }) {
  const [acct,    setAcct]    = useState(COA[0]);
  const [side,    setSide]    = useState("debit");
  const [taxMode, setTaxMode] = useState("inclusive");
  const [amount,  setAmount]  = useState("");
  const [particulars, setParticulars] = useState("");
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10));
  const [coaOpen, setCoaOpen] = useState(false);
  const [err,     setErr]     = useState("");

  const calc = useMemo(() => computeVAT(amount, taxMode), [amount, taxMode]);
  const hasVAT = ["20201","20202"].includes(acct.code) || acct.type === "income" || acct.type === "expense";

  function post() {
    if (!amount || parseFloat(amount) <= 0) { setErr("Enter a valid amount."); return; }
    if (!particulars.trim()) { setErr("Particulars are required."); return; }
    setErr("");
    onPost({
      id:           nextId(),
      date,
      accountCode:  acct.code,
      accountTitle: acct.title,
      particulars:  particulars.trim(),
      side,
      grossAmount:  taxMode === "inclusive" ? calc.total : calc.total,
      netAmount:    calc.net,
      vatAmount:    hasVAT ? calc.vat : 0,
      taxMode,
      postedBy:     "R. Santos",
    });
  }

  const inputCls = "w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter:"blur(4px)", backgroundColor:"rgba(15,23,42,0.45)" }}>
      <div className="bg-white w-full max-w-xl shadow-2xl border border-slate-200 flex flex-col" style={{ maxHeight:"92vh" }}>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">New Journal Entry</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Row: Date */}
          <div>
            <label className={labelCls}>Transaction Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>

          {/* COA Dropdown */}
          <div>
            <label className={labelCls}>Account (COA)</label>
            <div className="relative">
              <button
                onClick={() => setCoaOpen(o => !o)}
                className="w-full flex items-center justify-between border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none hover:border-blue-600 transition-colors font-mono"
              >
                <span>{acct.code} — {acct.title}</span>
                <ChevronsUpDown size={14} className="text-slate-400" />
              </button>
              {coaOpen && (
                <div className="absolute z-10 top-full left-0 right-0 border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                  {COA.map(c => (
                    <button
                      key={c.code}
                      onClick={() => { setAcct(c); setCoaOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors font-mono"
                    >
                      <span className={`text-xs px-1.5 py-0.5 font-bold uppercase tracking-wide ${
                        c.type === "income"    ? "bg-emerald-100 text-emerald-700" :
                        c.type === "expense"   ? "bg-red-100 text-red-700" :
                        c.type === "asset"     ? "bg-blue-100 text-blue-700" :
                        c.type === "liability" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{c.type}</span>
                      <span>{c.code} — {c.title}</span>
                      {acct.code === c.code && <Check size={12} className="ml-auto text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Toggles row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Side toggle */}
            <div>
              <label className={labelCls}>Entry Side</label>
              <div className="flex border border-slate-300">
                {["debit","credit"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                      side === s
                        ? s === "debit" ? "bg-blue-600 text-white" : "bg-slate-800 text-white"
                        : "bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Tax mode toggle */}
            <div>
              <label className={labelCls}>VAT Treatment</label>
              <div className="flex border border-slate-300">
                {[["inclusive","Tax Incl."],["exclusive","Tax Excl."]].map(([v,l]) => (
                  <button
                    key={v}
                    onClick={() => setTaxMode(v)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                      taxMode === v ? "bg-emerald-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>Gross Amount (PHP)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Live Preview */}
          {parseFloat(amount) > 0 && (
            <div className="border border-slate-200 bg-slate-50 divide-y divide-slate-200">
              <div className="px-4 py-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live VAT Preview — {taxMode === "inclusive" ? "Tax Inclusive" : "Tax Exclusive"}</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                {[
                  ["Net Amount",  peso(calc.net)],
                  ["VAT (12%)",   peso(hasVAT ? calc.vat : 0)],
                  ["Total",       peso(calc.total)],
                ].map(([k,v]) => (
                  <div key={k} className="px-4 py-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1 font-mono">{k}</p>
                    <p className={`text-sm font-bold font-mono ${k === "VAT (12%)" ? "text-emerald-600" : "text-slate-800"}`}>{v}</p>
                  </div>
                ))}
              </div>
              {taxMode === "inclusive"
                ? <p className="px-4 py-2 text-xs text-slate-400 font-mono">Formula: Net = Gross ÷ 1.12 &nbsp;|&nbsp; VAT = Gross − Net</p>
                : <p className="px-4 py-2 text-xs text-slate-400 font-mono">Formula: VAT = Amount × 0.12 &nbsp;|&nbsp; Total = Amount + VAT</p>
              }
            </div>
          )}

          {/* Particulars */}
          <div>
            <label className={labelCls}>Particulars</label>
            <input
              type="text"
              placeholder="e.g. April 2026 Office Rent"
              value={particulars}
              onChange={e => setParticulars(e.target.value)}
              className={inputCls}
            />
          </div>

          {err && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-mono">
              <AlertCircle size={13} /> {err}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-400 font-mono">Auto-timestamp on post · RDO 040</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button onClick={post} className="px-5 py-2 text-xs font-bold uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Check size={13} /> Post Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  JOURNAL ENTRIES VIEW                                           */
/* ════════════════════════════════════════════════════════════════ */
function JournalEntriesView({ transactions, onAdd }) {
  const [showModal, setShowModal] = useState(false);
  const [filter,    setFilter]    = useState("");

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return [...transactions]
      .sort((a, b) => b.id.localeCompare(a.id))
      .filter(t =>
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.accountCode.includes(q) ||
        t.accountTitle.toLowerCase().includes(q) ||
        t.particulars.toLowerCase().includes(q)
      );
  }, [transactions, filter]);

  const cols = [
    { key:"id",           label:"JE ID",        w:"130px"  },
    { key:"date",         label:"Date",          w:"100px"  },
    { key:"accountCode",  label:"Acct Code",     w:"90px"   },
    { key:"accountTitle", label:"Account Title", w:"160px"  },
    { key:"particulars",  label:"Particulars",   w:"auto"   },
    { key:"debit",        label:"Debit",         w:"110px", align:"right" },
    { key:"credit",       label:"Credit",        w:"110px", align:"right" },
    { key:"vatAmount",    label:"VAT",           w:"100px", align:"right" },
  ];

  function post(entry) {
    onAdd(entry);
    setShowModal(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Journal Entries</h2>
          <span className="text-xs text-slate-400 font-mono">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search entries..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-slate-300 px-3 py-1.5 text-xs text-slate-700 w-52 focus:outline-none focus:border-blue-600 font-mono"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Plus size={13} /> New Journal Entry
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs font-mono" style={{ minWidth: 900 }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              {cols.map(c => (
                <th
                  key={c.key}
                  style={{ width: c.w, textAlign: c.align || "left" }}
                  className="px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap border-r border-slate-200 last:border-r-0"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-xs font-mono">
                  No entries found. Post your first journal entry.
                </td>
              </tr>
            )}
            {filtered.map((t, i) => (
              <tr
                key={t.id}
                className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${i % 2 === 1 ? "bg-slate-50/40" : "bg-white"}`}
              >
                <td className="px-3 py-2 text-blue-600 font-bold whitespace-nowrap border-r border-slate-100">{t.id}</td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap border-r border-slate-100">{fmtDate(t.date)}</td>
                <td className="px-3 py-2 border-r border-slate-100">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 font-bold tracking-wide">{t.accountCode}</span>
                </td>
                <td className="px-3 py-2 text-slate-700 border-r border-slate-100 whitespace-nowrap">{t.accountTitle}</td>
                <td className="px-3 py-2 text-slate-600 border-r border-slate-100 max-w-xs truncate">{t.particulars}</td>
                <td className="px-3 py-2 text-right border-r border-slate-100">
                  {t.side === "debit" ? <span className="text-slate-800 font-semibold">{peso(t.grossAmount)}</span> : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2 text-right border-r border-slate-100">
                  {t.side === "credit" ? <span className="text-slate-800 font-semibold">{peso(t.grossAmount)}</span> : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  {t.vatAmount > 0
                    ? <span className="text-emerald-600 font-semibold">{peso(t.vatAmount)}</span>
                    : <span className="text-slate-300">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals footer */}
          {filtered.length > 0 && (
            <tfoot className="sticky bottom-0">
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <td colSpan={5} className="px-3 py-2.5 text-xs text-slate-500 uppercase tracking-widest border-r border-slate-200">
                  Totals — {filtered.length} entries
                </td>
                <td className="px-3 py-2.5 text-right border-r border-slate-200 text-slate-800">
                  {peso(filtered.filter(t => t.side === "debit").reduce((s,t) => s + t.grossAmount, 0))}
                </td>
                <td className="px-3 py-2.5 text-right border-r border-slate-200 text-slate-800">
                  {peso(filtered.filter(t => t.side === "credit").reduce((s,t) => s + t.grossAmount, 0))}
                </td>
                <td className="px-3 py-2.5 text-right text-emerald-600">
                  {peso(filtered.reduce((s,t) => s + (t.vatAmount || 0), 0))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} onPost={post} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  DASHBOARD VIEW                                                 */
/* ════════════════════════════════════════════════════════════════ */
function DashboardView({ transactions }) {
  const stats = useMemo(() => {
    const outputVAT = transactions
      .filter(t => ["20201","40101","40201"].includes(t.accountCode) && t.side === "credit")
      .reduce((s,t) => s + (t.vatAmount || 0), 0);
    const inputVAT = transactions
      .filter(t => ["20202","50101","50201","50301"].includes(t.accountCode) && t.side === "debit")
      .reduce((s,t) => s + (t.vatAmount || 0), 0);
    const netVAT = outputVAT - inputVAT;
    const totalDebit  = transactions.filter(t => t.side === "debit").reduce((s,t) => s + t.grossAmount, 0);
    const totalCredit = transactions.filter(t => t.side === "credit").reduce((s,t) => s + t.grossAmount, 0);
    return { outputVAT, inputVAT, netVAT, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  }, [transactions]);

  const summaryCards = [
    {
      label: "Total Output VAT",
      value: peso(stats.outputVAT),
      icon: <TrendingUp size={18} />,
      accent: "border-blue-600",
      iconBg: "bg-blue-50 text-blue-600",
      note: "From sales & income accounts",
    },
    {
      label: "Total Input VAT",
      value: peso(stats.inputVAT),
      icon: <TrendingDown size={18} />,
      accent: "border-emerald-500",
      iconBg: "bg-emerald-50 text-emerald-600",
      note: "From expense accounts",
    },
    {
      label: "Net VAT Payable",
      value: peso(stats.netVAT),
      icon: stats.netVAT >= 0 ? <ArrowUpRight size={18} /> : <Minus size={18} />,
      accent: stats.netVAT >= 0 ? "border-red-500" : "border-emerald-500",
      iconBg: stats.netVAT >= 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600",
      note: stats.netVAT >= 0 ? "Amount due to BIR" : "Credit / overpayment",
    },
    {
      label: "Trial Balance",
      value: stats.balanced ? "BALANCED" : "UNBALANCED",
      icon: <Check size={18} />,
      accent: stats.balanced ? "border-emerald-500" : "border-red-500",
      iconBg: stats.balanced ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
      note: `Dr: ${peso(stats.totalDebit)} · Cr: ${peso(stats.totalCredit)}`,
    },
  ];

  /* Recent entries for dashboard mini-table */
  const recent = [...transactions].sort((a,b) => b.id.localeCompare(a.id)).slice(0, 8);

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6 space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className={`bg-white border border-slate-200 border-t-2 ${card.accent} p-5`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{card.label}</p>
              <div className={`${card.iconBg} p-1.5`}>{card.icon}</div>
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight mb-1">{card.value}</p>
            <p className="text-xs text-slate-400 font-mono">{card.note}</p>
          </div>
        ))}
      </div>

      {/* VAT Summary table */}
      <div className="grid grid-cols-3 gap-4">
        {/* BIR Filing Status */}
        <div className="bg-white border border-slate-200 p-5 col-span-1">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Building2 size={14} className="text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-700">BIR Compliance</span>
          </div>
          <div className="space-y-3">
            {[
              ["RDO",          "040 — Cubao",      true  ],
              ["Fiscal Year",  "2026",              true  ],
              ["VAT Period",   "April 2026",        true  ],
              ["Filing Mode",  "eFPS",              true  ],
              ["EIS Status",   "Connected",         true  ],
              ["Form 2550-M",  "Due Apr 30",        false ],
              ["Form 1601-EQ", "Due Apr 25 — URGENT", false],
            ].map(([k, v, ok]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">{k}</span>
                <span className={`text-xs font-bold font-mono ${ok ? "text-slate-700" : "text-red-600"}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 col-span-2 flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200">
            <BookOpen size={14} className="text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-700">Recent Entries</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["JE ID","Date","Account","Particulars","Amount","VAT"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((t, i) => (
                  <tr key={t.id} className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}>
                    <td className="px-3 py-2 text-blue-600 font-bold whitespace-nowrap">{t.id}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{fmtDate(t.date)}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.accountCode}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{t.particulars}</td>
                    <td className="px-3 py-2 text-slate-800 font-semibold text-right whitespace-nowrap">{peso(t.grossAmount)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {t.vatAmount > 0
                        ? <span className="text-emerald-600 font-semibold">{peso(t.vatAmount)}</span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  ROOT APP                                                       */
/* ════════════════════════════════════════════════════════════════ */
export default function App() {
  const [view,         setView]         = useState("dashboard");
  const [transactions, setTransactions] = useState(SEED);

  function addEntry(entry) {
    setTransactions(prev => [...prev, entry]);
  }

  const navItems = [
    { id: "dashboard",       label: "Dashboard",       icon: <LayoutDashboard size={16} /> },
    { id: "journal-entries", label: "Journal Entries", icon: <BookOpen size={16} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-52 flex-shrink-0 bg-slate-900 flex flex-col border-r border-slate-700">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">₱</span>
            </div>
            <span className="text-white text-sm font-bold tracking-wide">TaxLedger</span>
          </div>
          <p className="text-slate-400 text-xs font-mono ml-8">PH · 2026</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          <p className="px-3 pt-3 pb-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">Modules</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold tracking-wide transition-colors text-left ${
                view === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
              {view === item.id && <ChevronRight size={12} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-slate-700 space-y-1">
          <p className="text-xs text-slate-400 font-mono">R. Santos</p>
          <p className="text-xs text-slate-500 font-mono">Fund Accountant</p>
          <p className="text-xs text-slate-600 font-mono">RDO 040 — Cubao</p>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Global Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                SME Tax &amp; Ledger System
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Fiscal Year 2026 &nbsp;·&nbsp; RDO 040 — Cubao &nbsp;·&nbsp; BIR-Compliant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
              EIS CONNECTED
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200">
              eFPS ACTIVE
            </span>
            <span className="text-xs font-mono text-slate-400 border-l border-slate-200 pl-3">
              {new Date().toLocaleDateString("en-PH", { month:"short", day:"2-digit", year:"numeric" })}
            </span>
          </div>
        </header>

        {/* View Router */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === "dashboard"
            ? <DashboardView transactions={transactions} />
            : <JournalEntriesView transactions={transactions} onAdd={addEntry} />
          }
        </div>
      </div>
    </div>
  );
}
