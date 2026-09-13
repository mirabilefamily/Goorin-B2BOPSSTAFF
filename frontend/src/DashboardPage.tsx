import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  BookMarked,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Download,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import { useBackable } from '@/lib/nav';
import { useTerms, cardOnFile } from '@/lib/account';
import './dashboard.css';

type Props = { name: string; onNavigate: (label: string) => void };

type LineItem = { sku: string; name: string; qty: number; price: number };
type Order = {
  id: string;
  date: string;
  shipDate: string;
  estimated: boolean;
  items: number;
  total: number;
  status: 'Open' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment: 'Partially Paid' | 'Not invoiced' | 'Paid' | 'Refunded';
  lines: LineItem[];
  tracking?: string;
};

const lines = (a: number, b: number): LineItem[] => [
  { sku: 'GB-101-BLK', name: 'Heritage Trucker · Black', qty: a, price: 8.5 },
  { sku: 'GB-204-OLV', name: 'Farm Animal Snapback · Olive', qty: b, price: 8.5 },
];

const orders: Order[] = [
  { id: 'SO58739', date: '2026-09-02', shipDate: '2027-01-06', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Not invoiced', lines: lines(1, 1) },
  { id: 'SO57017', date: '2026-08-27', shipDate: '2027-01-06', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Partially Paid', lines: lines(1, 1) },
  { id: 'SO56680', date: '2026-08-25', shipDate: '2026-08-25', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Partially Paid', lines: lines(2, 0), tracking: '1Z 999 AA1 01 2345 6784' },
  { id: 'SO55912', date: '2026-07-14', shipDate: '2026-07-19', estimated: false, items: 24, total: 1128, status: 'Delivered', payment: 'Paid', lines: lines(12, 12), tracking: '1Z 999 AA1 01 2345 1190' },
  { id: 'SO55340', date: '2026-06-03', shipDate: '2026-06-09', estimated: false, items: 12, total: 564, status: 'Delivered', payment: 'Paid', lines: lines(6, 6), tracking: '1Z 999 AA1 01 2345 0871' },
  { id: 'SO54871', date: '2026-04-22', shipDate: '2026-04-28', estimated: false, items: 36, total: 1692, status: 'Shipped', payment: 'Paid', lines: lines(18, 18), tracking: '1Z 999 AA1 01 2344 9902' },
  { id: 'SO54102', date: '2026-03-11', shipDate: '2026-03-15', estimated: false, items: 6, total: 282, status: 'Cancelled', payment: 'Refunded', lines: lines(3, 3) },
  { id: 'SO53559', date: '2026-01-28', shipDate: '2026-02-02', estimated: false, items: 18, total: 846, status: 'Delivered', payment: 'Paid', lines: lines(9, 9), tracking: '1Z 999 AA1 01 2344 5511' },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ytdSpend = [846, 0, 282, 1692, 0, 564, 1128, 34, 17, 0, 0, 0];
const trailingSpend = [420, 610, 380, ...ytdSpend.slice(0, 9)];
const trailingMonths = ['Oct', 'Nov', 'Dec', ...months.slice(0, 9)];

const compact = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M` : n >= 1000 ? `$${(n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, '')}k` : `$${Math.round(n)}`);
const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', opts);

const daysAgo = (iso: string) => {
  const d = Math.max(0, Math.round((Date.now() - new Date(`${iso}T12:00:00`).getTime()) / 86400000));
  return d === 0 ? 'today' : d === 1 ? '1d ago' : `${d}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const yearProgress = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return Math.round(((now.getTime() - start) / (end - start)) * 100);
};

function SpendBars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  const last = values.length - 1;
  return (
    <div className="stat-visual stat-visual--chart">
      <div className="stat-chart" role="img" aria-label="Monthly spend">
        {values.map((v, i) => (
          <div key={labels[i] + i} className={`stat-bar ${i === last ? 'is-active' : ''}`} data-testid={`spend-bar-${labels[i].toLowerCase()}`}>
            {i === last ? <span className="stat-bar-val" style={{ bottom: `calc(${Math.max(5, (v / max) * 100)}% + 6px)` }}>{compact(v)}</span> : <span className="stat-tip">{labels[i]} · {money(v)}</span>}
            <i style={{ height: `${Math.max(5, (v / max) * 100)}%`, animationDelay: `${0.2 + i * 0.03}s` }} />
          </div>
        ))}
      </div>
      <div className="stat-axis"><span>{labels[0]}</span><span>{labels[Math.floor(labels.length / 2)]}</span><span>{labels[labels.length - 1]}</span></div>
    </div>
  );
}

function AgingStrip({ current, late = [0, 0, 0] }: { current: number; late?: [number, number, number] }) {
  const buckets = [
    { label: 'Current', amount: current, tone: 'ok' },
    { label: '1–30 days', amount: late[0], tone: 'warn' },
    { label: '31–60 days', amount: late[1], tone: 'late' },
    { label: '60+ days', amount: late[2], tone: 'late' },
  ];
  const total = buckets.reduce((t, b) => t + b.amount, 0) || 1;
  return (
    <div className="stat-visual stat-aging" role="img" aria-label="Receivables aging" data-testid="stat-aging">
      <div className="stat-aging-bar">
        {buckets.map((b) => b.amount > 0 && <i key={b.label} className={b.tone} style={{ flexBasis: `${Math.max(3, (b.amount / total) * 100)}%` }} title={`${b.label} · ${money(b.amount)}`} />)}
      </div>
      <div className="stat-aging-tiles">
        {buckets.map((b) => (
          <div key={b.label} className={`stat-aging-b ${b.amount > 0 ? 'has' : ''} ${b.tone}`}>
            <small><i />{b.label}</small>
            <strong>{b.amount > 0 ? money(b.amount) : '—'}</strong>
            {b.amount > 0 && <span>{Math.round((b.amount / total) * 100)}%</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

type Due = { order: string; kind: 'Prepay' | 'Net 60'; date: Date; amount: number };
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d; };
const paymentsDue = (list: Order[]): Due[] => list.flatMap((o) => {
  const half = o.total / 2;
  const out: Due[] = [];
  if (o.payment === 'Not invoiced') out.push({ order: o.id, kind: 'Prepay', date: addDays(o.shipDate, -7), amount: half });
  if (o.payment !== 'Paid') out.push({ order: o.id, kind: 'Net 60', date: addDays(o.shipDate, 60), amount: half });
  return out;
}).sort((a, b) => a.date.getTime() - b.date.getTime());

function DueByMonth({ dues }: { dues: Due[] }) {
  const groups = new Map<string, { label: string; year: string; amount: number; count: number; orders: string[] }>();
  dues.forEach((x) => {
    const k = `${x.date.getFullYear()}-${String(x.date.getMonth()).padStart(2, '0')}`;
    const g = groups.get(k) ?? { label: x.date.toLocaleDateString('en-US', { month: 'short' }), year: String(x.date.getFullYear()), amount: 0, count: 0, orders: [] };
    g.amount += x.amount; g.count += 1; if (!g.orders.includes(x.order)) g.orders.push(x.order);
    groups.set(k, g);
  });
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, g]) => g);
  const max = Math.max(...rows.map((r) => r.amount), 1);
  const shown = rows;
  const more = rows.length - 3;
  return (
    <div className="stat-visual stat-due-wrap">
    <ul className="stat-sched stat-due-list" aria-label="Invoiced payments due by month" data-testid="stat-due-months">
      {shown.map((r, i) => (
        <li key={r.label + r.year} className={i === 0 ? 'paid' : ''}>
          <b>{r.label}</b>
          <span><strong>{r.label} {r.year}</strong><small>{r.count} invoice{r.count === 1 ? '' : 's'} · {r.orders.join(', ')}</small><u style={{ width: `${(r.amount / max) * 100}%` }} /></span>
          <em>{money(r.amount)}</em>
        </li>
      ))}
    </ul>
    {more > 0 && <small className="stat-due-more" data-testid="stat-due-more">Scroll for {more} more month{more === 1 ? '' : 's'}</small>}
    </div>
  );
}

function CardPaymentsCard({ open, delay }: { open: Order[]; delay: string }) {
  const charges = open.filter((o) => o.payment !== 'Paid').map((o) => ({ id: o.id, amount: o.total, date: addDays(o.shipDate, -3) })).sort((a, b) => a.date.getTime() - b.date.getTime());
  const total = charges.reduce((t, c) => t + c.amount, 0);
  const next = charges[0];
  const chargedYtd = orders.filter((o) => o.payment === 'Paid').reduce((t, o) => t + o.total, 0);
  return (
    <article className="stat dash-reveal" style={{ animationDelay: delay }} data-testid="stat-card-payments">
      <div className="stat-head">
        <span className="stat-label">Upcoming card charges</span>
        <span className="stat-chip"><CreditCard /> Pay in full</span>
      </div>
      <strong className="stat-value">{money(total)}</strong>
      <p className="stat-note">{charges.length} order{charges.length === 1 ? '' : 's'} will be charged before shipping.</p>
      <div className="stat-visual stat-cardv">
        <div className="stat-cardof" data-testid="card-on-file">
          <span className="stat-cardof-brand">{cardOnFile.brand}</span>
          <span className="stat-cardof-num">•••• •••• •••• {cardOnFile.last4}</span>
          <span className="stat-cardof-meta"><b>{cardOnFile.name}</b><small>Exp {cardOnFile.exp}</small></span>
        </div>
        <ul className="stat-charges">
          {charges.slice(0, 3).map((c) => <li key={c.id}><span><strong>{c.id}</strong><small>{c.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></span><em>{money(c.amount)}</em></li>)}
        </ul>
      </div>
      <dl className="stat-meta">
        <div><dt>Next charge</dt><dd data-testid="next-charge">{next ? <>{money(next.amount)} <span className="muted">· {next.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></> : '—'}</dd></div>
        <div><dt>Charged YTD</dt><dd>{money(chargedYtd)}</dd></div>
      </dl>
    </article>
  );
}

function SpendArea({ values, labels }: { values: number[]; labels: string[] }) {
  const W = 320, H = 96, pad = 8;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [pad + (i * (W - pad * 2)) / Math.max(1, values.length - 1), H - pad - (v / max) * (H - pad * 2)] as const);
  const curve = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const prev = pts[i - 1]; const cx = (prev[0] + p[0]) / 2;
    return `C${cx},${prev[1]} ${cx},${p[1]} ${p[0]},${p[1]}`;
  }).join(' ');
  const last = pts[pts.length - 1];
  return (
    <div className="stat-visual stat-visual--chart stat-area" data-testid="spend-area">
      <div className="stat-area-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Monthly spend">
          <defs><linearGradient id="spendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#00d4a1" stopOpacity=".32" /><stop offset="1" stopColor="#00d4a1" stopOpacity="0" /></linearGradient></defs>
          <path d={`${curve} L${last[0]},${H} L${pts[0][0]},${H} Z`} fill="url(#spendFill)" />
          <path d={curve} fill="none" stroke="#00d4a1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="stat-area-dot" style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }} />
        <span className="stat-area-val" style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }}>{compact(values[values.length - 1])}</span>
      </div>
      <div className="stat-axis"><span>{labels[0]}</span><span>{labels[Math.floor(labels.length / 2)]}</span><span>{labels[labels.length - 1]}</span></div>
    </div>
  );
}

function AgingRing({ current, late = [0, 0, 0], limit = 5000 }: { current: number; late?: [number, number, number]; limit?: number }) {
  const parts = [
    { label: 'Current', amount: current, color: '#00d4a1' },
    { label: '1–30 days', amount: late[0], color: '#f2b544' },
    { label: '31–60 days', amount: late[1], color: '#ff7a59' },
    { label: '60+ days', amount: late[2], color: '#ff3048' },
  ];
  const total = parts.reduce((t, p) => t + p.amount, 0);
  const R = 40, C = 2 * Math.PI * R;
  const live = parts.filter((p) => p.amount > 0);
  const gap = live.length > 1 ? 3 : 0;
  let acc = 0;
  const used = Math.min(100, (total / limit) * 100);
  return (
    <div className="stat-visual stat-ring-wrap">
      <div className="stat-ring" data-testid="stat-aging">
        <div className="stat-ring-chart">
          <svg viewBox="0 0 100 100" role="img" aria-label="Receivables aging">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#eef0eb" strokeWidth="11" />
            {live.map((p) => { const len = (p.amount / (total || 1)) * C; const el = <circle key={p.label} cx="50" cy="50" r={R} fill="none" stroke={p.color} strokeWidth="11" strokeDasharray={`${Math.max(0, len - gap)} ${C - Math.max(0, len - gap)}`} strokeDashoffset={-acc} transform="rotate(-90 50 50)" />; acc += len; return el; })}
          </svg>
          <div className="stat-ring-center"><strong>{total > 0 ? `${Math.round((current / total) * 100)}%` : '—'}</strong><small>current</small></div>
        </div>
        <ul className="stat-ring-legend">
          {parts.map((p) => <li key={p.label} className={p.amount > 0 ? 'has' : ''}><i style={{ background: p.color }} /><span>{p.label}</span><em>{p.amount > 0 && total > 0 ? `${Math.round((p.amount / total) * 100)}%` : ''}</em><strong>{p.amount > 0 ? money(p.amount) : '—'}</strong></li>)}
        </ul>
      </div>
      <div className="stat-credit" data-testid="stat-credit-usage">
        <div className="stat-credit-row"><span>Credit used</span><strong>{used < 1 && total > 0 ? '<1' : Math.round(used)}% <em>· {money(total)} of {compact(limit)}</em></strong></div>
        <div className="stat-credit-bar"><i style={{ width: `${Math.max(1.5, used)}%` }} /></div>
      </div>
    </div>
  );
}

const daysUntil = (d: Date) => { const n = Math.round((d.getTime() - Date.now()) / 86400000); return n < 0 ? `${-n}d overdue` : n === 0 ? 'today' : n < 60 ? `in ${n}d` : `in ${Math.round(n / 30)} mo`; };
function DueTimeline({ dues }: { dues: Due[] }) {
  const groups = new Map<string, { label: string; amount: number; orders: string[]; date: Date }>();
  dues.forEach((x) => { const k = `${x.date.getFullYear()}-${String(x.date.getMonth()).padStart(2, '0')}`; const g = groups.get(k) ?? { label: x.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), amount: 0, orders: [], date: x.date }; g.amount += x.amount; if (!g.orders.includes(x.order)) g.orders.push(x.order); groups.set(k, g); });
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, g]) => g);
  return (
    <div className="stat-visual stat-due-wrap">
      <ol className="stat-tl" data-testid="stat-due-months">
        {rows.map((r, i) => (
          <li key={r.label} className={i === 0 ? 'next' : ''}>
            <i />
            <div className="stat-tl-body">
              <div className="stat-tl-row"><strong>{r.label}</strong><em>{money(r.amount)}</em></div>
              <div className="stat-tl-row"><small>{r.orders.length} invoice{r.orders.length === 1 ? '' : 's'} · {r.orders.join(', ')}</small><small className="stat-tl-when">{daysUntil(r.date)}</small></div>
            </div>
          </li>
        ))}
      </ol>
      {rows.length > 3 && <small className="stat-due-more">Scroll for {rows.length - 3} more month{rows.length - 3 === 1 ? '' : 's'}</small>}
    </div>
  );
}

function AgingBars({ current, late = [0, 0, 0], limit = 5000 }: { current: number; late?: [number, number, number]; limit?: number }) {
  const parts = [
    { label: 'Current', amount: current, tone: 'ok' },
    { label: '1–30 days', amount: late[0], tone: 'warn' },
    { label: '31–60 days', amount: late[1], tone: 'late' },
    { label: '60+ days', amount: late[2], tone: 'late' },
  ];
  const total = parts.reduce((t, p) => t + p.amount, 0);
  const max = Math.max(...parts.map((p) => p.amount), 1);
  const used = Math.min(100, (total / limit) * 100);
  return (
    <div className="stat-visual stat-hbars-wrap">
      <ul className="stat-hbars" data-testid="stat-aging">
        {parts.map((p) => (
          <li key={p.label} className={`${p.tone} ${p.amount > 0 ? 'has' : ''}`}>
            <span className="stat-hbars-label">{p.label}</span>
            <span className="stat-hbars-track"><i style={{ width: p.amount > 0 ? `${Math.max(4, (p.amount / max) * 100)}%` : '0%' }} /></span>
            <strong>{p.amount > 0 ? money(p.amount) : <span className="stat-hbars-none">—</span>}</strong>
            <em>{p.amount > 0 && total > 0 ? `${Math.round((p.amount / total) * 100)}%` : ''}</em>
          </li>
        ))}
        <li className="credit has" data-testid="stat-credit-usage">
          <span className="stat-hbars-label">Credit used</span>
          <span className="stat-hbars-track"><i style={{ width: `${Math.max(1.5, used)}%` }} /></span>
          <strong>{money(total)}</strong>
          <em>{used < 1 && total > 0 ? '<1' : Math.round(used)}% <span>of {compact(limit)}</span></em>
        </li>
      </ul>
    </div>
  );
}

function AgingSimple({ current, late = [0, 0, 0] }: { current: number; late?: [number, number, number] }) {
  const parts = [
    { label: 'Current', amount: current, tone: 'ok' },
    { label: '1–30 days', amount: late[0], tone: 'warn' },
    { label: '31–60 days', amount: late[1], tone: 'late' },
    { label: '60+ days', amount: late[2], tone: 'late' },
  ];
  const total = parts.reduce((t, p) => t + p.amount, 0) || 1;
  return (
    <div className="stat-visual stat-simple" data-testid="stat-aging">
      <div className="stat-simple-bar">{parts.map((p) => p.amount > 0 && <i key={p.label} className={p.tone} style={{ flexBasis: `${(p.amount / total) * 100}%` }} />)}</div>
      <ul className="stat-simple-legend">
        {parts.map((p) => <li key={p.label} className={`${p.tone} ${p.amount > 0 ? 'has' : ''}`}><i /><span>{p.label}</span><strong>{p.amount > 0 ? money(p.amount) : '—'}</strong></li>)}
      </ul>
    </div>
  );
}

function DueSimple({ dues }: { dues: Due[] }) {
  const groups = new Map<string, { label: string; amount: number; date: Date; count: number }>();
  dues.forEach((x) => { const k = `${x.date.getFullYear()}-${String(x.date.getMonth()).padStart(2, '0')}`; const g = groups.get(k) ?? { label: x.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), amount: 0, date: x.date, count: 0 }; g.amount += x.amount; g.count += 1; groups.set(k, g); });
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, g]) => g);
  return (
    <div className="stat-visual stat-simple-wrap"><ul className="stat-simple-list" data-testid="stat-due-months">
      {rows.map((r, i) => <li key={r.label} className={i === 0 ? 'next' : ''}><span><strong>{r.label}</strong><small>{r.count} invoice{r.count === 1 ? '' : 's'} · {daysUntil(r.date)}</small></span><em>{money(r.amount)}</em></li>)}
    </ul></div>
  );
}

function AgingFigures({ current, late = [0, 0, 0], limit = 5000 }: { current: number; late?: [number, number, number]; limit?: number }) {
  const pastDue = late.reduce((t, n) => t + n, 0);
  const total = current + pastDue;
  const used = total / limit * 100;
  return (
    <div className="stat-visual stat-figs" data-testid="stat-aging">
      <div className="stat-figs-grid">
        <div className="stat-fig ok"><small>Current</small><strong>{money(current)}</strong><span>Not yet due</span></div>
        <div className={`stat-fig ${pastDue > 0 ? 'late has' : 'late'}`}><small>Past due</small><strong>{money(pastDue)}</strong><span>{pastDue > 0 ? `${late[0] > 0 ? '1–30' : late[1] > 0 ? '31–60' : '60+'} days` : 'Nothing overdue'}</span></div>
      </div>
      <div className="stat-figs-foot"><span>Credit used</span><div className="stat-figs-track"><i style={{ width: `${Math.max(1.5, Math.min(100, used))}%` }} /></div><strong>{used < 1 && total > 0 ? '<1' : Math.round(used)}%</strong></div>
    </div>
  );
}

function DueTiles({ dues }: { dues: Due[] }) {
  const groups = new Map<string, { m: string; y: string; amount: number; date: Date; count: number }>();
  dues.forEach((x) => { const k = `${x.date.getFullYear()}-${String(x.date.getMonth()).padStart(2, '0')}`; const g = groups.get(k) ?? { m: x.date.toLocaleDateString('en-US', { month: 'short' }), y: String(x.date.getFullYear()), amount: 0, date: x.date, count: 0 }; g.amount += x.amount; g.count += 1; groups.set(k, g); });
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, g]) => g);
  return (
    <div className="stat-visual stat-tiles-wrap">
      <div className="stat-tiles" data-testid="stat-due-months">
        {rows.map((r, i) => (
          <div key={r.m + r.y} className={`stat-tile ${i === 0 ? 'next' : ''}`}>
            <small>{r.m} <em>{r.y}</em></small>
            <strong>{r.amount >= 100000 ? compact(r.amount) : money(r.amount)}</strong>
            <span>{daysUntil(r.date)} · {r.count} inv</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditGauge({ current, late = [0, 0, 0], limit = 5000 }: { current: number; late?: [number, number, number]; limit?: number }) {
  const pastDue = late.reduce((t, n) => t + n, 0);
  const total = current + pastDue;
  const used = Math.min(100, (total / limit) * 100);
  const R = 54, C = Math.PI * R;
  const okLen = (Math.min(100, (current / limit) * 100) / 100) * C;
  const lateLen = (Math.min(100, (pastDue / limit) * 100) / 100) * C;
  return (
    <div className="stat-visual stat-gauge-wrap" data-testid="stat-aging">
      <div className="stat-gauge">
        <svg viewBox="0 0 132 72" role="img" aria-label="Credit utilization">
          <path d="M12 66 A54 54 0 0 1 120 66" fill="none" stroke="#eef0eb" strokeWidth="12" strokeLinecap="round" />
          {current > 0 && <path d="M12 66 A54 54 0 0 1 120 66" fill="none" stroke="#00d4a1" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${Math.max(2, okLen)} ${C}`} />}
          {pastDue > 0 && <path d="M12 66 A54 54 0 0 1 120 66" fill="none" stroke="#ff3048" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${Math.max(2, lateLen)} ${C}`} strokeDashoffset={-okLen} />}
        </svg>
        <div className="stat-gauge-center"><strong>{used < 1 && total > 0 ? '<1' : Math.round(used)}%</strong><small>of {compact(limit)} credit</small></div>
      </div>
      <div className="stat-gauge-legend">
        <div className="ok"><i /><span>Current</span><strong>{money(current)}</strong></div>
        <div className={pastDue > 0 ? 'late has' : 'late'}><i /><span>Past due</span><strong>{money(pastDue)}</strong></div>
      </div>
    </div>
  );
}

function DueRunway({ dues }: { dues: Due[] }) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const months = Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth() + i, 1));
  const end = months[months.length - 1].getTime();
  const span = end - start || 1;
  const groups = new Map<string, { label: string; amount: number; date: Date; count: number }>();
  dues.forEach((x) => { const k = `${x.date.getFullYear()}-${String(x.date.getMonth()).padStart(2, '0')}`; const g = groups.get(k) ?? { label: x.date.toLocaleDateString('en-US', { month: 'short' }), amount: 0, date: new Date(x.date.getFullYear(), x.date.getMonth(), 15), count: 0 }; g.amount += x.amount; g.count += 1; groups.set(k, g); });
  const rows = [...groups.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  const pct = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - start) / span) * 100));
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <div className="stat-visual stat-runway-wrap">
      <div className="stat-runway" data-testid="stat-due-months">
        <div className="stat-runway-track">
          <span className="stat-runway-now" style={{ left: `${pct(now)}%` }} />
          {rows.map((r, i) => (
            <div key={r.label + r.date.getFullYear()} className={`stat-runway-pt ${i === 0 ? 'next' : ''}`} style={{ left: `${pct(r.date)}%` }}>
              <em style={{ height: `${18 + (r.amount / max) * 34}px` }} />
              <strong>{r.amount >= 100000 ? compact(r.amount) : money(r.amount)}</strong>
            </div>
          ))}
        </div>
        <div className="stat-runway-axis">{months.map((m) => <span key={m.getTime()} className={rows.some((r) => r.date.getMonth() === m.getMonth() && r.date.getFullYear() === m.getFullYear()) ? 'has' : ''}>{m.toLocaleDateString('en-US', { month: 'short' })}</span>)}</div>
      </div>
    </div>
  );
}

function CreditLine({ current, late = [0, 0, 0], limit = 5000 }: { current: number; late?: [number, number, number]; limit?: number }) {
  const pastDue = late.reduce((t, n) => t + n, 0);
  const total = current + pastDue;
  const avail = Math.max(0, limit - total);
  const pct = (n: number) => Math.min(100, (n / limit) * 100);
  return (
    <div className="stat-visual stat-cl" data-testid="stat-aging">
      <div className="stat-cl-cols">
        <div className="ok"><small>Current</small><strong>{money(current)}</strong></div>
        <div className={pastDue > 0 ? 'late has' : 'late'}><small>Past due</small><strong>{money(pastDue)}</strong></div>
        <div><small>Available</small><strong>{money(avail)}</strong></div>
      </div>
      <div className="stat-cl-bar" aria-label="Credit line usage">
        <i className="ok" style={{ width: `${Math.max(1, pct(current))}%` }} />
        {pastDue > 0 && <i className="late" style={{ width: `${Math.max(1, pct(pastDue))}%` }} />}
      </div>
      <div className="stat-cl-ends"><span>{money(total)} used</span><span>{compact(limit)} credit line</span></div>
    </div>
  );
}

function DueDataBars({ dues }: { dues: Due[] }) {
  const groups = new Map<string, { label: string; amount: number; date: Date; count: number }>();
  dues.forEach((x) => { const k = `${x.date.getFullYear()}-${String(x.date.getMonth()).padStart(2, '0')}`; const g = groups.get(k) ?? { label: x.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), amount: 0, date: x.date, count: 0 }; g.amount += x.amount; g.count += 1; groups.set(k, g); });
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, g]) => g);
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <div className="stat-visual stat-db-wrap">
      <ul className="stat-db" data-testid="stat-due-months">
        {rows.map((r, i) => (
          <li key={r.label} className={i === 0 ? 'next' : ''}>
            <i style={{ width: `${Math.max(6, (r.amount / max) * 100)}%` }} />
            <strong>{r.label}</strong>
            <small>{daysUntil(r.date)}</small>
            <em>{money(r.amount)}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreditMeter({ current, late = [0, 0, 0], limit = 5000 }: { current: number; late?: [number, number, number]; limit?: number }) {
  const pastDue = late.reduce((t, n) => t + n, 0);
  const total = current + pastDue;
  const used = Math.min(100, (total / limit) * 100);
  return (
    <div className="stat-visual stat-meter" data-testid="stat-aging">
      <div className="stat-meter-split">
        <div className="ok"><small>Current</small><strong>{money(current)}</strong></div>
        <div className={pastDue > 0 ? 'late has' : 'late'}><small>Past due</small><strong>{money(pastDue)}</strong></div>
      </div>
      <div className="stat-meter-scale">
        <div className="stat-meter-track"><i style={{ width: `${Math.max(1, used)}%` }} /><b style={{ left: `${Math.max(1, used)}%` }} /></div>
        <div className="stat-meter-ticks">{[0, 25, 50, 75, 100].map((t) => <span key={t}>{t === 0 ? '$0' : t === 100 ? compact(limit) : `${t}%`}</span>)}</div>
      </div>
      <p className="stat-meter-note"><strong>{used < 1 && total > 0 ? '<1' : Math.round(used)}%</strong> of credit line used · {money(Math.max(0, limit - total))} available</p>
    </div>
  );
}

function DueCalendar({ dues }: { dues: Due[] }) {
  const groups = new Map<string, { m: string; d: string; y: string; amount: number; date: Date; orders: string[] }>();
  dues.forEach((x) => { const k = `${x.date.getFullYear()}-${String(x.date.getMonth()).padStart(2, '0')}`; const first = groups.get(k); const g = first ?? { m: x.date.toLocaleDateString('en-US', { month: 'short' }), d: String(x.date.getDate()), y: String(x.date.getFullYear()), amount: 0, date: x.date, orders: [] }; g.amount += x.amount; if (!g.orders.includes(x.order)) g.orders.push(x.order); if (x.date < g.date) { g.date = x.date; g.d = String(x.date.getDate()); } groups.set(k, g); });
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, g]) => g);
  return (
    <div className="stat-visual stat-cal-wrap">
      <ul className="stat-cal" data-testid="stat-due-months">
        {rows.map((r, i) => (
          <li key={r.m + r.y} className={i === 0 ? 'next' : ''}>
            <span className="stat-cal-tile"><small>{r.m}</small><b>{r.d}</b></span>
            <span className="stat-cal-text"><strong>{r.m} {r.y}</strong><small>{r.orders.length} invoice{r.orders.length === 1 ? '' : 's'} · {daysUntil(r.date)}</small></span>
            <em>{money(r.amount)}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpenOrdersCard({ open, delay }: { open: Order[]; delay: string }) {
  const value = open.reduce((t, o) => t + o.total, 0);
  const units = open.reduce((t, o) => t + o.lines.reduce((u, l) => u + l.qty, 0), 0);
  const charged = open.filter((o) => o.payment !== 'Not invoiced');
  const awaiting = open.filter((o) => o.payment === 'Not invoiced');
  const sum = (list: Order[]) => list.reduce((t, o) => t + o.total, 0);
  const rows = [...open].sort((a, b) => a.shipDate.localeCompare(b.shipDate));
  const ytd = orders.filter((o) => o.status !== 'Cancelled' && o.date.startsWith('2026'));
  const avg = ytd.length ? ytd.reduce((t, o) => t + o.total, 0) / ytd.length : 0;
  return (
    <article className="stat dash-reveal" style={{ animationDelay: delay }} data-testid="stat-open-orders">
      <div className="stat-head">
        <span className="stat-label">Open orders</span>
        <span className="stat-chip"><Package /> {units.toLocaleString()} units on order</span>
      </div>
      <strong className="stat-value">{money(value)}</strong>
      <p className="stat-note">{money(sum(charged))} charged · {money(sum(awaiting))} to be charged</p>
      <div className="stat-visual stat-oo">
        <ul className="stat-oo-list" data-testid="open-orders-list">
          {rows.map((o) => (
            <li key={o.id}>
              <span className="stat-oo-id"><strong>{o.id}</strong><small>{o.estimated ? 'Est. ships' : 'Ships'} {fmtDate(o.shipDate, { month: 'short', day: 'numeric' })}</small></span>
              <span className={`stat-oo-tag ${o.payment === 'Not invoiced' ? 'wait' : 'done'}`}>{o.payment === 'Not invoiced' ? 'Awaiting charge' : 'Charged'}</span>
              <em>{money(o.total)}</em>
            </li>
          ))}
        </ul>
      </div>
      <dl className="stat-meta">
        <div><dt>Orders YTD</dt><dd>{ytd.length} <span className="muted">placed</span></dd></div>
        <div><dt>Average order</dt><dd>{money(avg)}</dd></div>
      </dl>
    </article>
  );
}

type SortKey = 'id' | 'date' | 'shipDate' | 'items' | 'total' | 'status';

const columns: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'Order' },
  { key: 'date', label: 'Date' },
  { key: 'shipDate', label: 'Ship date' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
];

const statusTone: Record<Order['status'], string> = { Open: 'blue', Shipped: 'teal', Delivered: 'green', Cancelled: 'grey' };
const paymentTone: Record<Order['payment'], string> = { 'Partially Paid': 'amber', 'Not invoiced': 'grey', Paid: 'green', Refunded: 'grey' };

function OrderDrawer({ order, onClose, onNavigate }: { order: Order; onClose: () => void; onNavigate: (l: string) => void }) {
  const notify = useToast();
  const stageIdx = { Open: 1, Shipped: 2, Delivered: 3, Cancelled: 0 }[order.status];
  const stages = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const subtotal = order.lines.reduce((s, l) => s + l.qty * l.price, 0);
  const paid = order.payment === 'Paid' ? order.total : order.payment === 'Partially Paid' ? order.total / 2 : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="dash-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="dash-drawer" role="dialog" aria-label={`Order ${order.id}`} data-testid="order-drawer">
        <header className="dash-drawer-head">
          <div>
            <p className="dash-eyebrow">Order detail</p>
            <h2>{order.id}</h2>
            <span>Placed {fmtDate(order.date)} · {order.items} units</span>
          </div>
          <button className="dash-drawer-close" onClick={onClose} aria-label="Close" data-testid="order-drawer-close"><X size={18} /></button>
        </header>

        <div className="dash-drawer-pills">
          <span className={`dash-pill tone-${statusTone[order.status]}`}><i />{order.status}</span>
          <span className={`dash-pill tone-${paymentTone[order.payment]}`}>{order.payment}</span>
        </div>

        <section className="dash-drawer-section">
          <h3>Shipment timeline</h3>
          <ol className={`dash-timeline ${order.status === 'Cancelled' ? 'is-cancelled' : ''}`}>
            {stages.map((s, i) => (
              <li key={s} className={i < stageIdx + 1 ? 'done' : ''} data-testid={`timeline-${s.toLowerCase()}`}>
                <i />
                <strong>{order.status === 'Cancelled' && i === 0 ? 'Cancelled' : s}</strong>
                <small>{i === 0 ? fmtDate(order.date) : i === 2 || i === 3 ? (order.estimated ? `Est. ${fmtDate(order.shipDate)}` : fmtDate(order.shipDate)) : fmtDate(order.date)}</small>
              </li>
            ))}
          </ol>
          {order.tracking && <div className="dash-tracking"><Truck size={15} /><span>{order.tracking}</span><em>UPS Ground</em></div>}
        </section>

        <section className="dash-drawer-section">
          <h3>Line items</h3>
          <ul className="dash-lines">
            {order.lines.filter((l) => l.qty > 0).map((l) => (
              <li key={l.sku}>
                <span className="dash-line-thumb" />
                <div><strong>{l.name}</strong><small>{l.sku} · {l.qty} × {money(l.price)}</small></div>
                <b>{money(l.qty * l.price)}</b>
              </li>
            ))}
          </ul>
          <dl className="dash-totals">
            <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>Included</dd></div>
            <div><dt>Paid to date</dt><dd>{money(paid)}</dd></div>
            <div className="grand"><dt>Balance due</dt><dd>{money(Math.max(0, order.total - paid))}</dd></div>
          </dl>
        </section>

        <footer className="dash-drawer-foot">
          <button className="dash-btn-primary" onClick={() => { notify(`${order.items} units from ${order.id} added to your cart.`); onNavigate('Marketplace'); }} data-testid="order-reorder-btn"><RotateCcw size={16} /> Reorder</button>
          <button className="dash-btn-secondary" onClick={() => notify(order.payment === 'Not invoiced' ? 'No invoice has been issued for this order yet.' : `Invoice for ${order.id} downloading…`, order.payment === 'Not invoiced' ? 'info' : 'success')} data-testid="order-invoice-btn"><Download size={16} /> Invoice</button>
        </footer>
      </aside>
    </>
  );
}

function OrdersTable({ onViewAll, onOpen }: { onViewAll: () => void; onOpen: (o: Order) => void }) {
  const [scope, setScope] = useState<'recent' | 'all'>('recent');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });

  const rows = useMemo(() => {
    const base = scope === 'recent' ? orders.slice(0, 3) : orders;
    const q = query.trim().toLowerCase();
    const filtered = q ? base.filter((o) => [o.id, o.status, o.payment].some((s) => s.toLowerCase().includes(q))) : base;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [scope, query, sort]);

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const exportCsv = () => {
    const head = 'Order,Date,Ship date,Items,Total,Status,Payment';
    const body = rows.map((o) => [o.id, o.date, o.shipDate, o.items, o.total.toFixed(2), o.status, o.payment].join(','));
    const blob = new Blob([[head, ...body].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `goorin-orders-${scope}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="dash-orders dash-reveal" style={{ animationDelay: '.3s' }} data-testid="recent-orders-card">
      <div className="dash-orders-head">
        <div><h2>{scope === 'recent' ? 'Recent Orders' : 'All Orders'}</h2><p>{scope === 'recent' ? 'Your latest purchase history · click a row for details' : 'Every order placed on this account'}</p></div>
        <div className="dash-segment" role="tablist">
          <button role="tab" aria-selected={scope === 'recent'} className={scope === 'recent' ? 'active' : ''} onClick={() => setScope('recent')} data-testid="orders-scope-recent">Recent</button>
          <button role="tab" aria-selected={scope === 'all'} className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')} data-testid="orders-scope-all">All Orders</button>
        </div>
      </div>
      <div className="dash-orders-tools">
        <label className="dash-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order # or status..." data-testid="orders-search-input" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" data-testid="orders-search-clear"><X size={15} /></button>}</label>
        <button className="dash-export" onClick={exportCsv} data-testid="orders-export-btn"><Download size={16} /> Export</button>
      </div>
      <div className="dash-table-wrap">
        <table className="dash-table dash-table--orders">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  <button onClick={() => toggleSort(c.key)} className={sort.key === c.key ? 'sorted' : ''} data-testid={`orders-sort-${c.key}`}>
                    {c.label}
                    {sort.key === c.key ? (sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                  </button>
                </th>
              ))}
              <th aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} onClick={() => onOpen(o)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(o)} data-testid={`order-row-${o.id}`}>
                <td className="dash-td-id">{o.id}</td>
                <td>{fmtDate(o.date)}</td>
                <td>{o.estimated ? `Est. ${fmtDate(o.shipDate)}` : fmtDate(o.shipDate)}</td>
                <td>{o.items} units</td>
                <td className="dash-td-total">{money(o.total)}</td>
                <td><span className={`dash-pill tone-${statusTone[o.status]}`}><i />{o.status}</span><span className={`dash-pill tone-${paymentTone[o.payment]}`}>{o.payment}</span></td>
                <td className="dash-td-chevron"><ChevronRight size={17} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="dash-empty" data-testid="orders-empty">
                <Search size={22} /><strong>No orders match “{query}”</strong><span>Try an order number like SO58739, or a status such as “paid” or “open”.</span>
                <button onClick={() => setQuery('')}>Clear search</button>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="dash-orders-foot">
        <span data-testid="orders-count">Showing {rows.length} of {scope === 'recent' ? Math.min(3, orders.length) : orders.length} orders</span>
        <button onClick={onViewAll} data-testid="orders-view-all-btn">View All Orders <ChevronRight size={16} /></button>
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="dash dash-skeleton" aria-busy="true" data-testid="dashboard-skeleton">
      <div className="sk sk-hero" />
      <div className="stat-grid"><div className="sk sk-card" /><div className="sk sk-card" /><div className="sk sk-card" /></div>
      <div className="qa-grid" style={{ marginTop: 36 }}><div className="sk sk-action" /><div className="sk sk-action" /><div className="sk sk-action" /><div className="sk sk-action" /></div>
    </div>
  );
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function DashboardPage({ name, onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'ytd' | 'trailing'>('ytd');
  const [selected, setSelected] = useState<Order | null>(null);
  useBackable(!!selected, () => setSelected(null));

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const progress = yearProgress();
  const openOrders = orders.filter((o) => o.status === 'Open');
  const openAmount = openOrders.reduce((s, o) => s + o.total, 0);
  const spendValues = range === 'ytd' ? ytdSpend.slice(0, 9) : trailingSpend;
  const spendLabels = range === 'ytd' ? months.slice(0, 9) : trailingMonths;
  const spendTotal = spendValues.reduce((s, v) => s + v, 0);
  const spendShown = useCountUp(spendTotal);
  const [terms] = useTerms();
  const aging: [number, number, number] = [0, 0, 0];
  const pastDue = aging.reduce((t, n) => t + n, 0);
  const dues = paymentsDue(openOrders);
  const dueTotal = dues.reduce((t, d) => t + d.amount, 0);
  const nextDue = dues.find((d) => d.date.getTime() >= Date.now()) ?? dues[0];
  const due30 = dues.filter((d) => d.date.getTime() - Date.now() < 30 * 86400000).reduce((t, d) => t + d.amount, 0);
  const lastYear = range === 'ytd' ? 3860 : 5120;
  const delta = Math.round(((spendTotal - lastYear) / lastYear) * 100);
  const balanceShown = useCountUp(openAmount);
  const now = new Date();
  const todayParts = { weekday: now.toLocaleDateString('en-US', { weekday: 'long' }), day: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }), year: String(now.getFullYear()) };

  const actions = [
    { label: 'Marketplace', title: 'Browse Catalog', sub: 'Shop current in-stock styles at wholesale pricing.', cta: 'Shop now', icon: ShoppingBag },
    { label: 'Pre-Book', title: 'Pre-Book Orders', sub: 'Plan and reserve upcoming seasonal releases.', cta: 'View pre-books', icon: BookOpen },
    { label: 'My Orders', title: 'Track Orders', sub: `${openOrders.length} open order${openOrders.length === 1 ? '' : 's'} currently in fulfillment.`, cta: 'Track orders', icon: Package },
    { label: 'Resources', title: 'Brand Assets', sub: 'Download line sheets, imagery and brand media.', cta: 'Resources', icon: BookMarked },
  ];

  if (loading) return <Skeleton />;

  return (
    <div className="dash" data-testid="dashboard-page">
      <header className="dash-hero dash-reveal">
        <div>
          <p className="dash-eyebrow"><i />The Goorin Bros. B2B Portal</p>
          <h1 data-testid="dashboard-greeting">{greeting()}, <em>{name}</em>.</h1>
          <p className="dash-sub">Here's a snapshot of Mirabile Distribution's account.</p>
        </div>
        <div className="dash-hero-meta">
          <div className="dash-date dash-date--block" data-testid="dashboard-date"><span className="dash-date-ico"><CalendarDays /></span><span className="dash-date-txt"><small>{todayParts.weekday}</small><strong>{todayParts.day}</strong><em>{todayParts.year}</em></span></div>
        </div>
      </header>

      <div className="stat-grid">
        <article className="stat stat--dark dash-reveal" style={{ animationDelay: '.1s' }} data-testid="stat-ytd-spend">
          <div className="stat-head">
            <span className="stat-label">{range === 'ytd' ? 'YTD spend' : 'Trailing 12-month spend'}</span>
            <button className="stat-toggle" onClick={() => setRange(range === 'ytd' ? 'trailing' : 'ytd')} data-testid="spend-range-toggle">{range === 'ytd' ? 'Year to Date' : 'Last 12 months'}<ArrowUpDown /></button>
          </div>
          <div className="stat-value-row"><strong className="stat-value">{money(spendShown)}</strong><span className={`stat-delta ${delta >= 0 ? 'up' : 'down'}`} data-testid="spend-delta">{delta >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(delta)}% vs LY</span></div>
          <SpendArea values={spendValues} labels={spendLabels} />
          <dl className="stat-meta">
            <div><dt>Year progress</dt><dd>{progress}%</dd></div>
            <div><dt>Open amount</dt><dd>{money(openAmount)} <span className="muted">· {openOrders.length} order{openOrders.length === 1 ? '' : 's'}</span></dd></div>
          </dl>
        </article>

        {terms === 'card' ? <OpenOrdersCard open={openOrders} delay=".16s" /> : (
        <article className="stat dash-reveal" style={{ animationDelay: '.16s' }} data-testid="stat-balance">
          <div className="stat-head">
            <span className="stat-label">Outstanding balance</span>
            <span className={`stat-chip ${pastDue > 0 ? 'stat-chip--bad' : 'stat-chip--good'}`}>{pastDue > 0 ? <AlertCircle /> : <CheckCircle2 />} {pastDue > 0 ? 'Past due balance' : 'No past-due balance'}</span>
          </div>
          <strong className="stat-value">{money(balanceShown)}</strong>
          <p className={`stat-note ${pastDue > 0 ? 'bad' : ''}`}>Across {openOrders.length} open orders — {pastDue > 0 ? <b>action required.</b> : 'nothing is overdue.'}</p>
          <CreditMeter current={Math.max(0, openAmount - pastDue)} late={aging} />
          <dl className="stat-meta">
            <div><dt>Past due</dt><dd>{money(pastDue)}</dd></div>
            <div><dt>Credit available</dt><dd>{money(5000 - openAmount)} <span className="muted">of {compact(5000)}</span></dd></div>
          </dl>
        </article>
        )}

        {terms === 'card' ? <CardPaymentsCard open={openOrders} delay=".22s" /> : (
        <article className="stat dash-reveal" style={{ animationDelay: '.22s' }} data-testid="stat-due">
          <div className="stat-head">
            <span className="stat-label">Invoiced payments due</span>
            <span className="stat-chip"><CalendarDays /> Net 60</span>
          </div>
          <strong className="stat-value">{money(dueTotal)}</strong>
          <p className="stat-note">{dues.length} invoice{dues.length === 1 ? '' : 's'} across {openOrders.length} open orders, by due month.</p>
          <DueCalendar dues={dues} />
          <dl className="stat-meta">
            <div><dt>Next payment</dt><dd data-testid="next-payment">{nextDue ? <>{money(nextDue.amount)} <span className="muted">· {nextDue.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></> : '—'}</dd></div>
            <div><dt>Due in 30 days</dt><dd>{money(due30)}</dd></div>
          </dl>
        </article>
        )}
      </div>

      <div className="qa-head dash-reveal" style={{ animationDelay: '.26s' }}><h2>Quick actions</h2><span>Jump back in</span></div>
      <div className="qa-grid">
        {actions.map(({ label, title, sub, cta, icon: Icon }, i) => (
          <button key={label} className="qa dash-reveal" style={{ animationDelay: `${0.28 + i * 0.04}s` }} onClick={() => onNavigate(label)} data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <span className="qa-icon"><Icon strokeWidth={1.8} /></span>
            <span className="qa-copy-wrap"><strong>{title}</strong><small>{sub}</small></span>
            <span className="qa-cta">{cta} <ArrowUpRight /></span>
          </button>
        ))}
      </div>

      <OrdersTable onViewAll={() => onNavigate('My Orders')} onOpen={setSelected} />

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} onNavigate={(l) => { setSelected(null); onNavigate(l); }} />}
    </div>
  );
}
