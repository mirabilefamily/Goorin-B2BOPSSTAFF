import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Boxes, Check, CheckCircle2, ChevronRight, Download, Ship, FileText, Filter, Folder, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Send, SlidersHorizontal, Upload, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { IntlOpenOrders, OPEN_POS, poUnits, poValue, type PO } from './IntlOpenOrders';
import './ops.css';
import './intlshipments.css';

type Status = 'draft' | 'ready' | 'instructions' | 'prepayment' | 'prepaid' | 'shipped' | 'invoiced';
const STEPS: { id: Status; label: string }[] = [
  { id: 'draft', label: 'Draft' }, { id: 'ready', label: 'Ready' }, { id: 'instructions', label: 'Shipping Instructions' },
  { id: 'prepayment', label: 'Pre-payment' }, { id: 'prepaid', label: 'Released' }, { id: 'shipped', label: 'Shipped' }, { id: 'invoiced', label: 'Invoiced' },
];
const STATUS_LABEL: Record<Status, string> = { draft: 'Draft', ready: 'Ready', instructions: 'Instructions', prepayment: 'Awaiting prepayment', prepaid: 'Prepaid', shipped: 'Shipped', invoiced: 'Invoiced' };
type Line = { sku: string; so: string; po: string; desc: string; qty: number; unit: number };
type Msg = { id: number; who: string; me?: boolean; text: string; at: string };
type Shipment = {
  id: string; customer: string; buyer: string; factory: string; factoryEmail: string; status: Status; created: string; ship: string;
  currency: string; incoterms: string; lines: Line[]; booking: { method: string; forwarder: string; contact: string; mode: string; submitted: string };
  prepay: number; bookingDocs?: string[]; activity: { title: string; detail?: string; at: string; by: string }[]; msgs: Msg[]; docs: string[]; packing: string;
};
const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

const SEED: Shipment[] = [
  { id: 'IS-0012', customer: 'Mirabile Distribution', buyer: 'ryan.mirabile@me.com', factory: 'ASI Global Limited (China)', factoryEmail: 'ryan.mirabile@me.com', status: 'prepaid', created: '09-03-2026', ship: '01-06-2027', currency: 'USD', incoterms: 'FOB',
    lines: [{ sku: '101-0385-DEN01-O/S', so: 'SO58739', po: 'PO1299', desc: 'The GOAT', qty: 1, unit: 8.5 }, { sku: '101-0386-BLK01-O/S', so: 'SO58739', po: 'PO1299', desc: 'The Gorilla', qty: 1, unit: 8.5 }],
    booking: { method: 'Freight forwarder', forwarder: 'FF 123', contact: 'name@ff123.com · 3213444590 · USA', mode: 'Ocean', submitted: '09-03-2026, 12:48 AM' }, prepay: 8.5,
    activity: [
      { title: 'Customer message sent', detail: 'Customer replied in shipment chat', at: '09-11-2026, 3:29 AM', by: 'Ryan M' },
      { title: 'Status changed', detail: 'awaiting prepayment → prepaid — Prepayment received via Stripe — $8.50 USD', at: '09-03-2026, 12:49 AM', by: 'Stripe' },
      { title: 'Customer submitted booking', detail: 'Booking details submitted (ocean)', at: '09-03-2026, 12:48 AM', by: 'Ryan M' },
      { title: 'Packing list uploaded', detail: 'PL-PO1299-1.xlsx', at: '09-03-2026, 12:47 AM', by: 'Ryan Mirabile' },
      { title: 'Shipment created', at: '09-03-2026, 12:47 AM', by: 'Ryan Mirabile' },
    ],
    msgs: [{ id: 1, who: 'Ryan M', text: 'Booking confirmed with FF 123 — ocean, ETD mid-Dec.', at: '09-10-2026, 9:27 PM' }, { id: 2, who: 'Ryan Mirabile', me: true, text: 'Great — packing list is final. Releasing to factory once prepayment clears.', at: '09-10-2026, 9:31 PM' }, { id: 3, who: 'Ryan M', text: 'Prepayment sent via Stripe.', at: '09-11-2026, 3:28 AM' }],
    docs: ['Packing List (PDF)', 'Commercial Invoice (PDF)'], packing: 'PL-PO1299-1.xlsx' },
  { id: 'IS-0011', customer: 'SASAtrend', buyer: 'judith@sasatrend.com', factory: 'Hangzhou Headwear Co. (China)', factoryEmail: 'export@hzhw.cn', status: 'prepayment', created: '08-28-2026', ship: '12-12-2026', currency: 'USD', incoterms: 'FOB',
    lines: [{ sku: '101-9021-RED01-O/S', so: 'SO58702', po: 'PO1291', desc: 'Trailblazer', qty: 400, unit: 9.25 }, { sku: '101-7788-TAN01-O/S', so: 'SO58702', po: 'PO1291', desc: 'Coastal Snapback', qty: 300, unit: 8.9 }],
    booking: { method: 'Customer pickup', forwarder: '—', contact: '—', mode: 'Air', submitted: '—' }, prepay: 3182.5,
    activity: [{ title: 'Shipping instructions sent', detail: 'Awaiting prepayment', at: '08-29-2026, 10:02 AM', by: 'Ryan Mirabile' }, { title: 'Shipment created', at: '08-28-2026, 4:15 PM', by: 'Ryan Mirabile' }],
    msgs: [], docs: ['Packing List (PDF)'], packing: 'PL-PO1291-1.xlsx' },
  { id: 'IS-0010', customer: 'Industrias Mercury, S.A.', buyer: 'diego@mercury.com.es', factory: 'ASI Global Limited (China)', factoryEmail: 'ops@asiglobal.cn', status: 'shipped', created: '07-14-2026', ship: '09-02-2026', currency: 'USD', incoterms: 'CIF',
    lines: [{ sku: '101-6612-BLK01-O/S', so: 'SO58611', po: 'PO1270', desc: 'Wilderness Patch', qty: 1968, unit: 9.0 }],
    booking: { method: 'Freight forwarder', forwarder: 'Kuehne+Nagel', contact: 'madrid@kn.com · +34 91 000 000 · ES', mode: 'Ocean', submitted: '07-15-2026, 9:10 AM' }, prepay: 8856,
    activity: [{ title: 'Status changed', detail: 'released → shipped — BL received', at: '09-02-2026, 8:00 AM', by: 'Factory' }, { title: 'Shipment created', at: '07-14-2026, 11:20 AM', by: 'Ryan Mirabile' }],
    msgs: [{ id: 1, who: 'Diego R', text: 'Container departed Ningbo. Thanks!', at: '09-02-2026, 8:05 AM' }], docs: ['Packing List (PDF)', 'Commercial Invoice (PDF)', 'Bill of Lading (PDF)'], packing: 'PL-PO1270-1.xlsx' },
];

const OPEN_ORDERS = OPEN_POS.map((p) => ({ so: p.so, po: p.po, customer: p.customer, factory: p.factory, units: poUnits(p), value: poValue(p), due: p.shipDate }));
const FACTORIES = [
  { name: 'ASI Global Limited (China)', contact: 'ops@asiglobal.cn', region: 'Ningbo, CN', incoterms: 'FOB', lead: '45 days' },
  { name: 'Hangzhou Headwear Co. (China)', contact: 'export@hzhw.cn', region: 'Hangzhou, CN', incoterms: 'FOB', lead: '38 days' },
  { name: 'Tan Son Apparel (Vietnam)', contact: 'sales@tanson.vn', region: 'Ho Chi Minh City, VN', incoterms: 'CIF', lead: '52 days' },
];
const soTotal = (s: Shipment) => s.lines.reduce((a, l) => a + l.qty * l.unit, 0);
const poTotal = (s: Shipment) => Math.round(soTotal(s) * 0.4076 * 100) / 100;
const units = (s: Shipment) => s.lines.reduce((a, l) => a + l.qty, 0);
const stepIdx = (st: Status) => STEPS.findIndex((x) => x.id === st);
const daysTo = (d: string) => { const [m, dd, y] = d.split('-').map(Number); if (!y) return null; return Math.ceil((new Date(y, m - 1, dd).getTime() - Date.now()) / 86_400_000); };
function ShipChip({ s }: { s: Shipment }) {
  if (s.status === 'shipped' || s.status === 'invoiced') return <em className="is-ship ok">Shipped {s.ship}</em>;
  const d = daysTo(s.ship);
  if (d === null) return <em className="is-ship">Ship date TBD</em>;
  if (d < 0) return <em className="is-ship late">Overdue · {Math.abs(d)}d</em>;
  return <em className={`is-ship ${d <= 14 ? 'soon' : ''}`}>Ships in {d}d · {s.ship}</em>;
}

export default function IntlShipmentsPage() {
  const toast = useToast();
  const [list, setList] = useState<Shipment[]>(SEED);
  const [tab, setTab] = useState<'shipments' | 'orders'>('shipments');
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [fCustomer, setFCustomer] = useState('all');
  const [fFactory, setFFactory] = useState('all');
  const [creating, setCreating] = useState(false);
  const [factoriesOpen, setFactoriesOpen] = useState(false);
  const startFromOrder = (o: typeof OPEN_ORDERS[number]) => { setForm({ customer: o.customer, factory: o.factory, so: o.so, po: o.po, ship: o.due }); setCreating(true); };
  const [form, setForm] = useState({ customer: '', factory: '', so: '', po: '', ship: '' });

  const rows = useMemo(() => list.filter((s) => {
    const t = q.trim().toLowerCase();
    if (t && ![s.id, s.customer, s.factory, ...s.lines.map((l) => l.so + l.po + l.sku)].join(' ').toLowerCase().includes(t)) return false;
    if (fStatus !== 'all' && s.status !== fStatus) return false;
    if (fCustomer !== 'all' && s.customer !== fCustomer) return false;
    if (fFactory !== 'all' && s.factory !== fFactory) return false;
    return true;
  }), [list, q, fStatus, fCustomer, fFactory]);

  const attention = list.filter((s) => s.status === 'prepayment' || s.status === 'draft');
  const open = list.find((s) => s.id === openId);
  const update = (id: string, fn: (s: Shipment) => Shipment) => setList((l) => l.map((s) => (s.id === id ? fn(s) : s)));

  const create = () => {
    if (!form.customer || !form.factory) { toast('Customer and factory are required', 'error'); return; }
    const id = `IS-${String(13 + list.length - SEED.length).padStart(4, '0')}`;
    const now = new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const s: Shipment = { id, customer: form.customer, buyer: '—', factory: form.factory, factoryEmail: '—', status: 'draft', created: now.split(',')[0], ship: form.ship || 'TBD', currency: 'USD', incoterms: 'FOB',
      lines: form.so ? [{ sku: 'TBD', so: form.so, po: form.po || 'TBD', desc: 'Pending packing list', qty: OPEN_ORDERS.find((o) => o.so === form.so)?.units ?? 0, unit: (() => { const o = OPEN_ORDERS.find((x) => x.so === form.so); return o ? Math.round((o.value / o.units) * 100) / 100 : 0; })() }] : [], booking: { method: '—', forwarder: '—', contact: '—', mode: '—', submitted: '—' }, prepay: 0,
      activity: [{ title: 'Shipment created', at: now, by: 'Ryan Mirabile' }], msgs: [], docs: [], packing: '—' };
    setList((l) => [s, ...l]); setCreating(false); setForm({ customer: '', factory: '', so: '', po: '', ship: '' }); toast(`${id} created`); setOpenId(id);
  };

  if (open) return <Detail s={open} onBack={() => setOpenId(null)} update={(fn) => update(open.id, fn)} />;

  const customers = Array.from(new Set(list.map((s) => s.customer)));
  const factories = Array.from(new Set(list.map((s) => s.factory)));

  return (
    <div className="is" data-testid="intl-shipments-page">
      <div className="ops-head">
        <div className="ops-head-l">
          <p className="ops-kicker"><i />Tools</p>
          <h1>Intl Shipments</h1>
          <small className="ops-sub">Factory-direct shipments from purchase order to invoice.</small>
        </div>
        <div className="ops-head-r">
          <div className="ops-seg" role="tablist">
            <button className={tab === 'shipments' ? 'active' : ''} onClick={() => setTab('shipments')} data-testid="is-tab-shipments">Shipments <b>{list.filter((s) => s.status !== 'invoiced').length}</b></button>
            <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')} data-testid="is-tab-orders">Open Orders <b>{OPEN_ORDERS.length}</b></button>
          </div>
          <button className="ops-btn dark" onClick={() => setCreating(true)} data-testid="is-new-shipment"><Plus size={15} /> New Shipment</button>
        </div>
      </div>

      {tab === 'orders' && (
        <IntlOpenOrders
          onCreate={(p: PO) => startFromOrder(OPEN_ORDERS.find((o) => o.po === p.po)!)}
          onCreateGroup={(g) => { const first = OPEN_ORDERS.find((o) => o.po === g.pos[0].po)!; setForm({ customer: g.customer, factory: g.factory, so: g.pos.map((p) => p.so).join(' + '), po: g.pos.map((p) => p.po).join(' + '), ship: first.due }); setCreating(true); toast(`Grouping ${g.pos.length} POs for ${g.customer}`); }}
        />
      )}

      {tab === 'shipments' && <>
      <section className="is-strip" data-testid="is-priority-strip">
        <div className={`is-card is-priority ${attention.length === 0 ? 'clear' : ''}`}>
          <div className="is-priority-head">
            <span className="is-priority-badge"><AlertTriangle size={14} /></span>
            <div>
              <p className="is-kicker">{attention.length === 0 ? 'All clear' : 'Needs attention'}</p>
              <strong>{attention.length === 0 ? 'Nothing is blocking a release' : `${attention.length} shipment${attention.length === 1 ? '' : 's'} blocked before factory release`}</strong>
            </div>
          </div>
          <div className="is-priority-list">
            {[{ id: 'prepayment', label: 'Awaiting prepayment' }, { id: 'draft', label: 'Needs packing list' }].map((g) => { const n = attention.filter((s) => s.status === g.id).length; return n > 0 && (
              <button key={g.id} className={`is-attn-group ${fStatus === g.id ? 'on' : ''}`} onClick={() => setFStatus(fStatus === g.id ? 'all' : g.id)} data-testid={`is-attn-group-${g.id}`}><b>{n}</b> {g.label}<ChevronRight size={14} /></button>
            ); })}
          </div>
          <div className="is-priority-list">
            {attention.slice().sort((a, b) => (daysTo(a.ship) ?? 9e9) - (daysTo(b.ship) ?? 9e9)).slice(0, 3).map((s) => (
              <button key={s.id} className="is-attn" onClick={() => setOpenId(s.id)} data-testid={`is-attn-${s.id}`}>
                <b>{s.id}</b>
                <span className="is-attn-who">{s.customer}<small>{s.factory}</small></span>
                <ShipChip s={s} />
                <em className={s.status === 'draft' ? 'draft' : ''}>{s.status === 'draft' ? 'Needs packing list' : 'Awaiting prepayment'}</em>
                <ChevronRight size={15} />
              </button>
            ))}
            {attention.length > 3 && <button className="is-link is-attn-more" onClick={() => setFStatus('prepayment')} data-testid="is-attn-more">Show all {attention.length} in pipeline <ChevronRight size={14} /></button>}
          </div>
        </div>
        <div className="is-card is-kpis">
          <button className={`is-kpi ${fStatus === 'all' ? 'on' : ''}`} onClick={() => setFStatus('all')} data-testid="is-kpi-all">
            <i className="is-kpi-ic"><Ship size={16} /></i><span>In pipeline</span><strong>{list.filter((s) => s.status !== 'invoiced').length}</strong><small>{fStatus === 'all' ? 'Showing all' : 'Show all'}</small>
          </button>
          <button className={`is-kpi ${fStatus === 'prepaid' ? 'on' : ''}`} onClick={() => setFStatus(fStatus === 'prepaid' ? 'all' : 'prepaid')} data-testid="is-kpi-released">
            <i className="is-kpi-ic g"><CheckCircle2 size={16} /></i><span>Released</span><strong className="g">{list.filter((s) => s.status === 'prepaid').length}</strong><small>{fStatus === 'prepaid' ? 'Filtering · clear' : 'To factory · filter'}</small>
          </button>
          <div className="is-kpi">
            <i className="is-kpi-ic"><Boxes size={16} /></i><span>Units moving</span><strong>{rows.reduce((a, s) => a + units(s), 0).toLocaleString()}</strong><small>{money(rows.reduce((a, s) => a + s.lines.reduce((b, l) => b + l.qty * l.unit, 0), 0))} in view</small>
          </div>
        </div>
      </section>

      <section className="is-card is-pipeline">
        <div className="is-pipe-head">
          <h2>Shipment pipeline <span className="is-muted">{rows.length} shown</span></h2>
          <div className="is-tools">
            <label className="is-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shipment, customer, SO, PO…" data-testid="is-search" />{q && <button className="is-search-x" onClick={() => setQ('')} aria-label="Clear search"><X size={13} /></button>}</label>
            <button className="is-btn" onClick={() => toast('Controls panel')}><SlidersHorizontal size={15} /> Controls</button>
            <button className="is-btn" onClick={() => setFactoriesOpen(true)} data-testid="is-factories"><Folder size={15} /> Factories</button>
          </div>
        </div>
        <div className="is-stages" data-testid="is-stages">
          <button className={`is-stage ${fStatus === 'all' ? 'on' : ''}`} onClick={() => setFStatus('all')} data-testid="is-stage-all"><span>All</span><b>{list.length}</b></button>
          {STEPS.map((st) => { const n = list.filter((s) => s.status === st.id).length; return (
            <button key={st.id} className={`is-stage ${fStatus === st.id ? 'on' : ''} ${n === 0 ? 'zero' : ''}`} onClick={() => setFStatus(fStatus === st.id ? 'all' : st.id)} data-testid={`is-stage-${st.id}`}><span>{STATUS_LABEL[st.id]}</span><b>{n}</b></button>
          ); })}
        </div>
        <div className="is-filters">
          <span className="is-flabel"><Filter size={13} /> Filters</span>
          <select value={fCustomer} onChange={(e) => setFCustomer(e.target.value)} data-testid="is-filter-customer"><option value="all">All customers</option>{customers.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={fFactory} onChange={(e) => setFFactory(e.target.value)} data-testid="is-filter-factory"><option value="all">All factories</option>{factories.map((c) => <option key={c}>{c}</option>)}</select>
          {(fStatus !== 'all' || fCustomer !== 'all' || fFactory !== 'all' || q) && <button className="is-clear" onClick={() => { setFStatus('all'); setFCustomer('all'); setFFactory('all'); setQ(''); }} data-testid="is-clear-filters"><X size={13} /> Clear</button>}
        </div>
        <div className="is-table" role="table">
          <div className="is-tr is-th"><span>Shipment</span><span>Stage</span><span>Factory</span><span>Orders & value</span><span>Shipping</span></div>
          {rows.map((s) => (
            <button key={s.id} className="is-tr is-row" onClick={() => setOpenId(s.id)} data-testid={`is-row-${s.id}`}>
              <span className="is-c1 is-who"><i className="is-mono-av">{s.customer.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</i><span><strong>{s.customer}</strong><small><b className="is-id">{s.id}</b> · Created {s.created}</small></span></span>
              <span className="is-c2"><em className={`is-status ${s.status}`}>{STATUS_LABEL[s.status]}</em><i className="is-prog">{STEPS.map((st, i) => <b key={st.id} className={i < stepIdx(s.status) ? 'd' : i === stepIdx(s.status) ? 'n' : ''} />)}</i></span>
              <span className="is-c2"><strong className="is-fac">{s.factory}</strong><small>{s.incoterms} · {s.currency}{s.booking.mode !== '—' ? ` · ${s.booking.mode}` : ''}</small></span>
              <span className="is-c3">
                <span><small>SO</small><code>{Array.from(new Set(s.lines.map((l) => l.so))).join(', ') || '—'}</code><b>{money(soTotal(s))}</b></span>
                <span><small>PO</small><code>{Array.from(new Set(s.lines.map((l) => l.po))).join(', ') || '—'}</code><b>{money(poTotal(s))}</b></span>
              </span>
              <span className="is-c4 is-c4--last"><strong>{units(s).toLocaleString()} units</strong><small>{s.lines.length} line{s.lines.length === 1 ? '' : 's'}</small><ShipChip s={s} /></span>
            </button>
          ))}
          {rows.length === 0 && <div className="is-empty" data-testid="is-empty">No shipments match.</div>}
        </div>
        <div className="is-foot" data-testid="is-footer"><span><b>{rows.length}</b> shipment{rows.length === 1 ? '' : 's'}</span><span>Units <b>{rows.reduce((a, s) => a + units(s), 0).toLocaleString()}</b></span><span>SO total <b>{money(rows.reduce((a, s) => a + soTotal(s), 0))}</b></span><span>PO total <b>{money(rows.reduce((a, s) => a + poTotal(s), 0))}</b></span></div>
      </section>
      </>}

      {factoriesOpen && (
        <>
          <div className="is-backdrop" onClick={() => setFactoriesOpen(false)} />
          <aside className="is-drawer" data-testid="is-factories-drawer">
            <div className="is-modal-head"><h2>Factories</h2><button className="is-x" onClick={() => setFactoriesOpen(false)} aria-label="Close"><X size={16} /></button></div>
            <small className="is-muted">Default partners for international shipments.</small>
            {FACTORIES.map((f) => (
              <div className="is-factory" key={f.name} data-testid="is-factory">
                <div><strong>{f.name}</strong><small>{f.region} · {f.contact}</small></div>
                <div className="is-factory-meta"><span>{f.incoterms}</span><span>Lead {f.lead}</span><span>{list.filter((x) => x.factory === f.name).length} shipments</span></div>
                <button className="is-btn sm" onClick={() => { setFactoriesOpen(false); setForm({ ...form, factory: f.name }); setCreating(true); }}>New shipment here</button>
              </div>
            ))}
          </aside>
        </>
      )}

      {creating && (
        <>
          <div className="is-backdrop" onClick={() => setCreating(false)} />
          <div className="is-modal" role="dialog" data-testid="is-create-modal">
            <div className="is-modal-head"><h2>New shipment</h2><button className="is-x" onClick={() => setCreating(false)} aria-label="Close"><X size={16} /></button></div>
            <label>Customer<input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="e.g. Mirabile Distribution" data-testid="is-form-customer" /></label>
            <label>Factory<input value={form.factory} onChange={(e) => setForm({ ...form, factory: e.target.value })} placeholder="e.g. ASI Global Limited (China)" data-testid="is-form-factory" /></label>
            <div className="is-form-row"><label>SO #<input value={form.so} onChange={(e) => setForm({ ...form, so: e.target.value })} placeholder="SO58740" data-testid="is-form-so" /></label><label>PO #<input value={form.po} onChange={(e) => setForm({ ...form, po: e.target.value })} placeholder="PO1300" /></label></div>
            <label>Target ship date<input value={form.ship} onChange={(e) => setForm({ ...form, ship: e.target.value })} placeholder="MM-DD-YYYY" /></label>
            <div className="is-modal-foot"><button className="is-btn" onClick={() => setCreating(false)}>Cancel</button><button className="is-btn dark" onClick={create} data-testid="is-form-submit"><Check size={15} /> Create shipment</button></div>
          </div>
        </>
      )}
    </div>
  );
}

function Detail({ s, onBack, update }: { s: Shipment; onBack: () => void; update: (fn: (s: Shipment) => Shipment) => void }) {
  const toast = useToast();
  const [msg, setMsg] = useState('');
  const [menu, setMenu] = useState(false);
  const [dtab, setDtab] = useState<'overview' | 'booking' | 'chat' | 'docs' | 'activity'>('overview');
  const idx = stepIdx(s.status);
  const total = soTotal(s);
  const stamp = () => new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const advance = () => {
    const next = STEPS[Math.min(idx + 1, STEPS.length - 1)].id;
    update((x) => ({ ...x, status: next, activity: [{ title: 'Status changed', detail: `${STATUS_LABEL[x.status].toLowerCase()} → ${STATUS_LABEL[next].toLowerCase()}`, at: stamp(), by: 'Ryan Mirabile' }, ...x.activity] }));
    toast(next === 'prepaid' ? 'Released to factory' : `Moved to ${STATUS_LABEL[next]}`);
  };
  const send = () => {
    const t = msg.trim(); if (!t) return;
    update((x) => ({ ...x, msgs: [...x.msgs, { id: Date.now(), who: 'Ryan Mirabile', me: true, text: t, at: stamp() }], activity: [{ title: 'Customer message sent', detail: t, at: stamp(), by: 'Ryan Mirabile' }, ...x.activity] }));
    setMsg('');
  };
  const cta = idx < STEPS.length - 1 ? (s.status === 'prepayment' ? 'Mark prepaid' : s.status === 'prepaid' ? 'Mark shipped' : s.status === 'shipped' ? 'Mark invoiced' : s.status === 'ready' ? 'Send instructions' : s.status === 'instructions' ? 'Request prepayment' : 'Mark ready') : null;
  const nextLabel = idx < STEPS.length - 1 ? STEPS[idx + 1].label : null;
  const tabs = [
    { id: 'overview', label: 'Overview' }, { id: 'booking', label: 'Booking & payment' }, { id: 'chat', label: 'Conversation', n: s.msgs.length },
    { id: 'docs', label: 'Documents', n: s.docs.length + (s.bookingDocs?.length ?? 0) }, { id: 'activity', label: 'Activity', n: s.activity.length },
  ] as const;

  return (
    <div className="is" data-testid="intl-shipment-detail">
      <button className="is-back" onClick={onBack} data-testid="is-back"><ArrowLeft size={16} /> Intl Shipments</button>

      <section className="is-card is-dhero">
        <div className="is-dhero-top">
          <div className="is-dhero-id">
            <p className="is-kicker">International shipment</p>
            <div className="is-dtitle"><h1>{s.id}</h1><em className={`is-status ${s.status}`}>{STATUS_LABEL[s.status]}</em></div>
            <div className="is-route"><span><small>Customer</small><strong>{s.customer}</strong></span><i /><span><small>Factory</small><strong>{s.factory}</strong></span></div>
          </div>
          <div className="is-dactions">
            {cta && <button className="is-btn dark" onClick={advance} data-testid="is-advance"><Check size={15} /> {cta}</button>}
            <div className="is-menu-wrap">
              <button className="is-btn is-icon" onClick={() => setMenu((v) => !v)} aria-label="More" data-testid="is-more"><MoreHorizontal size={16} /></button>
              {menu && (<><div className="is-backdrop clear" onClick={() => setMenu(false)} /><div className="is-menu" data-testid="is-more-menu">
                <button onClick={() => { setMenu(false); toast('Exporting shipment…'); }}><Download size={15} /> Export shipment</button>
                <button onClick={() => { setMenu(false); toast('Resent to customer'); }}><Send size={15} /> Resend latest to customer</button>
                <button onClick={() => { setMenu(false); toast('Resent to factory'); }}><Send size={15} /> Resend latest to factory</button>
                <button className="danger" onClick={() => { setMenu(false); toast('Shipment cancelled', 'error'); }}><X size={15} /> Cancel shipment</button>
              </div></>)}
            </div>
          </div>
        </div>
        <div className="is-dfacts">
          <div><small>Ship date</small><strong>{s.ship}</strong><ShipChip s={s} /></div>
          <div><small>Mode</small><strong>{s.booking.mode}</strong></div>
          <div><small>Incoterms</small><strong>{s.incoterms} · {s.currency}</strong></div>
          <div><small>Units</small><strong>{units(s).toLocaleString()}</strong></div>
          <div><small>Declared value</small><strong>{money(total)}</strong></div>
          <div><small>Prepayment{idx >= stepIdx('prepaid') ? ' · received' : idx === stepIdx('prepayment') ? ' · awaiting' : ''}</small><strong className={idx >= stepIdx('prepaid') ? 'g' : idx === stepIdx('prepayment') ? 'a' : ''}>{money(s.prepay)}</strong></div>
        </div>
        <ol className="is-steps" data-testid="is-stepper">
          {STEPS.map((st, i) => <li key={st.id} className={i < idx ? 'done' : i === idx ? 'now' : ''}><i>{i < idx ? <Check size={11} strokeWidth={3} /> : i + 1}</i><span>{st.label}</span><small>{i < idx ? 'Done' : i === idx ? 'In progress' : 'Upcoming'}</small></li>)}
        </ol>
        {nextLabel && <p className="is-next">Next step: <b>{nextLabel}</b> — {cta} when ready.</p>}
      </section>

      <div className="is-dtabs" role="tablist">
        {tabs.map((t) => <button key={t.id} role="tab" aria-selected={dtab === t.id} className={dtab === t.id ? 'active' : ''} onClick={() => setDtab(t.id)} data-testid={`is-dtab-${t.id}`}>{t.label}{'n' in t && t.n > 0 && <b>{t.n}</b>}</button>)}
      </div>

      {dtab === 'overview' && (
        <div className="is-grid">
          <section className="is-card is-lines" data-testid="is-lines">
            <div className="is-card-head"><h2>Shipment lines</h2><small className="is-muted">From factory packing list · read-only</small></div>
            <div className="is-ltable">
              <div className="is-ltr is-lth"><span>SKU</span><span>SO #</span><span>PO #</span><span>Description</span><span className="r">Qty</span><span className="r">Unit value</span></div>
              {s.lines.length === 0 && <div className="is-empty">No lines yet — upload a packing list.</div>}
              {s.lines.map((l) => <div className="is-ltr" key={l.sku + l.so}><code>{l.sku}</code><a href="#so" onClick={(e) => { e.preventDefault(); toast(`Open ${l.so}`); }}>{l.so}</a><a href="#po" onClick={(e) => { e.preventDefault(); toast(`Open ${l.po}`); }}>{l.po}</a><span>{l.desc}</span><span className="r">{l.qty}</span><span className="r">{money(l.unit)}</span></div>)}
              {s.lines.length > 0 && <div className="is-ltr is-ltotal"><span>Total</span><span /><span /><span /><span className="r">{units(s).toLocaleString()}</span><span className="r">{money(total)}</span></div>}
            </div>
          </section>
          <div className="is-col">
            <section className="is-card is-facts is-next-card" data-testid="is-next-card">
              <div className="is-card-head"><h2>Next action</h2>{nextLabel && <em className="is-status ready">→ {nextLabel}</em>}</div>
              <ul className="is-check">
                {[
                  { l: 'Packing list uploaded', ok: s.packing !== '—' && s.lines.length > 0 },
                  { l: 'Shipping instructions sent', ok: idx >= stepIdx('prepayment') },
                  { l: 'Customer booking submitted', ok: s.booking.submitted !== '—' },
                  { l: `Prepayment received · ${money(s.prepay)}`, ok: idx >= stepIdx('prepaid') },
                  { l: 'Released to factory', ok: idx >= stepIdx('prepaid') },
                  { l: 'Shipped & invoiced', ok: idx >= stepIdx('invoiced') },
                ].map((c) => <li key={c.l} className={c.ok ? 'ok' : ''}><i>{c.ok && <Check size={11} strokeWidth={3} />}</i>{c.l}</li>)}
              </ul>
              {cta && <button className="is-btn dark" onClick={advance} data-testid="is-advance-card"><Check size={15} /> {cta}</button>}
            </section>
            <section className="is-card is-facts">
              <h2>Parties</h2>
              <p className="is-kicker">Customer</p><strong>{s.customer}</strong><button className="is-copy" onClick={() => { navigator.clipboard?.writeText(s.buyer); toast('Email copied'); }} data-testid="is-copy-buyer">{s.buyer}</button>
              <p className="is-kicker">Factory</p><strong>{s.factory}</strong><button className="is-copy" onClick={() => { navigator.clipboard?.writeText(s.factoryEmail); toast('Email copied'); }}>{s.factoryEmail}</button>
              <p className="is-kicker">Packing list</p><button className="is-docbtn" onClick={() => toast('Downloading packing list')} data-testid="is-packing"><FileText size={15} /> {s.packing}<Download size={14} /></button>
            </section>
            <section className="is-card is-facts" data-testid="is-recent">
              <div className="is-card-head"><h2>Recent activity</h2><button className="is-link" onClick={() => setDtab('activity')}>View all</button></div>
              <ul className="is-recent">{s.activity.slice(0, 3).map((a, i) => <li key={i}><i /><div><strong>{a.title}</strong><small>{a.at} · {a.by}</small></div></li>)}</ul>
            </section>
          </div>
        </div>
      )}

      {dtab === 'booking' && (
        <div className="is-grid is-grid--even">
          <section className="is-card is-facts" data-testid="is-booking">
            <div className="is-card-head"><h2>Customer booking</h2><button className="is-link" onClick={() => toast('Edit booking')}><Pencil size={13} /> Edit</button></div>
            <div className="is-facts-row"><div><p className="is-kicker">Booking method</p><strong>{s.booking.method}</strong></div><div><p className="is-kicker">Transport mode</p><strong>{s.booking.mode}</strong></div></div>
            <p className="is-kicker">Freight forwarder</p><strong>{s.booking.forwarder}</strong><small>{s.booking.contact}</small>
            <p className="is-kicker">Submitted</p><strong>{s.booking.submitted}</strong>
            <div className="is-divider" />
            <div className="is-card-head"><p className="is-kicker">Booking / forwarder documents</p><label className="is-btn sm" data-testid="is-upload"><Upload size={14} /> Upload<input type="file" accept=".pdf,.png,.jpg,.jpeg" hidden onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 10 * 1024 * 1024) { toast('File exceeds 10MB', 'error'); return; } update((x) => ({ ...x, bookingDocs: [...(x.bookingDocs ?? []), f.name], activity: [{ title: 'Booking document uploaded', detail: f.name, at: stamp(), by: 'Ryan Mirabile' }, ...x.activity] })); toast(`${f.name} uploaded`); e.target.value = ''; }} /></label></div>
            <small>PDF, PNG, or JPEG · max 10MB per file. Documents remain private.</small>
            <div className="is-docs" data-testid="is-booking-docs">{(s.bookingDocs ?? []).map((d) => <button key={d} className="is-docbtn" onClick={() => toast(`Downloading ${d}`)}><FileText size={15} /> {d}<Download size={14} /></button>)}</div>
          </section>
          <section className="is-card is-facts">
            <h2>Prepayment</h2>
            <div className="is-pay"><strong>{money(s.prepay)}</strong><span>50% of invoice value · terms 50% Prepay / 50% Net 60</span></div>
            <button className="is-btn sm" onClick={() => toast('Edit prepayment amount')}>Edit prepayment amount</button>
            <div className="is-note">
              Saving changes never sends an email. Resend only after the latest booking and payment details are correct.
              <div className="is-note-btns"><button className="is-btn sm" onClick={() => toast('Resent to customer')}><Send size={13} /> Resend latest to customer</button><button className="is-btn sm" onClick={() => toast('Resent to factory')}><Send size={13} /> Resend latest to factory</button></div>
              <small>Customer recipient: {s.buyer}. Factory recipients: {s.factoryEmail}.</small>
            </div>
          </section>
        </div>
      )}

      {dtab === 'chat' && (
        <section className="is-card is-chat" data-testid="is-chat">
          <div className="is-chat-head"><span className="is-chip"><MessageSquare size={16} /></span><div><strong>Shipment conversation</strong><small>Visible to the customer · notifications follow the admin setting.</small></div></div>
          <div className="is-msgs">
            {s.msgs.length === 0 && <div className="is-chat-empty"><MessageSquare size={22} /><strong>No messages yet</strong><small>Start the conversation with {s.customer}. They'll see it in their portal.</small></div>}
            {s.msgs.map((m) => <div key={m.id} className={`is-msg ${m.me ? 'me' : ''}`} data-testid="is-msg"><small>{m.who} · {m.at}</small><p>{m.text}</p></div>)}
          </div>
          <div className="is-compose">
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message…" data-testid="is-msg-input" />
            <button className="is-btn dark" onClick={send} disabled={!msg.trim()} data-testid="is-msg-send"><Send size={15} /> Send</button>
          </div>
          <small className="is-muted">Enter to send · Shift + Enter for a new line</small>
        </section>
      )}

      {dtab === 'docs' && (
        <div className="is-grid is-grid--even">
          <section className="is-card is-facts">
            <div className="is-card-head"><h2>Factory packing list</h2><span className="is-muted">source file</span></div>
            <button className="is-docbtn" onClick={() => toast('Downloading packing list')}><FileText size={15} /> {s.packing}<Download size={14} /></button>
          </section>
          <section className="is-card is-facts" data-testid="is-docs">
            <h2>Generated documents</h2>
            <div className="is-docs">{s.docs.length === 0 && <small>No documents generated yet.</small>}{(s.bookingDocs ?? []).map((d) => <button key={d} className="is-docbtn" onClick={() => toast(`Downloading ${d}`)}><Upload size={15} /> {d}<Download size={14} /></button>)}{s.docs.map((d) => <button key={d} className="is-docbtn" onClick={() => toast(`Downloading ${d}`)}><FileText size={15} /> {d}<Download size={14} /></button>)}</div>
          </section>
        </div>
      )}

      {dtab === 'activity' && (
        <section className="is-card is-activity" data-testid="is-activity">
          <h2>Activity</h2>
          <ul>{s.activity.map((a, i) => <li key={i}><i /><div><strong>{a.title}</strong>{a.detail && <span> — {a.detail}</span>}<small>{a.at} · {a.by}</small></div></li>)}</ul>
        </section>
      )}
    </div>
  );
}
