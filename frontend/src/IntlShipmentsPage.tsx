import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Download, FileText, Filter, Folder, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Send, SlidersHorizontal, Upload, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
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
  prepay: number; activity: { title: string; detail?: string; at: string; by: string }[]; msgs: Msg[]; docs: string[]; packing: string;
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

const soTotal = (s: Shipment) => s.lines.reduce((a, l) => a + l.qty * l.unit, 0);
const poTotal = (s: Shipment) => Math.round(soTotal(s) * 0.4076 * 100) / 100;
const units = (s: Shipment) => s.lines.reduce((a, l) => a + l.qty, 0);
const stepIdx = (st: Status) => STEPS.findIndex((x) => x.id === st);

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
      lines: form.so ? [{ sku: 'TBD', so: form.so, po: form.po || 'TBD', desc: 'Pending packing list', qty: 0, unit: 0 }] : [], booking: { method: '—', forwarder: '—', contact: '—', mode: '—', submitted: '—' }, prepay: 0,
      activity: [{ title: 'Shipment created', at: now, by: 'Ryan Mirabile' }], msgs: [], docs: [], packing: '—' };
    setList((l) => [s, ...l]); setCreating(false); setForm({ customer: '', factory: '', so: '', po: '', ship: '' }); toast(`${id} created`); setOpenId(id);
  };

  if (open) return <Detail s={open} onBack={() => setOpenId(null)} update={(fn) => update(open.id, fn)} />;

  const customers = Array.from(new Set(list.map((s) => s.customer)));
  const factories = Array.from(new Set(list.map((s) => s.factory)));

  return (
    <div className="is" data-testid="intl-shipments-page">
      <div className="is-topbar">
        <div className="is-tabs" role="tablist">
          <button className={tab === 'shipments' ? 'active' : ''} onClick={() => setTab('shipments')} data-testid="is-tab-shipments">Shipments</button>
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => { setTab('orders'); toast('Open Orders view coming soon', 'info'); }} data-testid="is-tab-orders">Open Orders</button>
        </div>
      </div>

      <section className="is-card is-strip" data-testid="is-priority-strip">
        <div className="is-priority">
          <p className="is-kicker"><i />Priority</p>
          <strong>{attention.length} item{attention.length === 1 ? '' : 's'} need attention</strong>
          <small>Resolve before the next factory release.</small>
        </div>
        <div className="is-priority-list">
          {attention.length === 0 ? <span className="is-muted">Nothing currently needs attention.</span> : attention.map((s) => (
            <button key={s.id} className="is-attn" onClick={() => setOpenId(s.id)} data-testid={`is-attn-${s.id}`}><b>{s.id}</b> {s.customer} · <em>{STATUS_LABEL[s.status]}</em></button>
          ))}
        </div>
        <div className="is-kpi"><span>In pipeline</span><strong>{list.filter((s) => s.status !== 'invoiced').length}</strong><small>shipments</small></div>
        <div className="is-kpi"><span>Released</span><strong className="g">{list.filter((s) => s.status === 'prepaid').length}</strong><small>to factory</small></div>
        <div className="is-kpi"><span>Units moving</span><strong>{rows.reduce((a, s) => a + units(s), 0).toLocaleString()}</strong><small>in this view</small></div>
      </section>

      <section className="is-card is-pipeline">
        <div className="is-pipe-head">
          <h2>Shipment pipeline <span className="is-muted">{rows.length} shown</span></h2>
          <div className="is-tools">
            <label className="is-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shipment, customer, SO, PO…" data-testid="is-search" /></label>
            <button className="is-btn" onClick={() => toast('Controls panel')}><SlidersHorizontal size={15} /> Controls</button>
            <button className="is-btn" onClick={() => toast('Factories directory')}><Folder size={15} /> Factories</button>
            <button className="is-btn dark" onClick={() => setCreating(true)} data-testid="is-new-shipment"><Plus size={15} /> New Shipment</button>
          </div>
        </div>
        <div className="is-filters">
          <span className="is-flabel"><Filter size={13} /> Filters</span>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} data-testid="is-filter-status"><option value="all">All statuses</option>{STEPS.map((x) => <option key={x.id} value={x.id}>{STATUS_LABEL[x.id]}</option>)}</select>
          <select value={fCustomer} onChange={(e) => setFCustomer(e.target.value)} data-testid="is-filter-customer"><option value="all">All customers</option>{customers.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={fFactory} onChange={(e) => setFFactory(e.target.value)} data-testid="is-filter-factory"><option value="all">All factories</option>{factories.map((c) => <option key={c}>{c}</option>)}</select>
          {(fStatus !== 'all' || fCustomer !== 'all' || fFactory !== 'all' || q) && <button className="is-clear" onClick={() => { setFStatus('all'); setFCustomer('all'); setFFactory('all'); setQ(''); }} data-testid="is-clear-filters"><X size={13} /> Clear</button>}
        </div>
        <div className="is-table" role="table">
          <div className="is-tr is-th"><span>Shipment</span><span>Status & factory</span><span>Orders & value</span><span>Shipping</span></div>
          {rows.map((s) => (
            <button key={s.id} className="is-tr is-row" onClick={() => setOpenId(s.id)} data-testid={`is-row-${s.id}`}>
              <span className="is-c1"><b className="is-id"><FileText size={14} />{s.id}</b><strong>{s.customer}</strong><small>Created {s.created}</small></span>
              <span className="is-c2"><em className={`is-status ${s.status}`}>{STATUS_LABEL[s.status]}</em><strong>{s.factory}</strong></span>
              <span className="is-c3">
                <span><small>SO</small><code>{Array.from(new Set(s.lines.map((l) => l.so))).join(', ') || '—'}</code><b>{money(soTotal(s))}</b></span>
                <span><small>PO</small><code>{Array.from(new Set(s.lines.map((l) => l.po))).join(', ') || '—'}</code><b>{money(poTotal(s))}</b></span>
              </span>
              <span className="is-c4"><strong>{units(s).toLocaleString()} units</strong><small>{s.lines.length} line{s.lines.length === 1 ? '' : 's'} · {s.incoterms}{s.booking.mode !== '—' ? ` · ${s.booking.mode}` : ''}</small><small>Ship {s.ship}</small></span>
            </button>
          ))}
          {rows.length === 0 && <div className="is-empty" data-testid="is-empty">No shipments match.</div>}
        </div>
        <div className="is-foot" data-testid="is-footer"><span><b>{rows.length}</b> shipment{rows.length === 1 ? '' : 's'}</span><span>Units <b>{rows.reduce((a, s) => a + units(s), 0).toLocaleString()}</b></span><span>SO total <b>{money(rows.reduce((a, s) => a + soTotal(s), 0))}</b></span><span>PO total <b>{money(rows.reduce((a, s) => a + poTotal(s), 0))}</b></span></div>
      </section>

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
    { id: 'docs', label: 'Documents', n: s.docs.length }, { id: 'activity', label: 'Activity', n: s.activity.length },
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
          <div><small>Ship date</small><strong>{s.ship}</strong></div>
          <div><small>Mode</small><strong>{s.booking.mode}</strong></div>
          <div><small>Incoterms</small><strong>{s.incoterms} · {s.currency}</strong></div>
          <div><small>Units</small><strong>{units(s).toLocaleString()}</strong></div>
          <div><small>Declared value</small><strong>{money(total)}</strong></div>
          <div><small>Prepayment</small><strong className={s.status === 'prepaid' || idx > stepIdx('prepaid') ? 'g' : ''}>{money(s.prepay)}</strong></div>
        </div>
        <ol className="is-steps" data-testid="is-stepper">
          {STEPS.map((st, i) => <li key={st.id} className={i < idx ? 'done' : i === idx ? 'now' : ''}><i>{i < idx && <Check size={10} strokeWidth={3} />}</i><span>{st.label}</span></li>)}
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
            <section className="is-card is-facts">
              <h2>Parties</h2>
              <p className="is-kicker">Customer</p><strong>{s.customer}</strong><small>Buyer · {s.buyer}</small>
              <p className="is-kicker">Factory</p><strong>{s.factory}</strong><small>{s.factoryEmail}</small>
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
            <div className="is-card-head"><p className="is-kicker">Booking / forwarder documents</p><button className="is-btn sm" onClick={() => toast('Upload document')}><Upload size={14} /> Upload</button></div>
            <small>PDF, PNG, or JPEG · max 10MB per file. Documents remain private.</small>
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
            {s.msgs.length === 0 && <span className="is-muted">No messages yet.</span>}
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
            <div className="is-docs">{s.docs.length === 0 && <small>No documents generated yet.</small>}{s.docs.map((d) => <button key={d} className="is-docbtn" onClick={() => toast(`Downloading ${d}`)}><FileText size={15} /> {d}<Download size={14} /></button>)}</div>
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
