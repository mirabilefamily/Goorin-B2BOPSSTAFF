import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  ChevronDown,
  Download,
  Info,
  MoveDownRight,
  MoveUpRight,
  Search,
} from 'lucide-react';
import './dashboard.css';

type Props = { name?: string; onNavigate: (label: string) => void };
type Seg = 'all' | 'us' | 'dist';

/* ---------- formatters ---------- */
const fmtFull = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
};

/* ---------- header metrics per segment ---------- */
const HEADER: Record<Seg, { invoiced: number; delta: number; open: number; total: number; forecast: number; goalPct: number; goalCur: number; goalTarget: number; pace: number }> = {
  all: { invoiced: 11_572_416, delta: -14.7, open: 9_200_000, total: 20_700_000, forecast: 17_300_000, goalPct: 67, goalCur: 11_600_000, goalTarget: 17_300_000, pace: 75 },
  us: { invoiced: 6_412_880, delta: -9.2, open: 5_100_000, total: 11_500_000, forecast: 9_400_000, goalPct: 72, goalCur: 6_400_000, goalTarget: 8_900_000, pace: 75 },
  dist: { invoiced: 5_159_536, delta: -21.4, open: 4_100_000, total: 9_200_000, forecast: 7_900_000, goalPct: 61, goalCur: 5_100_000, goalTarget: 8_400_000, pace: 75 },
};

const SEG_LABELS: { id: Seg; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'us', label: 'US Wholesale' },
  { id: 'dist', label: 'Distributors' },
];

/* ---------- monthly revenue (dollars) ---------- */
type MRow = { m: string; invoiced: number; open: number; forecast: number; total: number };
const buildMonths = (scale: number): MRow[] => {
  const base = [
    { m: 'Jan', invoiced: 1_010_000, open: 0, forecast: 1_010_000 },
    { m: 'Feb', invoiced: 1_555_000, open: 0, forecast: 1_500_000 },
    { m: 'Mar', invoiced: 850_000, open: 0, forecast: 900_000 },
    { m: 'Apr', invoiced: 1_150_000, open: 0, forecast: 1_120_000 },
    { m: 'May', invoiced: 1_100_000, open: 6_400, forecast: 1_110_000 },
    { m: 'Jun', invoiced: 1_255_000, open: 0, forecast: 1_170_000 },
    { m: 'Jul', invoiced: 1_300_000, open: 0, forecast: 2_180_000 },
    { m: 'Aug', invoiced: 1_300_000, open: 0, forecast: 1_520_000 },
    { m: 'Sep', invoiced: 905_000, open: 0, forecast: 860_000 },
    { m: 'Oct', invoiced: 0, open: 1_010_000, forecast: 1_020_000 },
    { m: 'Nov', invoiced: 0, open: 2_240_000, forecast: 1_610_000 },
    { m: 'Dec', invoiced: 0, open: 1_920_000, forecast: 2_520_000 },
  ];
  return base.map((r) => ({ ...r, invoiced: r.invoiced * scale, open: r.open * scale, forecast: r.forecast * scale, total: (r.invoiced + r.open) * scale }));
};

/* ---------- segments ---------- */
const SEGMENTS = [
  { key: 'us', name: 'US Wholesale', color: '#16a37a', invoiced: 6_400_000, goal: 8_900_000, pct: 72 },
  { key: 'dist', name: 'Distributors', color: '#3b6ef6', invoiced: 5_100_000, goal: 8_400_000, pct: 61 },
];

const TOP_ACCOUNTS = [
  { rank: 1, name: 'Lids', amount: 2_700_000, yoy: -20.1 },
  { rank: 2, name: 'SASAtrend', amount: 1_400_000, yoy: -10.4 },
  { rank: 3, name: 'Industrias Mercury, S.A.', amount: 1_000_000, yoy: 62.6 },
  { rank: 4, name: 'Nordstrom Accounts Payable', amount: 726_500, yoy: -19.6 },
  { rank: 5, name: 'Buckle Inc., The', amount: 616_600, yoy: -54.8 },
];

/* ---------- account detail ---------- */
type Acct = {
  id: string; name: string; segment: 'US Wholesale' | 'Distributors'; strategic?: boolean;
  invoiced: number; open: number; total: number; goal: number; vsGoal: number; yoy: number; priorYear: number; priorYtd: number;
};
const ACCOUNTS: Acct[] = [
  { id: 'lids', name: 'Lids', segment: 'US Wholesale', strategic: true, invoiced: 2_700_000, open: 1_744_320, total: 4_460_373, goal: 3_000_000, vsGoal: 48.7, yoy: -20.1, priorYear: 4_683_724, priorYtd: 3_400_000 },
  { id: 'sasa', name: 'SASAtrend', segment: 'Distributors', strategic: true, invoiced: 1_400_000, open: 860_300, total: 2_200_000, goal: 2_200_000, vsGoal: 1.3, yoy: -10.4, priorYear: 2_460_000, priorYtd: 1_560_000 },
  { id: 'buckle', name: 'Buckle Inc., The', segment: 'US Wholesale', strategic: true, invoiced: 616_600, open: 726_000, total: 1_300_000, goal: 1_000_000, vsGoal: 32.7, yoy: -54.8, priorYear: 1_365_000, priorYtd: 1_365_000 },
  { id: 'dtlr', name: 'DTLR Inc.', segment: 'US Wholesale', invoiced: 569_400, open: 705_000, total: 1_300_000, goal: 810_000, vsGoal: 57.3, yoy: 267.7, priorYear: 346_000, priorYtd: 154_800 },
  { id: '313srl', name: '313 SRL VAT 04640850238', segment: 'Distributors', invoiced: 603_800, open: 691_700, total: 1_300_000, goal: 1_800_000, vsGoal: -29.1, yoy: -11.3, priorYear: 1_460_000, priorYtd: 680_000 },
  { id: 'mercury', name: 'Industrias Mercury, S.A.', segment: 'Distributors', invoiced: 1_000_000, open: 524_100, total: 1_600_000, goal: 1_100_000, vsGoal: 37.8, yoy: 62.6, priorYear: 984_000, priorYtd: 615_000 },
  { id: 'fibelock', name: 'Fibelock Mills SA (Energy Brands)', segment: 'Distributors', invoiced: 508_600, open: 416_600, total: 925_100, goal: 514_100, vsGoal: 80.0, yoy: 57.6, priorYear: 587_000, priorYtd: 323_000 },
  { id: 'gardea', name: 'Grupo Gardea SA DE CV', segment: 'Distributors', invoiced: 362_200, open: 365_400, total: 727_600, goal: 698_100, vsGoal: 4.2, yoy: 13.2, priorYear: 643_000, priorYtd: 320_000 },
  { id: 'petek', name: 'Petek Tekstil San. VE Tc. A.S.', segment: 'Distributors', invoiced: 240_200, open: 335_500, total: 575_700, goal: 540_200, vsGoal: 6.6, yoy: -62.2, priorYear: 635_000, priorYtd: 635_000 },
  { id: 'nordstrom', name: 'Nordstrom Accounts Payable', segment: 'US Wholesale', invoiced: 726_500, open: 298_000, total: 1_024_500, goal: 1_200_000, vsGoal: -14.6, yoy: -19.6, priorYear: 1_274_000, priorYtd: 903_000 },
  { id: 'manhattan', name: 'Manhattan International Concepts Inc', segment: 'US Wholesale', invoiced: 210_400, open: 188_000, total: 398_400, goal: 360_000, vsGoal: 10.7, yoy: 8.4, priorYear: 367_000, priorYtd: 194_000 },
  { id: 'zumiez', name: 'Zumiez Services LLC', segment: 'US Wholesale', invoiced: 184_900, open: 142_600, total: 327_500, goal: 420_000, vsGoal: -22.0, yoy: -4.1, priorYear: 341_000, priorYtd: 192_000 },
];

/* ---------- delta chip ---------- */
function Delta({ v, plain }: { v: number; plain?: boolean }) {
  const up = v >= 0;
  return (
    <span className={`rv-yoy ${up ? 'up' : 'down'} ${plain ? 'plain' : ''}`}>
      {up ? <MoveUpRight size={13} /> : <MoveDownRight size={13} />}{Math.abs(v).toFixed(1)}%
    </span>
  );
}

/* ---------- chart tooltip ---------- */
function RevTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as MRow;
  const items = [
    { k: 'Invoiced', v: row.invoiced, c: '#0f7a56' },
    { k: 'Open Orders', v: row.open, c: '#22c6a6' },
    { k: 'Total', v: row.total, c: '#16307a' },
    { k: 'Forecast', v: row.forecast, c: '#e0940f' },
  ];
  return (
    <div className="rv-tip" data-testid="revenue-tooltip">
      <p className="rv-tip-h">{label.toUpperCase()}</p>
      {items.map((it) => (
        <div className="rv-tip-row" key={it.k}>
          <span><i style={{ background: it.c }} />{it.k}</span>
          <b>{compact(it.v)}</b>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage({ onNavigate }: Props) {
  const [seg, setSeg] = useState<Seg>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const h = HEADER[seg];
  const scale = seg === 'all' ? 1 : seg === 'us' ? 0.56 : 0.44;
  const months = useMemo(() => buildMonths(scale), [scale]);
  const chartMax = useMemo(() => Math.ceil(Math.max(...months.map((m) => Math.max(m.total, m.forecast))) / 1_250_000) * 1_250_000, [months]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ACCOUNTS.filter((a) => a.name.toLowerCase().includes(q) || a.segment.toLowerCase().includes(q)) : ACCOUNTS;
  }, [query]);

  const exportCsv = () => {
    const head = 'Month,Invoiced,Open,Total,Forecast';
    const body = months.map((m) => [m.m, m.invoiced, m.open, m.total, m.forecast].map(Math.round).join(','));
    const blob = new Blob([[head, ...body.slice(1).map((_, i) => body[i])].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'goorin-revenue-by-month.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rv" data-testid="dashboard-page">
      {/* HERO */}
      <section className="rv-hero" data-testid="rv-hero">
        <div className="rv-hero-glow" aria-hidden="true" />
        <div className="rv-hero-top">
          <div className="rv-hero-lead">
            <div className="rv-figure">
              <strong data-testid="rv-invoiced-ytd">{fmtFull(h.invoiced)}</strong>
              <span className={`rv-delta ${h.delta >= 0 ? 'up' : 'down'}`} data-testid="rv-invoiced-delta">
                {h.delta >= 0 ? <MoveUpRight size={14} /> : <MoveDownRight size={14} />}{Math.abs(h.delta)}%
              </span>
            </div>
            <p>Invoiced revenue · year to date</p>
          </div>
          <div className="rv-seg" role="tablist" aria-label="Revenue segment">
            {SEG_LABELS.map((s) => (
              <button key={s.id} role="tab" aria-selected={seg === s.id} className={seg === s.id ? 'active' : ''} onClick={() => setSeg(s.id)} data-testid={`rv-seg-${s.id}`}>{s.label}</button>
            ))}
          </div>
        </div>

        <div className="rv-tiles">
          {[
            { k: 'Open orders', v: h.open, testid: 'rv-tile-open' },
            { k: 'Total (invoiced + open)', v: h.total, testid: 'rv-tile-total' },
            { k: 'Forecast', v: h.forecast, testid: 'rv-tile-forecast' },
          ].map((t) => (
            <div className="rv-tile" key={t.k} data-testid={t.testid}>
              <span>{t.k}</span>
              <strong>{compact(t.v)}</strong>
            </div>
          ))}
        </div>

        <div className="rv-goal">
          <div className="rv-goal-head">
            <span>Annual Goal Progress</span>
            <em className={`rv-pace-badge ${h.goalPct >= h.pace ? 'ok' : 'behind'}`}>{h.goalPct >= h.pace ? 'On pace' : 'Behind pace'}</em>
          </div>
          <div className="rv-goal-bar">
            <i style={{ width: `${h.goalPct}%` }} />
            <b className="rv-goal-pace" style={{ left: `${h.pace}%` }} title={`Pace ${h.pace}%`} />
          </div>
          <div className="rv-goal-foot">
            <span><strong data-testid="rv-goal-pct">{h.goalPct}%</strong> {compact(h.goalCur)} of {compact(h.goalTarget)}</span>
            <span className="rv-goal-pacetxt"><i />Pace {h.pace}%</span>
          </div>
        </div>
      </section>

      {/* MID: chart + segments */}
      <div className="rv-mid">
        <section className="rv-card rv-chart-card" data-testid="rv-chart-card">
          <div className="rv-card-head">
            <div className="rv-card-title">
              <h2>Revenue by Month</h2>
              <button className="rv-export" onClick={exportCsv} data-testid="rv-export-btn"><Download size={15} /> Export</button>
            </div>
            <div className="rv-legend">
              <span><i className="dot" style={{ background: '#0f7a56' }} />Invoiced</span>
              <span><i className="dot" style={{ background: '#22c6a6' }} />Open Orders</span>
              <span><i className="line" style={{ background: '#16307a' }} />Total</span>
              <span><i className="dash" />Forecast</span>
            </div>
          </div>
          <div className="rv-chart" data-testid="rv-chart">
            <ResponsiveContainer width="100%" height={330}>
              <ComposedChart data={months} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3aa77e" /><stop offset="100%" stopColor="#0e6b4c" /></linearGradient>
                  <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ad6b8" /><stop offset="100%" stopColor="#1fa98c" /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eceef0" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fill: '#8a938e', fontSize: 12 }} dy={8} />
                <YAxis tickFormatter={(v) => compact(v)} tickLine={false} axisLine={false} tick={{ fill: '#a3aaa5', fontSize: 11 }} width={52} domain={[0, chartMax]} />
                <Tooltip cursor={{ fill: 'rgba(15,122,86,0.05)' }} content={<RevTooltip />} />
                <ReferenceLine x="Sep" stroke="#c9ced2" strokeDasharray="4 4" />
                <Bar dataKey="invoiced" stackId="rev" fill="url(#gInv)" radius={[0, 0, 0, 0]} maxBarSize={34} isAnimationActive={false} />
                <Bar dataKey="open" stackId="rev" fill="url(#gOpen)" radius={[6, 6, 0, 0]} maxBarSize={34} isAnimationActive={false} />
                <Line type="monotone" dataKey="total" stroke="#16307a" strokeWidth={2.6} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="forecast" stroke="#e0940f" strokeWidth={2.2} strokeDasharray="6 5" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rv-card rv-segs" data-testid="rv-segments-card">
          <div className="rv-card-head rv-segs-head">
            <h2>Segments</h2>
            <span className="rv-muted">YTD pace</span>
          </div>
          <div className="rv-seg-list">
            {SEGMENTS.map((s) => (
              <div className="rv-seg-item" key={s.key} data-testid={`rv-segment-${s.key}`}>
                <div className="rv-seg-row1">
                  <span className="rv-seg-name"><i style={{ background: s.color }} />{s.name}</span>
                  <em className="rv-seg-pct">{s.pct}% of goal</em>
                </div>
                <div className="rv-seg-row2">
                  <strong>{compact(s.invoiced)} <small>invoiced</small></strong>
                  <span className="rv-muted">Goal {compact(s.goal)}</span>
                </div>
                <div className="rv-seg-bar">
                  <i style={{ width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.color}bb, ${s.color})` }} />
                  <b style={{ left: `${(s.goal / s.goal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="rv-sub-label">Top accounts</p>
          <ul className="rv-top" data-testid="rv-top-accounts">
            {TOP_ACCOUNTS.map((a) => (
              <li key={a.rank}>
                <span className="rv-top-rank">{a.rank}</span>
                <span className="rv-top-name">{a.name}</span>
                <b className="rv-top-amt">{compact(a.amount)}</b>
                <Delta v={a.yoy} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ACCOUNT DETAIL */}
      <section className="rv-card rv-acct" data-testid="rv-account-detail">
        <div className="rv-acct-head">
          <div>
            <h2>Account Detail</h2>
            <p>Click any row to expand metrics</p>
          </div>
          <div className="rv-acct-tools">
            <label className="rv-acct-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search accounts..." data-testid="rv-account-search" /></label>
            <span className="rv-acct-count">{220} accounts</span>
          </div>
        </div>

        <div className="rv-table" role="table">
          <div className="rv-tr rv-th" role="row">
            <span role="columnheader">Account</span>
            <span role="columnheader">Invoiced</span>
            <span role="columnheader">Open</span>
            <span role="columnheader">Total</span>
            <span role="columnheader">Goal</span>
            <span role="columnheader">vs Goal</span>
            <span role="columnheader">YoY</span>
            <span aria-hidden="true" />
          </div>

          {rows.map((a) => {
            const isOpen = expanded === a.id;
            const barPct = Math.min(100, (a.invoiced / a.goal) * 100);
            const good = a.yoy >= 0;
            return (
              <div key={a.id} className={`rv-row-wrap ${isOpen ? 'is-open' : ''}`}>
                <div className="rv-tr rv-row" role="row" tabIndex={0} onClick={() => setExpanded(isOpen ? null : a.id)} onKeyDown={(e) => e.key === 'Enter' && setExpanded(isOpen ? null : a.id)} data-testid={`rv-account-row-${a.id}`}>
                  <span className="rv-acct-name">
                    <b>{a.name}{a.strategic && <em className="rv-strategic">STRATEGIC</em>}</b>
                    <small>{a.segment}</small>
                  </span>
                  <span className="rv-acct-inv">
                    <b>{compact(a.invoiced)}</b>
                    <i className={good ? 'ok' : 'warn'} style={{ width: `${Math.max(12, barPct)}%` }} />
                  </span>
                  <span className="rv-num rv-muted">{compact(a.open)}</span>
                  <span className="rv-num rv-strong">{compact(a.total)}</span>
                  <span className="rv-num rv-muted">{compact(a.goal)}</span>
                  <span className={`rv-num rv-vs ${a.vsGoal >= 0 ? 'up' : 'down'}`}>{a.vsGoal >= 0 ? '+' : ''}{a.vsGoal.toFixed(1)}%</span>
                  <span className="rv-num"><Delta v={a.yoy} /></span>
                  <span className="rv-chev"><ChevronDown size={17} className={isOpen ? 'spin' : ''} /></span>
                </div>
                {isOpen && (
                  <div className="rv-expand" data-testid={`rv-account-expand-${a.id}`}>
                    <div className="rv-metrics">
                      <div className="rv-metric"><small>Open pipeline</small><strong>{fmtFull(a.open)}</strong><span>in pipeline</span></div>
                      <div className="rv-metric"><small>Conservative land <Info size={12} /></small><strong>{fmtFull(a.total)}</strong><span>invoiced + open</span></div>
                      <div className="rv-metric"><small>Full-year forecast <Info size={12} /></small><strong className="rv-green">{fmtFull(a.total)}</strong><span>{a.total >= a.goal ? '+' : '-'}{compact(Math.abs(a.total - a.goal))} vs goal</span></div>
                      <div className="rv-metric"><small>Annual goal</small><strong>{fmtFull(a.goal)}</strong><span>target</span></div>
                      <div className="rv-metric"><small>Prior year</small><strong>{fmtFull(a.priorYear)}</strong><span>YTD {compact(a.priorYtd)} · {a.yoy >= 0 ? '+' : ''}{a.yoy.toFixed(1)}% YoY</span></div>
                    </div>
                    <button className="rv-open-acct" onClick={() => onNavigate('Open Orders')} data-testid={`rv-open-account-${a.id}`}>Open account <ArrowUpRight size={15} /></button>
                  </div>
                )}
              </div>
            );
          })}
          {rows.length === 0 && <div className="rv-empty" data-testid="rv-account-empty">No accounts match “{query}”.</div>}
        </div>
      </section>
    </div>
  );
}
