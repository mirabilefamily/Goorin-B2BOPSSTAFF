import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Copy,
  Download,
  FolderClosed,
  Layers,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Snowflake,
  Trash2,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import './prebookreview.css';

type Props = { onNavigate: (label: string) => void };

/* ---------- seasons / drops ---------- */
const seasonDrops = [
  { id: 'drop1', label: 'Drop 1', status: 'closed' as const },
  { id: 'drop2', label: 'Drop 2', status: 'closed' as const },
  { id: 'drop3', label: 'Drop 3', status: 'open' as const, count: 21 },
];

const statCards = [
  { key: 'combined', name: 'Total Combined', dot: '#e9ece9', accounts: 4, units: 13328, wholesale: '$130K', moq: '43%', moqTone: 'amber', hit: '9/21', pct: (9 / 21) * 100, bar: '#38b26f' },
  { key: 'usw', name: 'US Wholesale', dot: '#2fbf71', accounts: 2, units: 932, wholesale: '$19K', moq: '10%', moqTone: 'red', hit: '2/21', pct: (2 / 21) * 100, bar: '#38b26f' },
  { key: 'dist', name: 'Distributor', dot: '#3b82f6', accounts: 2, units: 12396, wholesale: '$112K', moq: '38%', moqTone: 'red', hit: '8/21', pct: (8 / 21) * 100, bar: '#3b82f6' },
];

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

type OLine = { name: string; qty: number };
type Order = { id: string; customer: string; email: string; channel: 'USW' | 'DIST'; units: number; wholesale: number; status: 'Confirmed' | 'Draft' | 'Submitted' | 'Released'; lines: OLine[] };
const orders: Order[] = [
  { id: '#444', customer: 'Buckle Inc., The', email: 'ladawna.richards@buckle.com', channel: 'USW', units: 432, wholesale: 8618.4, status: 'Confirmed', lines: [{ name: 'The GOAT', qty: 216 }, { name: 'The Koala', qty: 216 }] },
  { id: '#443', customer: 'Industrias Mercury, S.A.', email: 'diego@mercury.com.es', channel: 'DIST', units: 1968, wholesale: 17736, status: 'Confirmed', lines: [{ name: 'Boss Trucker', qty: 984 }, { name: 'Freedom Eagle Trucker', qty: 984 }] },
  { id: '#442', customer: 'Buckle Inc., The', email: 'ladawna.richards@buckle.com', channel: 'USW', units: 500, wholesale: 9975, status: 'Confirmed', lines: [{ name: 'Coastal Snapback', qty: 300 }, { name: 'Trailblazer', qty: 200 }] },
  { id: '#441', customer: 'SASAtrend', email: 'judith@sasatrend.com, tilo@sasatrend.com, san...', channel: 'DIST', units: 10428, wholesale: 94080, status: 'Confirmed', lines: [{ name: 'The Farm', qty: 3600 }, { name: 'Night Owl', qty: 3600 }, { name: 'Desert Rose', qty: 3228 }] },
];

const initialSetupDrops = [
  { id: 'd1', label: 'Drop 1', status: 'CLOSED', date: '07-20-2026', moq: 'default', usw: '01-15-2027 → 01-30-2027', dist: '11-04-2026 → 11-11-2026', active: false },
  { id: 'd2', label: 'Drop 2', status: 'CLOSED', date: '08-22-2026', moq: 'default', usw: '02-12-2027 → 02-27-2027', dist: '12-02-2026 → 12-09-2026', active: false },
  { id: 'd3', label: 'Drop 3', status: '8D LEFT', date: '09-21-2026', moq: 'default', usw: '03-19-2027 → 04-03-2027', dist: '01-06-2027 → 01-13-2027', active: true },
];
const initialGroups = [
  { id: 'g1', name: 'SS27 - US & INTL B2B', count: 203, chips: ['Majors', 'Boutiques', 'Distributors'] },
  { id: 'g2', name: 'SS27 - Lids SMU', count: 13, chips: ['Lids'] },
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

/* editable product-group card (Setup) */
function GroupCard({ g, onRemove, onAddChip, onRemoveChip }: any) {
  const [draft, setDraft] = useState('');
  return (
    <div className="pb-group" data-testid={`pb-group-${g.id}`}>
      <div className="pb-group-top">
        <strong>{g.name}</strong>
        <em className="pb-count-pill">{g.count} products</em>
        <button className="pb-group-remove" onClick={() => onRemove(g.id)} aria-label="Remove group" data-testid={`pb-group-remove-${g.id}`}><Trash2 size={14} /></button>
      </div>
      <div className="pb-group-chips">
        {g.chips.map((c: string) => (
          <span key={c} className="pb-chip">{c}<button onClick={() => onRemoveChip(g.id, c)} aria-label={`Remove ${c}`}><X size={11} /></button></span>
        ))}
        <input
          className="pb-chip-input"
          value={draft}
          placeholder="+ customer group"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { onAddChip(g.id, draft.trim()); setDraft(''); } }}
          data-testid={`pb-group-chip-input-${g.id}`}
        />
      </div>
    </div>
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [consOpen, setConsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [skuQuery, setSkuQuery] = useState('');
  const [orderQuery, setOrderQuery] = useState('');
  const [activeDrop, setActiveDrop] = useState('drop3');

  // setup state
  const [setupDrops, setSetupDrops] = useState(initialSetupDrops);
  const [groups, setGroups] = useState(initialGroups);
  const [editDrop, setEditDrop] = useState<string | null>(null);
  const [collections, setCollections] = useState(['SS27']);
  const [activeColl, setActiveColl] = useState('SS27');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setActionsOpen(false); setMoreOpen(false); setRowMenu(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
  const daysLeft = Math.max(0, Math.ceil((new Date(2026, 8, 21).getTime() - Date.now()) / 86_400_000));
  const selCount = selected.size;

  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (s.size === orderRows.length ? new Set() : new Set(orderRows.map((o) => o.id))));
  const runAction = (label: string, tone?: 'info' | 'error') => { toast(label, tone ?? 'success'); setActionsOpen(false); setSelected(new Set()); };
  const runMore = (label: string, tone?: 'info' | 'error') => { toast(label, tone ?? 'info'); setMoreOpen(false); };

  const addDrop = () => setSetupDrops((d) => [...d, { id: `d${Date.now()}`, label: `Drop ${d.length + 1}`, status: 'DRAFT', date: '—', moq: 'default', usw: '— → —', dist: '— → —', active: false }]);
  const removeDrop = (id: string) => { setSetupDrops((d) => d.filter((x) => x.id !== id)); toast('Drop removed.', 'info'); };
  const patchDrop = (id: string, patch: any) => setSetupDrops((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const addGroup = () => setGroups((g) => [...g, { id: `g${Date.now()}`, name: `New product group ${g.length + 1}`, count: 0, chips: [] }]);
  const removeGroup = (id: string) => setGroups((g) => g.filter((x) => x.id !== id));
  const addChip = (id: string, chip: string) => setGroups((g) => g.map((x) => (x.id === id && !x.chips.includes(chip) ? { ...x, chips: [...x.chips, chip] } : x)));
  const removeChip = (id: string, chip: string) => setGroups((g) => g.map((x) => (x.id === id ? { ...x, chips: x.chips.filter((c) => c !== chip) } : x)));

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
          <div className="pb-side-head"><span>{tab === 'setup' ? 'Pre-book Collections' : 'Seasons'}</span>{tab === 'review' && <button className="pb-side-add" aria-label="Add season" onClick={() => toast('New season')}><Plus size={15} /></button>}</div>
          {tab === 'review' ? (
            <div className="pbx-season">
              <div className="pbx-season-head"><ChevronDown size={15} /><strong>SS27</strong><em className="pb-badge closing">Closing</em></div>
              <div className="pbx-drops">
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
            <div className="pb-colls">
              {collections.map((c) => (
                <button key={c} className={`pb-coll ${activeColl === c ? 'active' : ''}`} onClick={() => setActiveColl(c)} data-testid={`pb-coll-${c}`}><Circle size={9} fill="currentColor" /> {c}</button>
              ))}
            </div>
          )}
          <div className="pb-side-foot">
            {tab === 'review'
              ? <><label className="pb-archive"><input type="checkbox" /> Show archived</label><span>{setupDrops.length} drops</span></>
              : <><button className="pb-foot-link" onClick={() => { const n = `SS${28 + collections.length - 1}`; setCollections((c) => [...c, n]); setActiveColl(n); toast(`Created ${n}`); }} data-testid="pb-new-prebook"><Plus size={14} /> New Pre-Book</button><button className="pb-foot-link muted" onClick={() => toast('Enable existing pre-book')}>Enable existing</button></>}
          </div>
        </aside>

        {/* main */}
        <main className="pb-main">
          {tab === 'review' ? (
            <>
              {/* drop header */}
              <div className="pbx-drop-head">
                <div className="pbx-drop-title">
                  <span className="pb-live" />
                  <div className="pb-drop-idblock">
                    <div className="pb-drop-idtop"><strong>SS27 <span>/ Drop 3</span></strong><em className="pb-open-pill">OPEN</em></div>
                    <span className="pbx-deadline"><Calendar size={14} /> Deadline 9/21/2026 <em className="pbx-days">{daysLeft} days left</em></span>
                  </div>
                </div>
                <div className="pb-drop-actions">
                  <div className="pb-more-wrap">
                    <button className="pb-more" aria-label="More" onClick={() => { setMoreOpen((v) => !v); setActionsOpen(false); }} data-testid="pb-more-btn"><MoreHorizontal size={18} /></button>
                    {moreOpen && (
                      <>
                        <div className="pb-menu-backdrop" onClick={() => setMoreOpen(false)} />
                        <div className="pb-menu pb-menu--left" role="menu" data-testid="pb-more-menu">
                          <button className="pb-menu-item" onClick={() => runMore('Editing drop details…')}><Pencil size={16} /> Edit drop details</button>
                          <button className="pb-menu-item" onClick={() => runMore('Drop duplicated.')}><Copy size={16} /> Duplicate drop</button>
                          <button className="pb-menu-item" onClick={() => runMore('Exporting this drop…')}><Download size={16} /> Export this drop</button>
                          <div className="pb-menu-sep" />
                          <button className="pb-menu-item danger" onClick={() => runMore('Drop archived.', 'error')}><Archive size={16} /> Archive drop</button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="pb-actions-wrap">
                    <button className="pb-actions-btn" onClick={() => { setActionsOpen((v) => !v); setMoreOpen(false); }} data-testid="pb-actions-btn"><Zap size={15} /> Actions{selCount > 0 && <b className="pb-actions-count">{selCount}</b>} <ChevronDown size={14} /></button>
                    {actionsOpen && (
                      <>
                        <div className="pb-menu-backdrop" onClick={() => setActionsOpen(false)} />
                        <div className="pb-menu" role="menu" data-testid="pb-actions-menu">
                          <p className="pb-menu-head">{selCount > 0 ? `${selCount} order${selCount === 1 ? '' : 's'} selected` : 'No orders selected'}</p>
                          <button className="pb-menu-item" onClick={() => runAction(selCount > 0 ? `Released ${selCount} selected order${selCount === 1 ? '' : 's'}.` : 'Released all confirmed orders.')}><Send size={16} /> {selCount > 0 ? 'Release selected' : 'Release all confirmed'}</button>
                          <button className="pb-menu-item" onClick={() => runAction('Batch frozen for review.')}><Snowflake size={16} /> Freeze batch for review</button>
                          <div className="pb-menu-sep" />
                          <button className="pb-menu-item danger" onClick={() => runAction('Cancelled below-MOQ items.', 'error')}><Ban size={16} /> Cancel below-MOQ items</button>
                          <button className="pb-menu-item" onClick={() => runAction('Restored auto-cancelled items.', 'info')}><RotateCcw size={16} /> Restore auto-cancelled items</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* status row */}
              <div className="pbx-status-grid">
              <div className="pb-ready"><span className="pbx-ready-ico"><CheckCircle2 size={17} /></span><div><span>Ready for customer visibility</span><small>Drop is published to customer portals</small></div><em>READY</em></div>

              {/* purchasing preview */}
              <div className={`pb-preview ${previewOpen ? 'is-open' : ''}`} data-testid="pb-preview">
                <div className="pb-preview-row">
                  <div className="pb-preview-lead">
                    <span className="pb-preview-ico"><Layers size={16} /></span>
                    <div><strong>Purchasing preview</strong> <span className="pb-preview-meta">4 standard · 0 consolidated</span><div className="pb-preview-warn">No POs created · consolidated release blocked</div></div>
                  </div>
                  <button className="pb-details" onClick={() => setPreviewOpen((v) => !v)} data-testid="pb-preview-details">Details <ChevronDown size={14} className={previewOpen ? 'flip' : ''} /></button>
                </div>
                {previewOpen && (
                  <div className="pb-preview-body">
                    <p className="pb-preview-note"><Lock size={13} /> Sales channel: Not configured — freeze is unavailable</p>
                    <button className="pb-cons" onClick={() => setConsOpen((v) => !v)} data-testid="pb-cons-toggle">Consolidation details · 4 standard / 0 consolidated <ChevronDown size={16} className={consOpen ? 'flip' : ''} /></button>
                    {consOpen && (
                      <div className="pb-cons-table" data-testid="pb-cons-table">
                        <div className="pb-cons-tr pb-cons-th"><span>Order</span><span>Channel</span><span>Type</span><span className="r">Units</span><span>PO</span></div>
                        {orders.map((o) => (
                          <div className="pb-cons-tr" key={o.id}><span>{o.id}</span><span><em className={`pb-channel ${o.channel.toLowerCase()}`}>{o.channel}</em></span><span>Standard</span><span className="r">{o.units.toLocaleString()}</span><span className="pb-mut">Not created</span></div>
                        ))}
                      </div>
                    )}
                    <button className="pb-freeze" disabled title="Configure a sales channel to enable"><Snowflake size={15} /> Freeze batch for review</button>
                    <p className="pb-preview-legend"><b className="ok">Standard</b> 4 releasable orders <span className="sep">·</span> <b className="warn">Consolidated</b> 0 blocked orders · 0 PO buckets</p>
                  </div>
                )}
              </div>

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
                    <div className="pbx-moq"><span>MOQ hit <b>{Math.round(c.pct)}%</b></span><div className="pbx-moq-bar"><i style={{ width: `${c.pct}%`, background: c.bar }} /></div><em>{c.hit} SKUs</em></div>
                  </div>
                ))}
              </div>

              {/* panel */}
              <section className="pb-panel">
                <div className="pb-panel-head">
                  <div className="pb-panel-tabs">
                    <button className={subTab === 'demand' ? 'active' : ''} onClick={() => setSubTab('demand')} data-testid="pb-subtab-demand">SKU Demand{subTab === 'orders' ? ` (${skus.length})` : ''}</button>
                    <button className={subTab === 'orders' ? 'active' : ''} onClick={() => setSubTab('orders')} data-testid="pb-subtab-orders">Orders <b className="pb-count">{orders.length}</b></button>
                    {subTab === 'demand' && <><span className="pb-panel-num">{atOrAbove}/{skus.length}</span><button className="pb-ext" onClick={() => toast('Import external volume')} data-testid="pb-ext-btn"><Upload size={14} /> External volume</button></>}
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
                  <div className="pbx-table pbx-table--demand">
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
                              <div className="pb-sku-breakdown">
                                <div><small>US Wholesale</small><b>{s.usw}</b></div>
                                <div><small>Distributor</small><b>{s.dist}</b></div>
                                <div><small>External</small><b>{s.ext ?? 0}</b></div>
                                <div><small>MOQ target</small><b>{s.moq}</b></div>
                                <div><small>Gap to MOQ</small><b className={hit ? 'ok' : 'warn'}>{hit ? 'Met' : `-${(s.moq - s.total).toLocaleString()}`}</b></div>
                              </div>
                              <p className="pb-sku-note">Size run O/S · {s.total.toLocaleString()} units committed · {hit ? 'MOQ satisfied — releasable.' : `needs ${(s.moq - s.total).toLocaleString()} more units to hit MOQ.`}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pb-foot"><b>{skus.length} SKUs</b><span>{totalUnits.toLocaleString()} total units</span><span className="pb-foot-sep">|</span><span>{atOrAbove} at or above MOQ</span></div>
                  </div>
                ) : (
                  <div className="pbx-table pbx-table--orders">
                    <div className="pb-tr pb-oth">
                      <span className="pb-check"><input type="checkbox" aria-label="Select all" checked={selCount > 0 && selCount === orderRows.length} onChange={toggleAll} data-testid="pb-order-selectall" /></span>
                      <span>Order</span><span>Customer</span><span>Channel</span><span className="r">Units</span><span className="r">Wholesale</span><span>SO#</span><span>Status</span><span />
                    </div>
                    {orderRows.map((o) => {
                      const oid = o.id.replace('#', '');
                      const isOpen = expandedOrder === o.id;
                      return (
                        <div key={o.id} className={`pb-row-wrap ${selected.has(o.id) ? 'selected' : ''} ${isOpen ? 'is-open' : ''}`}>
                          <div className="pb-tr pb-orow" data-testid={`pb-order-row-${oid}`}>
                            <span className="pb-check"><input type="checkbox" aria-label={`Select ${o.id}`} checked={selected.has(o.id)} onChange={() => toggleSel(o.id)} data-testid={`pb-order-check-${oid}`} /></span>
                            <span className="pb-oid" onClick={() => setExpandedOrder(isOpen ? null : o.id)}><ChevronRight size={14} className={isOpen ? 'flip' : ''} />{o.id}</span>
                            <span className="pb-ocust" onClick={() => setExpandedOrder(isOpen ? null : o.id)}><b>{o.customer}</b><small>{o.email}</small></span>
                            <span><em className={`pb-channel ${o.channel.toLowerCase()}`}>{o.channel}</em></span>
                            <span className="r pb-strong">{o.units.toLocaleString()}</span>
                            <span className="r pb-strong">{money(o.wholesale)}</span>
                            <span className="pb-mut">—</span>
                            <span><em className="pb-ostatus"><i />{o.status}</em></span>
                            <span className="pb-omenu">
                              <button aria-label="Row actions" onClick={() => setRowMenu(rowMenu === o.id ? null : o.id)} data-testid={`pb-order-menu-${oid}`}><MoreHorizontal size={16} /></button>
                              {rowMenu === o.id && (
                                <>
                                  <div className="pb-menu-backdrop" onClick={() => setRowMenu(null)} />
                                  <div className="pb-menu pb-menu--row" role="menu">
                                    <button className="pb-menu-item" onClick={() => { toast(`Opening ${o.id}…`); setRowMenu(null); }}><Search size={15} /> View order</button>
                                    <button className="pb-menu-item" onClick={() => { toast(`Released ${o.id}.`); setRowMenu(null); }}><Send size={15} /> Release</button>
                                    <button className="pb-menu-item danger" onClick={() => { toast(`Cancelled ${o.id}.`, 'error'); setRowMenu(null); }}><Ban size={15} /> Cancel</button>
                                  </div>
                                </>
                              )}
                            </span>
                          </div>
                          {isOpen && (
                            <div className="pb-order-expand" data-testid={`pb-order-expand-${oid}`}>
                              {o.lines.map((l) => <div className="pb-oline" key={l.name}><span>{l.name}</span><b>{l.qty.toLocaleString()} units</b></div>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pb-foot"><b>{orders.length} orders</b><span>{ordUnits.toLocaleString()} units</span><span className="pb-foot-sep">|</span><span>{money(ordWhsl)} wholesale</span><span className="pb-foot-upd">Updated just now</span></div>
                  </div>
                )}
              </section>
            </>
          ) : (
            /* ---------- SETUP ---------- */
            <div className="pb-setup">
              <h1 className="pb-setup-h"><Circle size={12} fill="currentColor" /> {activeColl}</h1>

              <section className="pb-card">
                <div className="pb-card-head"><span className="pb-card-title"><Calendar size={16} /> Pre-book Drops <b className="pb-count dark">{setupDrops.length}</b></span><button className="pb-dark-btn" onClick={addDrop} data-testid="pb-new-drop"><Plus size={15} /> New drop</button></div>
                <div className="pb-drows">
                  {setupDrops.map((d) => {
                    const editing = editDrop === d.id;
                    return (
                      <div className={`pb-drow-wrap ${editing ? 'editing' : ''}`} key={d.id}>
                        <div className={`pb-drow ${d.active ? 'active' : ''}`} data-testid={`pb-setup-drop-${d.id}`}>
                          <div className="pb-drow-name" onClick={() => setEditDrop(editing ? null : d.id)}><strong>{d.label}</strong><em className={`pb-badge ${d.status === 'CLOSED' ? 'closed' : 'left'}`}>{d.status}</em><small><Calendar size={12} /> {d.date}</small></div>
                          <div className="pb-drow-moq"><small>MOQ</small><span>{d.moq}</span></div>
                          <div className="pb-drow-range"><small><i className="usw" /> US Wholesale</small><b>{d.usw}</b></div>
                          <div className="pb-drow-range"><small><i className="dist" /> Distributor</small><b>{d.dist}</b></div>
                          <div className="pb-drow-actions">
                            <button onClick={() => setEditDrop(editing ? null : d.id)} aria-label="Edit drop" data-testid={`pb-drop-edit-${d.id}`}><Pencil size={14} /></button>
                            <button className="danger" onClick={() => removeDrop(d.id)} aria-label="Remove drop" data-testid={`pb-drop-remove-${d.id}`}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {editing && (
                          <div className="pb-drow-edit" data-testid={`pb-drop-editform-${d.id}`}>
                            <label>MOQ policy<select value={d.moq} onChange={(e) => patchDrop(d.id, { moq: e.target.value })}><option value="default">default</option><option value="custom">custom</option><option value="none">none</option></select></label>
                            <label>US Wholesale window<input value={d.usw} onChange={(e) => patchDrop(d.id, { usw: e.target.value })} /></label>
                            <label>Distributor window<input value={d.dist} onChange={(e) => patchDrop(d.id, { dist: e.target.value })} /></label>
                            <button className="pb-dark-btn sm" onClick={() => { setEditDrop(null); toast(`${d.label} saved.`); }} data-testid={`pb-drop-save-${d.id}`}><Check size={14} /> Save</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="pb-card">
                <div className="pb-card-head"><span className="pb-card-title"><Users size={16} /> Product Groups <b className="pb-count dark">{groups.length}</b></span><button className="pb-dark-btn" onClick={addGroup} data-testid="pb-add-group"><Plus size={15} /> Add product group</button></div>
                <p className="pb-groups-note">Optional — split this pre-book into product groups, each visible only to its assigned customer groups. With no product groups, standard customer-group rules apply. Once any product group exists, products not in a group are hidden from customers.</p>
                {groups.map((g) => <GroupCard key={g.id} g={g} onRemove={removeGroup} onAddChip={addChip} onRemoveChip={removeChip} />)}
                {groups.length === 0 && <div className="pb-groups-empty">No product groups — standard customer-group rules apply.</div>}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
