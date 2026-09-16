import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Box, Check, ChevronLeft, ChevronRight, Download, Eye, ImageOff, Loader2, Printer, Search, Trash2, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { CATALOG, LS_CUSTOMERS, PRICE_LISTS, SEASONS, fmt, priceFor, type LsItem, type PriceList } from './lib/linesheet';
import './ops.css';
import './linesheet.css';

type Ctx = 'customer' | 'list' | 'generic';
type Doc = { title: string; ctx: Ctx; customerId: string; priceListId: string; notes: string; showMsrp: boolean; showMoq: boolean };
const PAGE = 18; const MAX_SEL = 120;
const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function LinesheetPage() {
  const toast = useToast();
  const [season, setSeason] = useState('SS27');
  const [coll, setColl] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [doc, setDoc] = useState<Doc>({ title: 'Linesheet', ctx: 'customer', customerId: '', priceListId: 'usw', notes: '', showMsrp: true, showMoq: false });
  const [custQ, setCustQ] = useState('');
  const [resolving, setResolving] = useState(false);
  const [preview, setPreview] = useState(false);

  const collections = Array.from(new Set(CATALOG.map((i) => i.collection)));
  const items = useMemo(() => CATALOG.filter((i) => (season === 'all' || i.season === season) && (coll === 'all' || i.collection === coll) && (!q || `${i.name} ${i.color} ${i.sku}`.toLowerCase().includes(q.toLowerCase()))), [season, coll, q]);
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const visible = items.slice((page - 1) * PAGE, page * PAGE);
  const chosen = CATALOG.filter((i) => sel.has(i.id));
  const customer = LS_CUSTOMERS.find((c) => c.id === doc.customerId);
  const list: PriceList = doc.ctx === 'generic' ? PRICE_LISTS[0] : doc.ctx === 'customer' ? PRICE_LISTS.find((p) => p.id === (customer?.priceList ?? 'usw'))! : PRICE_LISTS.find((p) => p.id === doc.priceListId)!;
  const priced = doc.ctx !== 'customer' || !!customer;
  const custMatches = LS_CUSTOMERS.filter((c) => !custQ || `${c.name} ${c.num}`.toLowerCase().includes(custQ.toLowerCase()));

  useEffect(() => { setPage(1); }, [season, coll, q]);
  useEffect(() => { if (!priced) return; setResolving(true); const t = setTimeout(() => setResolving(false), 650); return () => clearTimeout(t); }, [doc.ctx, doc.customerId, doc.priceListId, priced]);

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else if (n.size >= MAX_SEL) { toast(`Limit of ${MAX_SEL} styles per linesheet`, 'error'); return s; } else n.add(id); return n; });
  const pageAllOn = visible.length > 0 && visible.every((i) => sel.has(i.id));
  const selectPage = () => setSel((s) => { const n = new Set(s); visible.forEach((i) => (pageAllOn ? n.delete(i.id) : n.add(i.id))); return n; });

  if (preview) return <Preview doc={doc} items={chosen} list={list} customerName={customer?.name} onBack={() => setPreview(false)} onPrint={() => { toast('Opening print dialog — choose "Save as PDF"'); setTimeout(() => window.print(), 150); }} />;

  return (
    <div className="ls" data-testid="linesheet-page">
      <div className="ls-body">
        <section className="ls-card ls-catalog">
          <div className="ls-toolbar">
            <label className="ls-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product code or name…" data-testid="ls-search" />{q && <button onClick={() => setQ('')} aria-label="Clear"><X size={13} /></button>}</label>
            <select className="ls-select" value={season} onChange={(e) => setSeason(e.target.value)} data-testid="ls-season"><option value="all">All seasons</option>{SEASONS.map((s) => <option key={s}>{s}</option>)}</select>
            <select className="ls-select" value={coll} onChange={(e) => setColl(e.target.value)} data-testid="ls-filter-collection"><option value="all">All collections</option>{collections.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="ls-toolbar sub">
            <span className="ls-found" data-testid="ls-found">{items.length} products found</span>
            <span className="ls-spacer" />
            <button className="ops-btn" onClick={selectPage} data-testid="ls-select-page">{pageAllOn ? 'Deselect visible page' : 'Select visible page'}</button>
            {sel.size > 0 && <button className="ls-link danger" onClick={() => setSel(new Set())} data-testid="ls-clear">Clear selection</button>}
          </div>
          {items.length === 0 && <p className="ls-empty">No styles match these filters.</p>}
          <div className="ls-grid">
            {visible.map((i) => { const on = sel.has(i.id); return (
              <button key={i.id} className={`ls-item ${on ? 'on' : ''}`} onClick={() => toggle(i.id)} aria-pressed={on} data-testid={`ls-item-${i.id}`}>
                <span className="ls-check">{on && <Check size={14} strokeWidth={3} />}</span>
                <span className="ls-thumb">{i.image ? <img src={i.image} alt="" loading="lazy" /> : <ImageOff size={26} strokeWidth={1.5} />}</span>
                <span className="ls-item-body">
                  <em className="ls-season">{i.season}</em>
                  <strong>{i.name} | {i.color} | {i.size}</strong>
                  <small>{i.sku}</small>
                </span>
              </button>
            ); })}
          </div>
          {pages > 1 && (
            <div className="ls-pager" data-testid="ls-pager">
              <button className="ops-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)} data-testid="ls-prev"><ChevronLeft size={15} /> Previous</button>
              <span>Page {page} of {pages}</span>
              <button className="ops-btn" disabled={page === pages} onClick={() => setPage((p) => p + 1)} data-testid="ls-next">Next <ChevronRight size={15} /></button>
            </div>
          )}
        </section>

        <aside className="ls-card ls-builder" data-testid="ls-builder">
          <div className="ls-builder-scroll">
            <h2>Export setup</h2>
            <label className="ls-field"><span>Document title</span><input maxLength={200} value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} data-testid="ls-title" /><small className="ls-hint">Up to 200 characters<b>{doc.title.length}/200</b></small></label>
            <label className="ls-field"><span>Pricing context</span>
              <select value={doc.ctx} onChange={(e) => setDoc({ ...doc, ctx: e.target.value as Ctx })} data-testid="ls-ctx"><option value="customer">Specific customer</option><option value="list">Price list</option><option value="generic">Generic · US Wholesale</option></select>
            </label>
            {doc.ctx === 'customer' && (
              <div className="ls-field">
                <span>Customer</span>
                <label className="ls-search block"><Search size={14} /><input value={custQ} onChange={(e) => setCustQ(e.target.value)} placeholder="Search name or number…" data-testid="ls-customer-search" /></label>
                {customer
                  ? <div className="ls-cust-sel" data-testid="ls-customer-selected"><span><b>{customer.name}</b> · #{customer.num} · {PRICE_LISTS.find((p) => p.id === customer.priceList)!.name}</span><button onClick={() => setDoc({ ...doc, customerId: '' })} data-testid="ls-customer-clear">Clear</button></div>
                  : <ul className="ls-cust-list" data-testid="ls-customer-list">
                      {custMatches.slice(0, 8).map((c) => <li key={c.id}><button onClick={() => { setDoc({ ...doc, customerId: c.id }); setCustQ(''); }} data-testid={`ls-customer-${c.id}`}>{c.name}<small>#{c.num}</small></button></li>)}
                      {custMatches.length === 0 && <li className="ls-muted">No customers match.</li>}
                    </ul>}
                {!customer && <small className="ls-hint">Showing the first {Math.min(8, custMatches.length)} of {custMatches.length} customers. Search to narrow the list.</small>}
              </div>
            )}
            {doc.ctx === 'list' && (
              <label className="ls-field"><span>Price list</span>
                <select value={doc.priceListId} onChange={(e) => setDoc({ ...doc, priceListId: e.target.value })} data-testid="ls-pricelist">{PRICE_LISTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <small className="ls-hint">{list.note}</small>
              </label>
            )}
            <div className="ls-toggles">
              <label><input type="checkbox" checked={doc.showMsrp} onChange={(e) => setDoc({ ...doc, showMsrp: e.target.checked })} data-testid="ls-toggle-msrp" /><span className="ls-box"><Check size={11} strokeWidth={3} /></span> Show MSRP</label>
              <label><input type="checkbox" checked={doc.showMoq} onChange={(e) => setDoc({ ...doc, showMoq: e.target.checked })} data-testid="ls-toggle-moq" /><span className="ls-box"><Check size={11} strokeWidth={3} /></span> Show MOQ & delivery</label>
            </div>
            <label className="ls-field"><span>Notes for customer</span><textarea rows={2} value={doc.notes} onChange={(e) => setDoc({ ...doc, notes: e.target.value })} placeholder="Terms, delivery window, contact…" data-testid="ls-notes" /></label>

            <div className="ls-sel-head"><h2>Selected <span data-testid="ls-selected-count">({chosen.length}/{MAX_SEL})</span></h2>{resolving && <Loader2 size={15} className="ls-spin" />}</div>
            {chosen.length === 0 && <p className="ls-muted">Select styles from the catalog to build the linesheet.</p>}
            <ul className="ls-picked" data-testid="ls-picked">
              {chosen.map((i) => <li key={i.id}><span className="ls-thumb xs">{i.image ? <img src={i.image} alt="" /> : <Box size={12} />}</span><span><strong>{i.name} | {i.color} | {i.size}</strong><small>{i.sku}</small></span><b className={priced && !resolving ? '' : 'pending'}>{!priced ? 'Select customer' : resolving ? 'Price pending' : fmt(priceFor(i, list))}</b><button onClick={() => toggle(i.id)} aria-label={`Remove ${i.name}`} data-testid={`ls-remove-${i.id}`}><Trash2 size={14} /></button></li>)}
            </ul>
          </div>
          <div className="ls-actions">
            <button className="ops-btn" onClick={() => setPreview(true)} disabled={!chosen.length || !priced} data-testid="ls-preview"><Eye size={15} /> Preview</button>
            <button className="ops-btn" onClick={() => { setPreview(true); setTimeout(() => window.print(), 400); }} disabled={!chosen.length || !priced} data-testid="ls-print-direct"><Printer size={15} /> Print</button>
            <button className="ops-btn dark" onClick={() => { setPreview(true); toast('Preparing PDF — choose "Save as PDF" in the dialog'); setTimeout(() => window.print(), 400); }} disabled={!chosen.length || !priced} data-testid="ls-download-direct"><Download size={15} /> Download</button>
          </div>
          <small className="ls-foot-hint">{!priced ? 'Choose a customer to resolve prices.' : resolving ? 'Resolving prices…' : `${list.name} · ${chosen.length} styles ready`}</small>
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
        <button className="ops-btn" onClick={onPrint} data-testid="ls-print"><Printer size={15} /> Print</button>
        <button className="ops-btn dark" onClick={onPrint} data-testid="ls-download"><Download size={15} /> Download PDF</button>
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
              <small>{i.color} · {i.size}</small>
              <small className="ls-doc-sku">{i.sku}</small>
              <small>{i.collection} · {i.season}</small>
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
