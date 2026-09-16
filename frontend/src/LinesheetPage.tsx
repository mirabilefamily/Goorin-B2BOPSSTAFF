import { useMemo, useState } from 'react';
import { ArrowLeft, Box, Check, CheckSquare, Download, Eye, FileText, Printer, Search, Square, Users, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { CATALOG, LS_CUSTOMERS, PRICE_LISTS, SEASONS, fmt, priceFor, type LsItem, type PriceList } from './lib/linesheet';
import './ops.css';
import './linesheet.css';

type Doc = { title: string; customerId: string; priceListId: string; notes: string; showMsrp: boolean; showMoq: boolean };
const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function LinesheetPage() {
  const toast = useToast();
  const [season, setSeason] = useState('SS27');
  const [coll, setColl] = useState('all');
  const [shape, setShape] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [doc, setDoc] = useState<Doc>({ title: 'SS27 Linesheet', customerId: '', priceListId: 'usw', notes: '', showMsrp: true, showMoq: true });
  const [preview, setPreview] = useState(false);

  const collections = Array.from(new Set(CATALOG.map((i) => i.collection)));
  const shapes = Array.from(new Set(CATALOG.map((i) => i.shape)));
  const items = useMemo(() => CATALOG.filter((i) => (season === 'all' || i.season === season) && (coll === 'all' || i.collection === coll) && (shape === 'all' || i.shape === shape) && (!q || `${i.name} ${i.sku} ${i.collection}`.toLowerCase().includes(q.toLowerCase()))), [season, coll, shape, q]);
  const chosen = CATALOG.filter((i) => sel.has(i.id));
  const list = PRICE_LISTS.find((p) => p.id === doc.priceListId)!;
  const customer = LS_CUSTOMERS.find((c) => c.id === doc.customerId);

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allVisible = items.length > 0 && items.every((i) => sel.has(i.id));
  const pickSeason = (s: string) => { setSeason(s); setDoc((d) => ({ ...d, title: d.title.match(/^(SS27|FW26|Core|All seasons) Linesheet$/) ? `${s === 'all' ? 'All seasons' : s} Linesheet` : d.title })); };
  const pickCustomer = (id: string) => { const c = LS_CUSTOMERS.find((x) => x.id === id); setDoc((d) => ({ ...d, customerId: id, priceListId: c ? c.priceList : d.priceListId })); };

  if (preview) return <Preview doc={doc} items={chosen} list={list} customerName={customer?.name} onBack={() => setPreview(false)} onPrint={() => { toast('Opening print dialog — choose "Save as PDF"'); setTimeout(() => window.print(), 150); }} />;

  return (
    <div className="ls" data-testid="linesheet-page">
      <div className="ops-head">
        <div className="ops-head-l"><p className="ops-kicker"><i />Tools</p><h1>Linesheet</h1><small className="ops-sub">Pick a season, select styles, price it for a customer, then print or save as PDF.</small></div>
        <div className="ops-head-r">
          <div className="ops-seg" role="tablist">{['all', ...SEASONS].map((s) => <button key={s} className={season === s ? 'active' : ''} onClick={() => pickSeason(s)} data-testid={`ls-season-${s}`}>{s === 'all' ? 'All' : s} <b>{CATALOG.filter((i) => s === 'all' || i.season === s).length}</b></button>)}</div>
        </div>
      </div>

      <div className="ls-body">
        <section className="ls-card ls-catalog">
          <div className="ls-toolbar">
            <label className="ls-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search style, SKU, collection…" data-testid="ls-search" />{q && <button onClick={() => setQ('')} aria-label="Clear"><X size={13} /></button>}</label>
            <select className="ls-select" value={coll} onChange={(e) => setColl(e.target.value)} data-testid="ls-filter-collection"><option value="all">All collections</option>{collections.map((c) => <option key={c}>{c}</option>)}</select>
            <select className="ls-select" value={shape} onChange={(e) => setShape(e.target.value)} data-testid="ls-filter-shape"><option value="all">All shapes</option>{shapes.map((c) => <option key={c}>{c}</option>)}</select>
            <span className="ls-spacer" />
            <button className="ls-link" onClick={() => setSel((s) => { const n = new Set(s); items.forEach((i) => (allVisible ? n.delete(i.id) : n.add(i.id))); return n; })} data-testid="ls-select-all">{allVisible ? <CheckSquare size={15} /> : <Square size={15} />} {allVisible ? 'Deselect' : 'Select'} all {items.length}</button>
          </div>
          {items.length === 0 && <p className="ls-empty">No styles match these filters.</p>}
          <div className="ls-grid">
            {items.map((i) => { const on = sel.has(i.id); return (
              <button key={i.id} className={`ls-item ${on ? 'on' : ''}`} onClick={() => toggle(i.id)} aria-pressed={on} data-testid={`ls-item-${i.id}`}>
                <span className="ls-check">{on && <Check size={13} strokeWidth={3} />}</span>
                <span className="ls-thumb">{i.image ? <img src={i.image} alt="" loading="lazy" /> : <Box size={26} />}</span>
                <span className="ls-item-body">
                  <strong>{i.name}</strong>
                  <small>{i.sku}</small>
                  <span className="ls-item-meta"><em>{i.season}</em><em>{i.collection}</em></span>
                  <span className="ls-item-price"><b>{fmt(priceFor(i, list))}</b><small>MSRP {fmt(i.msrp)}</small></span>
                </span>
              </button>
            ); })}
          </div>
        </section>

        <aside className="ls-card ls-builder" data-testid="ls-builder">
          <div className="ls-builder-head"><FileText size={16} /><h2>Linesheet setup</h2><b className="ls-count" data-testid="ls-selected-count">{chosen.length}</b></div>
          <label className="ls-field"><span>Title</span><input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} data-testid="ls-title" /></label>
          <label className="ls-field"><span><Users size={12} /> Prepared for</span>
            <select value={doc.customerId} onChange={(e) => pickCustomer(e.target.value)} data-testid="ls-customer"><option value="">No customer · generic</option>{LS_CUSTOMERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </label>
          <label className="ls-field"><span>Price list {customer && <i className="ls-auto">auto from customer</i>}</span>
            <select value={doc.priceListId} onChange={(e) => setDoc({ ...doc, priceListId: e.target.value })} data-testid="ls-pricelist">{PRICE_LISTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <small>{list.note}</small>
          </label>
          <div className="ls-toggles">
            <label><input type="checkbox" checked={doc.showMsrp} onChange={(e) => setDoc({ ...doc, showMsrp: e.target.checked })} data-testid="ls-toggle-msrp" /><span className="ls-box"><Check size={11} strokeWidth={3} /></span> Show MSRP</label>
            <label><input type="checkbox" checked={doc.showMoq} onChange={(e) => setDoc({ ...doc, showMoq: e.target.checked })} data-testid="ls-toggle-moq" /><span className="ls-box"><Check size={11} strokeWidth={3} /></span> Show MOQ & delivery</label>
          </div>
          <label className="ls-field"><span>Notes for customer</span><textarea rows={3} value={doc.notes} onChange={(e) => setDoc({ ...doc, notes: e.target.value })} placeholder="Terms, delivery window, contact…" data-testid="ls-notes" /></label>
          <div className="ls-summary">
            <div><small>Styles</small><strong>{chosen.length}</strong></div>
            <div><small>Avg wholesale</small><strong>{chosen.length ? fmt(chosen.reduce((a, i) => a + priceFor(i, list), 0) / chosen.length) : '—'}</strong></div>
            <div><small>Seasons</small><strong>{Array.from(new Set(chosen.map((i) => i.season))).join(', ') || '—'}</strong></div>
          </div>
          {chosen.length > 0 && (
            <ul className="ls-picked" data-testid="ls-picked">
              {chosen.map((i) => <li key={i.id}><span className="ls-thumb xs">{i.image ? <img src={i.image} alt="" /> : <Box size={12} />}</span><span>{i.name}<small>{i.sku}</small></span><b>{fmt(priceFor(i, list))}</b><button onClick={() => toggle(i.id)} aria-label={`Remove ${i.name}`} data-testid={`ls-remove-${i.id}`}><X size={13} /></button></li>)}
            </ul>
          )}
          <div className="ls-actions">
            <button className="ops-btn" onClick={() => setSel(new Set())} disabled={!chosen.length} data-testid="ls-clear">Clear</button>
            <button className="ops-btn dark" onClick={() => setPreview(true)} disabled={!chosen.length} data-testid="ls-preview"><Eye size={15} /> Preview & print</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Preview({ doc, items, list, customerName, onBack, onPrint }: { doc: Doc; items: LsItem[]; list: PriceList; customerName?: string; onBack: () => void; onPrint: () => void }) {
  const cur = list.id === 'intl' ? 'EUR' : 'USD';
  return (
    <div className="ls ls-preview" data-testid="ls-preview-page">
      <div className="ls-preview-bar no-print">
        <button className="ls-back" onClick={onBack} data-testid="ls-back"><ArrowLeft size={16} /> Back to builder</button>
        <span className="ls-preview-info">{items.length} styles · {list.name}{customerName ? ` · ${customerName}` : ''}</span>
        <button className="ops-btn dark" onClick={onPrint} data-testid="ls-print"><Printer size={15} /> Print / Save as PDF</button>
        <button className="ops-btn" onClick={onPrint} data-testid="ls-download"><Download size={15} /> Download PDF</button>
      </div>
      <article className="ls-doc" data-testid="ls-doc">
        <header className="ls-doc-head">
          <div><img src="/goorin-sidebar-icon.png" alt="Goorin" className="ls-doc-logo" /><p className="ls-doc-kicker">Goorin Bros. · Wholesale linesheet</p><h1>{doc.title}</h1></div>
          <dl>
            <div><dt>Prepared for</dt><dd>{customerName ?? 'Wholesale partners'}</dd></div>
            <div><dt>Price list</dt><dd>{list.name} · {cur}</dd></div>
            <div><dt>Date</dt><dd>{today()}</dd></div>
            <div><dt>Prepared by</dt><dd>Ryan Mirabile · ryan@goorin.com</dd></div>
          </dl>
        </header>
        {doc.notes && <p className="ls-doc-notes">{doc.notes}</p>}
        <section className="ls-doc-grid">
          {items.map((i) => (
            <div className="ls-doc-item" key={i.id}>
              <div className="ls-doc-img">{i.image ? <img src={i.image} alt={i.name} /> : <Box size={28} />}</div>
              <strong>{i.name}</strong>
              <small className="ls-doc-sku">{i.sku}</small>
              <small>{i.collection} · {i.shape} · {i.season}</small>
              <div className="ls-doc-colors">{i.colors.map((c) => <span key={c}>{c}</span>)}</div>
              <div className="ls-doc-price"><b>{fmt(priceFor(i, list), cur)}</b>{doc.showMsrp && <small>MSRP {fmt(i.msrp, cur)}</small>}</div>
              {doc.showMoq && <small className="ls-doc-moq">MOQ {i.moq} · {i.delivery}</small>}
            </div>
          ))}
        </section>
        <footer className="ls-doc-foot"><span>Goorin Bros. · 1612 Stockton St, San Francisco, CA · wholesale@goorin.com</span><span>{list.note} · Prices in {cur}, subject to change · {items.length} styles</span></footer>
      </article>
    </div>
  );
}
