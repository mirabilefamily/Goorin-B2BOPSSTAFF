import { useMemo, useState } from 'react';
import {
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Download,
  FolderClosed,
  Info,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Send,
  Upload,
  Zap,
} from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import './prebookreview.css';

type Props = { onNavigate: (label: string) => void };

const compactK = (n: number) => (Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`);

/* ---------- seasons / drops ---------- */
const seasonDrops = [
  { id: 'drop1', label: 'Drop 1', status: 'closed' as const },
  { id: 'drop2', label: 'Drop 2', status: 'closed' as const },
  { id: 'drop3', label: 'Drop 3', status: 'open' as const, count: 21 },
];

/* ---------- header stat cards ---------- */
const statCards = [
  { key: 'combined', name: 'Total Combined', dot: '#e9ece9', accounts: 4, units: 13328, wholesale: '$130K', moq: '43%', moqTone: 'amber', hit: '9/21', pct: (9 / 21) * 100, bar: '#38b26f' },
  { key: 'usw', name: 'US Wholesale', dot: '#2fbf71', accounts: 2, units: 932, wholesale: '$19K', moq: '10%', moqTone: 'red', hit: '2/21', pct: (2 / 21) * 100, bar: '#38b26f' },
  { key: 'dist', name: 'Distributor', dot: '#3b82f6', accounts: 2, units: 12396, wholesale: '$112K', moq: '38%', moqTone: 'red', hit: '8/21', pct: (8 / 21) * 100, bar: '#3b82f6' },
];

/* ---------- SKU demand ---------- */
type Sku = { sku: string; name: string; usw: number; dist: number; ext: number | null; total: number; moq: number };
const skus: Sku[] = [
  { sku: '101-0385-BIS01-O/S', name: 'The GOAT', usw: 0, dist: 192, ext: null, total: 192, moq: 432 },
  { sku: '101-0443-GRY02-O/S', name: 'The Koala', usw: 0, dist: 192, ext: null, total: 192, moq: 432 },
  { sku: '101-2539-OIL01-O/S', name: 'Boss Trucker', usw: 0, dist: 192, ext: null, total: 192, moq: 432 },
  { sku: '101-2541-NVY01/MAR02-O/S', name: 'Freedom Eagle Trucker', usw: 0, dist: 192, ext: null, total: 192, moq: 432 },
  { sku: '101-0388-KHK01-O/S', name: 'The Farm', usw: 24, dist: 168, ext: null, total: 192, moq: 432 },
  { sku: '101-6612-BLK01-O/S', name: 'Wilderness Patch', usw: 12, dist: 120, ext: null, total: 132, moq: 288 },
  { sku: '101-7788-TAN01-O/S', name: 'Coastal Snapback', usw: 60, dist: 240, ext: null, total: 300, moq: 300 },
  { sku: '101-3390-GRN02-O/S', name: 'Heritage Wool', usw: 0, dist: 96, ext: null, total: 96, moq: 216 },
  { sku: '101-9021-RED01-O/S', name: 'Trailblazer', usw: 100, dist: 300, ext: null, total: 400, moq: 360 },
  { sku: '101-4417-PNK01-O/S', name: 'Desert Rose', usw: 0, dist: 144, ext: null, total: 144, moq: 432 },
  { sku: '101-5150-CHR01-O/S', name: 'Night Owl', usw: 36, dist: 156, ext: null, total: 192, moq: 432 },
  { sku: '101-8834-OLV01-O/S', name: 'Summit Camp', usw: 0, dist: 108, ext: null, total: 108, moq: 288 },
];

/* ---------- orders ---------- */
type Order = { id: string; customer: string; email: string; channel: 'USW' | 'DIST'; units: number; wholesale: number; status: 'Confirmed' | 'Draft' | 'Submitted' | 'Released' };
const orders: Order[] = [
  { id: '#444', customer: 'Buckle Inc., The', email: 'ladawna.richards@buckle.com', channel: 'USW', units: 432, wholesale: 8618.4, status: 'Confirmed' },
  { id: '#443', customer: 'Industrias Mercury, S.A.', email: 'diego@mercury.com.es', channel: 'DIST', units: 1968, wholesale: 17736, status: 'Confirmed' },
  { id: '#442', customer: 'Buckle Inc., The', email: 'ladawna.richards@buckle.com', channel: 'USW', units: 500, wholesale: 9975, status: 'Confirmed' },
  { id: '#441', customer: 'SASAtrend', email: 'judith@sasatrend.com, tilo@sasatrend.com, san...', channel: 'DIST', units: 10428, wholesale: 94080, status: 'Confirmed' },
];

/* ---------- setup ---------- */
const setupDrops = [
  { label: 'Drop 1', status: 'CLOSED', date: '07-20-2026', usw: '01-15-2027 → 01-30-2027', dist: '11-04-2026 → 11-11-2026' },
  { label: 'Drop 2', status: 'CLOSED', date: '08-22-2026', usw: '02-12-2027 → 02-27-2027', dist: '12-02-2026 → 12-09-2026' },
  { label: 'Drop 3', status: '8D LEFT', date: '09-21-2026', usw: '03-19-2027 → 04-03-2027', dist: '01-06-2027 → 01-13-2027', active: true },
];
const productGroups = [
  { name: 'SS27 - US & INTL B2B', count: 203, chips: ['Majors', 'Boutiques', 'Distributors'] },
  { name: 'SS27 - Lids SMU', count: 13, chips: ['Lids'] },
];

function Fill({ total, moq }: { total: number; moq: number }) {
  const pct = Math.min(100, Math.round((total / moq) * 100));
  const hit = total >= moq;
  return (
    <span className="pb-fill">
      <span className="pb-fill-track"><i className={hit ? 'hit' : 'under'} style={{ width: `${Math.max(6, pct)}%` }} /></span>
      <em>{pct}%</em>
    </span>
  );
}

export default function PreBookPage({ onNavigate }: Props) {
  void onNavigate;
  const toast = useToast();
  const [tab, setTab] = useState<'review' | 'setup'>('review');
  const [subTab, setSubTab] = useState<'demand' | 'orders'>('demand');
  const [demandFilter, setDemandFilter] = useState<'all' | 'hit' | 'under'>('under');
  const [orderFilter, setOrderFilter] = useState<'All' | 'Draft' | 'Submitted' | 'Confirmed' | 'Released'>('All');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [consOpen, setConsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [skuQuery, setSkuQuery] = useState('');
  const [orderQuery, setOrderQuery] = useState('');
  const [activeDrop, setActiveDrop] = useState('drop3');

  const demandRows = useMemo(() => {
    const q = skuQuery.trim().toLowerCase();
    return skus.filter((s) => {
      const hit = s.total >= s.moq;
      if (demandFilter === 'hit' && !hit) return false;
      if (demandFilter === 'under' && hit) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.sku.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [demandFilter, skuQuery]);

  const orderRows = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderFilter !== 'All' && o.status !== orderFilter) return false;
      if (q && !o.customer.toLowerCase().includes(q) && !o.id.includes(q)) return false;
      return true;
    });
  }, [orderFilter, orderQuery]);

  const totalUnits = skus.reduce((t, s) => t + s.total, 0);
  const atOrAbove = skus.filter((s) => s.total >= s.moq).length;
  const ordUnits = orders.reduce((t, o) => t + o.units, 0);
  const ordWhsl = orders.reduce((t, o) => t + o.wholesale, 0);

  const runAction = (label: string, tone?: 'info' | 'error') => { toast(label, tone ?? 'success'); setActionsOpen(false); };

  return (
    <div className="pb" data-testid="prebook-page">
      {/* top bar */}
      <div className="pb-topbar">
        <div className="pb-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'review'} className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')} data-testid="pb-tab-review">Review</button>
          <button role="tab" aria-selected={tab === 'setup'} className={tab === 'setup' ? 'active' : ''} onClick={() => setTab('setup')} data-testid="pb-tab-setup">Setup</button>
        </div>
        <button className="pb-ghost-btn" onClick={() => toast('Exporting all drops…')} data-testid="pb-export-all"><Download size={15} /> Export all drops</button>
      </div>

      <div className="pb-body">
        {/* sidebar */}
        <aside className="pb-side">
          <div className="pb-side-head"><span>{tab === 'setup' ? 'Pre-book Collections' : 'Seasons'}</span>{tab === 'review' && <button className="pb-side-add" aria-label="Add season"><Plus size={15} /></button>}</div>
          {tab === 'review' ? (
            <div className="pb-season">
              <div className="pb-season-head"><ChevronDown size={15} /><strong>SS27</strong><em className="pb-badge closing">Closing</em></div>
              <div className="pb-drops">
                {seasonDrops.map((d) => (
                  <button key={d.id} className={`pb-drop-item ${activeDrop === d.id ? 'active' : ''} ${d.status}`} onClick={() => setActiveDrop(d.id)} data-testid={`pb-drop-${d.id}`}>
                    <FolderClosed size={15} />
                    <span>{d.label}</span>
                    {d.status === 'open' ? <em className="pb-drop-open">OPEN <b>{d.count}</b></em> : <em className="pb-drop-closed">CLOSED</em>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button className="pb-coll active"><Circle size={9} fill="currentColor" /> SS27</button>
          )}
          <div className="pb-side-foot">
            {tab === 'review'
              ? <><label className="pb-archive"><input type="checkbox" /> Show archived</label><span>3 drops</span></>
              : <><button className="pb-foot-link"><Plus size={14} /> New Pre-Book</button><button className="pb-foot-link muted">Enable existing</button></>}
          </div>
        </aside>

        {/* main */}
        <main className="pb-main">
          {tab === 'review' ? (
            <>
              {/* drop header */}
              <div className="pb-drop-head">
                <div className="pb-drop-title">
                  <span className="pb-live" /><strong>SS27 <span>/ Drop 3</span></strong>
                  <span className="pb-deadline"><Calendar size={15} /> Deadline 9/21/2026</span>
                  <em className="pb-open-pill">OPEN</em>
                </div>
                <div className="pb-drop-actions">
                  <button className="pb-more" aria-label="More"><MoreHorizontal size={18} /></button>
                  <div className="pb-actions-wrap">
                    <button className="pb-actions-btn" onClick={() => setActionsOpen((v) => !v)} data-testid="pb-actions-btn"><Zap size={15} /> Actions <ChevronDown size={14} /></button>
                    {actionsOpen && (
                      <>
                        <div className="pb-menu-backdrop" onClick={() => setActionsOpen(false)} />
                        <div className="pb-menu" role="menu" data-testid="pb-actions-menu">
                          <p className="pb-menu-head">No orders selected</p>
                          <button className="pb-menu-item" onClick={() => runAction('Released all confirmed orders.')}><Send size={16} /> Release all confirmed</button>
                          <button className="pb-menu-item danger" onClick={() => runAction('Cancelled below-MOQ items.', 'error')}><Ban size={16} /> Cancel below-MOQ items</button>
                          <button className="pb-menu-item" onClick={() => runAction('Restored auto-cancelled items.', 'info')}><RotateCcw size={16} /> Restore auto-cancelled items</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ready strip */}
              <div className="pb-ready"><CheckCircle2 size={17} /><span>Ready for customer visibility</span><em>READY</em></div>

              {/* purchasing preview */}
              <div className="pb-preview" data-testid="pb-preview">
                <div className="pb-preview-row">
                  <div><strong>Purchasing preview</strong> <span className="pb-preview-meta">4 standard · 0 consolidated</span> <span className="pb-preview-warn">No POs created · consolidated release blocked</span></div>
                  <button className="pb-details" onClick={() => setPreviewOpen((v) => !v)} data-testid="pb-preview-details">Details</button>
                </div>
                {previewOpen && (
                  <div className="pb-preview-body">
                    <p className="pb-preview-note">Sales channel: Not configured — freeze is unavailable</p>
                    <button className="pb-cons" onClick={() => setConsOpen((v) => !v)}>Consolidation details · 4 standard / 0 consolidated <ChevronDown size={16} className={consOpen ? 'flip' : ''} /></button>
                    {consOpen && <div className="pb-cons-body">Standard orders are ready to release individually. No consolidated PO buckets exist for this drop.</div>}
                    <button className="pb-freeze" disabled>Freeze batch for review</button>
                    <p className="pb-preview-legend"><b className="ok">Standard</b> 4 releasable orders <span className="sep">·</span> <b className="warn">Consolidated</b> 0 blocked orders · 0 PO buckets</p>
                  </div>
                )}
              </div>

              {/* stat cards */}
              <div className="pb-stats">
                {statCards.map((c) => (
                  <div className={`pb-stat pb-stat--${c.key}`} key={c.key} data-testid={`pb-stat-${c.key}`}>
                    <div className="pb-stat-head"><span className="pb-stat-name"><i style={{ background: c.dot }} />{c.name}</span><span className="pb-stat-acc">{c.accounts} accounts</span></div>
                    <div className="pb-stat-metrics">
                      <div className="pb-metric"><small>Units</small><strong>{c.units.toLocaleString()}</strong></div>
                      <div className="pb-metric"><small>Wholesale</small><strong className="green">{c.wholesale}</strong></div>
                      <div className="pb-metric"><small>MOQ rate</small><strong className={c.moqTone}>{c.moq}</strong></div>
                    </div>
                    <div className="pb-moq"><span>MOQ hit</span><div className="pb-moq-bar"><i style={{ width: `${c.pct}%`, background: c.bar }} /></div><em>{c.hit}</em></div>
                  </div>
                ))}
              </div>

              {/* panel */}
              <section className="pb-panel">
                <div className="pb-panel-head">
                  <div className="pb-panel-tabs">
                    <button className={subTab === 'demand' ? 'active' : ''} onClick={() => setSubTab('demand')} data-testid="pb-subtab-demand">SKU Demand{subTab === 'orders' ? ` (${skus.length})` : ''}</button>
                    <button className={subTab === 'orders' ? 'active' : ''} onClick={() => setSubTab('orders')} data-testid="pb-subtab-orders">Orders{subTab === 'demand' ? '' : ''} <b className="pb-count">{orders.length}</b></button>
                    {subTab === 'demand'
                      ? <><span className="pb-panel-num">{atOrAbove}/{skus.length}</span><button className="pb-ext" onClick={() => toast('Import external volume')}><Upload size={14} /> External volume</button></>
                      : null}
                  </div>
                  <div className="pb-panel-tools">
                    {subTab === 'demand' ? (
                      <div className="pb-seg3" role="tablist">
                        {(['all', 'hit', 'under'] as const).map((f) => (
                          <button key={f} className={demandFilter === f ? 'active' : ''} onClick={() => setDemandFilter(f)} data-testid={`pb-demand-${f}`}>{f[0].toUpperCase() + f.slice(1)}</button>
                        ))}
                      </div>
                    ) : (
                      <div className="pb-seg5" role="tablist">
                        {(['All', 'Draft', 'Submitted', 'Confirmed', 'Released'] as const).map((f) => (
                          <button key={f} className={orderFilter === f ? 'active' : ''} onClick={() => setOrderFilter(f)}>{f}</button>
                        ))}
                      </div>
                    )}
                    <label className="pb-search"><Search size={15} /><input value={subTab === 'demand' ? skuQuery : orderQuery} onChange={(e) => (subTab === 'demand' ? setSkuQuery : setOrderQuery)(e.target.value)} placeholder={subTab === 'demand' ? 'Search SKUs...' : 'Search orders...'} data-testid="pb-panel-search" /></label>
                    {subTab === 'demand' && <button className="pb-ghost-btn" onClick={() => toast('Downloading…')}><Download size={15} /> Download</button>}
                  </div>
                </div>

                {subTab === 'demand' ? (
                  <div className="pb-table pb-table--demand">
                    <div className="pb-tr pb-th">
                      <span>SKU</span><span>Name</span><span className="r">USW</span><span className="r">DIST</span><span className="r">EXT</span><span className="r">Total</span><span className="r">MOQ</span><span>Fill</span><span>Status</span><span />
                    </div>
                    {demandRows.map((s) => {
                      const hit = s.total >= s.moq;
                      const open = expanded === s.sku;
                      return (
                        <div key={s.sku} className={`pb-row-wrap ${open ? 'is-open' : ''}`}>
                          <div className="pb-tr pb-row" onClick={() => setExpanded(open ? null : s.sku)} data-testid={`pb-sku-row-${s.sku}`}>
                            <span className="pb-sku-code"><ChevronRight size={14} className={open ? 'flip' : ''} />{s.sku}</span>
                            <span className="pb-sku-name">{s.name}</span>
                            <span className="r pb-mut">{s.usw}</span>
                            <span className="r">{s.dist}</span>
                            <span className="r pb-mut">{s.ext ?? '—'}</span>
                            <span className="r pb-strong">{s.total.toLocaleString()}</span>
                            <span className="r pb-mut">{s.moq}</span>
                            <Fill total={s.total} moq={s.moq} />
                            <span><em className={`pb-status ${hit ? 'hit' : 'under'}`}>{hit ? 'At MOQ' : 'Under MOQ'}</em></span>
                            <span />
                          </div>
                          {open && (
                            <div className="pb-sku-expand" data-testid={`pb-sku-expand-${s.sku}`}>
                              Size run O/S · {s.total.toLocaleString()} units committed · MOQ {s.moq} · {hit ? 'MOQ satisfied' : `needs ${(s.moq - s.total).toLocaleString()} more units to hit MOQ`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pb-foot"><b>{skus.length} SKUs</b><span>{totalUnits.toLocaleString()} total units</span><span className="pb-foot-sep">|</span><span>{atOrAbove} at or above MOQ</span></div>
                  </div>
                ) : (
                  <div className="pb-table pb-table--orders">
                    <div className="pb-tr pb-oth">
                      <span className="pb-check"><input type="checkbox" aria-label="Select all" /></span>
                      <span>Order</span><span>Customer</span><span>Channel</span><span className="r">Units</span><span className="r">Wholesale</span><span>SO#</span><span>Status</span><span />
                    </div>
                    {orderRows.map((o) => (
                      <div key={o.id} className="pb-tr pb-orow" data-testid={`pb-order-row-${o.id.replace('#', '')}`}>
                        <span className="pb-check"><input type="checkbox" aria-label={`Select ${o.id}`} /></span>
                        <span className="pb-oid"><ChevronRight size={14} />{o.id}</span>
                        <span className="pb-ocust"><b>{o.customer}</b><small>{o.email}</small></span>
                        <span><em className={`pb-channel ${o.channel.toLowerCase()}`}>{o.channel}</em></span>
                        <span className="r pb-strong">{o.units.toLocaleString()}</span>
                        <span className="r pb-strong">{money(o.wholesale)}</span>
                        <span className="pb-mut">—</span>
                        <span><em className="pb-ostatus"><i />{o.status}</em></span>
                        <span className="pb-omenu"><button aria-label="Row actions"><MoreHorizontal size={16} /></button></span>
                      </div>
                    ))}
                    <div className="pb-foot"><b>{orders.length} orders</b><span>{ordUnits.toLocaleString()} units</span><span className="pb-foot-sep">|</span><span>{money(ordWhsl)} wholesale</span><span className="pb-foot-upd">Updated just now</span></div>
                  </div>
                )}
              </section>
            </>
          ) : (
            /* ---------- SETUP ---------- */
            <div className="pb-setup">
              <h1 className="pb-setup-h"><Circle size={12} fill="currentColor" /> SS27</h1>

              <section className="pb-card">
                <div className="pb-card-head"><span className="pb-card-title"><Calendar size={16} /> Pre-book Drops <b className="pb-count dark">3</b></span><button className="pb-dark-btn" onClick={() => toast('New drop')}><Plus size={15} /> New drop</button></div>
                <div className="pb-drows">
                  {setupDrops.map((d) => (
                    <div className={`pb-drow ${d.active ? 'active' : ''}`} key={d.label}>
                      <div className="pb-drow-name"><strong>{d.label}</strong><em className={`pb-badge ${d.active ? 'left' : 'closed'}`}>{d.status}</em><small><Calendar size={12} /> {d.date}</small></div>
                      <div className="pb-drow-moq"><small>MOQ</small><span>default</span></div>
                      <div className="pb-drow-range"><small><i className="usw" /> US Wholesale</small><b>{d.usw}</b></div>
                      <div className="pb-drow-range"><small><i className="dist" /> Distributor</small><b>{d.dist}</b></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pb-card">
                <div className="pb-card-head"><span className="pb-card-title"><FolderClosed size={16} /> Product Groups <b className="pb-count dark">{productGroups.length}</b></span><button className="pb-dark-btn" onClick={() => toast('Add product group')}><Plus size={15} /> Add product group</button></div>
                <p className="pb-groups-note">Optional — split this pre-book into product groups, each visible only to its assigned customer groups. With no product groups, standard customer-group rules apply.</p>
                {productGroups.map((g) => (
                  <div className="pb-group" key={g.name}>
                    <div className="pb-group-top"><strong>{g.name}</strong><em className="pb-count-pill">{g.count} products</em></div>
                    <div className="pb-group-chips">{g.chips.map((c) => <span key={c}>{c}</span>)}</div>
                  </div>
                ))}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
