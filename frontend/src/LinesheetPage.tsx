import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, Download, Eye, FilePlus2, FolderOpen, ImageOff, Link2, Loader2, Printer, Save, Search, Trash2, X, Box, Files } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { CATALOG, LS_CUSTOMERS, PRICE_LISTS, SEASONS, fmt, priceFor, type PriceList } from './lib/linesheet';
import { linesheetApi, shareUrl, type LinesheetInput, type SavedLinesheet } from './lib/linesheetApi';
import { LinesheetDoc } from './LinesheetDoc';
import './ops.css';
import './linesheet.css';

type Ctx = 'customer' | 'list';
type Doc = { title: string; ctx: Ctx; customerId: string; priceListId: string; notes: string; showMsrp: boolean; showMoq: boolean };
const PAGE = 18; const MAX_SEL = 120;
const EMPTY: Doc = { title: 'Linesheet', ctx: 'customer', customerId: '', priceListId: 'usw', notes: '', showMsrp: true, showMoq: false };
const rel = (iso: string) => { const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };

export default function LinesheetPage() {
  const toast = useToast();
  const [season, setSeason] = useState('SS27');
  const [coll, setColl] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [doc, setDoc] = useState<Doc>(EMPTY);
  const [custQ, setCustQ] = useState('');
  const [resolving, setResolving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState<SavedLinesheet[]>([]);
  const [current, setCurrent] = useState<SavedLinesheet | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [saving, setSaving] = useState(false);

  const collections = Array.from(new Set(CATALOG.map((i) => i.collection)));
  const items = useMemo(() => CATALOG.filter((i) => (season === 'all' || i.season === season) && (coll === 'all' || i.collection === coll) && (!q || `${i.name} ${i.color} ${i.sku}`.toLowerCase().includes(q.toLowerCase()))), [season, coll, q]);
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const visible = items.slice((page - 1) * PAGE, page * PAGE);
  const chosen = CATALOG.filter((i) => sel.has(i.id));
  const customer = LS_CUSTOMERS.find((c) => c.id === doc.customerId);
  const list: PriceList = PRICE_LISTS.find((p) => p.id === (doc.ctx === 'customer' ? customer?.priceList ?? 'usw' : doc.priceListId))!;
  const priced = doc.ctx === 'list' || !!customer;
  const custMatches = LS_CUSTOMERS.filter((c) => !custQ || `${c.name} ${c.num}`.toLowerCase().includes(custQ.toLowerCase()));
  const payload = (): LinesheetInput => ({ ...doc, itemIds: chosen.map((i) => i.id), season });
  const dirty = !current || JSON.stringify(payload()) !== JSON.stringify({ title: current.title, ctx: current.ctx, customerId: current.customerId, priceListId: current.priceListId, notes: current.notes, showMsrp: current.showMsrp, showMoq: current.showMoq, itemIds: current.itemIds, season: current.season });

  const refresh = () => linesheetApi.list().then(setSaved).catch(() => toast('Could not load saved linesheets', 'error'));
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [season, coll, q]);
  useEffect(() => { if (!priced) return; setResolving(true); const t = setTimeout(() => setResolving(false), 650); return () => clearTimeout(t); }, [doc.ctx, doc.customerId, doc.priceListId, priced]);

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else if (n.size >= MAX_SEL) { toast(`Limit of ${MAX_SEL} styles per linesheet`, 'error'); return s; } else n.add(id); return n; });
  const pageAllOn = visible.length > 0 && visible.every((i) => sel.has(i.id));
  const selectPage = () => setSel((s) => { const n = new Set(s); visible.forEach((i) => (pageAllOn ? n.delete(i.id) : n.add(i.id))); return n; });

  const save = async (asNew = false) => {
    if (!chosen.length) return toast('Select at least one style first', 'error');
    setSaving(true);
    try {
      const res = current && !asNew ? await linesheetApi.update(current.id, payload()) : await linesheetApi.create(payload());
      setCurrent(res); await refresh(); toast(current && !asNew ? 'Linesheet saved' : `Saved “${res.title}”`);
    } catch (e: any) { toast(e.message ?? 'Save failed', 'error'); } finally { setSaving(false); }
  };
  const open = (ls: SavedLinesheet) => { setCurrent(ls); setDoc({ title: ls.title, ctx: ls.ctx === 'list' ? 'list' : 'customer', customerId: ls.customerId, priceListId: ls.priceListId, notes: ls.notes, showMsrp: ls.showMsrp, showMoq: ls.showMoq }); setSel(new Set(ls.itemIds)); setSeason(ls.season || 'all'); setDrawer(false); toast(`Opened “${ls.title}”`); };
  const duplicate = async (ls: SavedLinesheet) => { const c = await linesheetApi.duplicate(ls.id); await refresh(); open(c); };
  const remove = async (ls: SavedLinesheet) => { await linesheetApi.remove(ls.id); if (current?.id === ls.id) setCurrent(null); await refresh(); toast('Linesheet deleted'); };
  const copyLink = async (ls: SavedLinesheet) => { await navigator.clipboard?.writeText(shareUrl(ls.shareToken)); toast('Share link copied — customers can open it without logging in'); };
  const startNew = () => { setCurrent(null); setDoc(EMPTY); setSel(new Set()); setDrawer(false); };

  if (preview) return (
    <div className="ls ls-preview" data-testid="ls-preview-page">
      <div className="ls-preview-bar no-print">
        <button className="ls-back" onClick={() => setPreview(false)} data-testid="ls-back"><ArrowLeft size={16} /> Back to builder</button>
        <span className="ls-preview-info">{chosen.length} styles · {list.name}{customer ? ` · ${customer.name}` : ''}</span>
        {current && <button className="ops-btn" onClick={() => copyLink(current)} data-testid="ls-preview-share"><Link2 size={15} /> Copy share link</button>}
        <button className="ops-btn" onClick={() => window.print()} data-testid="ls-print"><Printer size={15} /> Print</button>
        <button className="ops-btn dark" onClick={() => { toast('Choose "Save as PDF" in the dialog'); setTimeout(() => window.print(), 150); }} data-testid="ls-download"><Download size={15} /> Download PDF</button>
      </div>
      <LinesheetDoc doc={doc} items={chosen} list={list} customerName={customer?.name} />
    </div>
  );

  return (
    <div className="ls" data-testid="linesheet-page">
      <div className="ls-body">
        <section className="ls-card ls-catalog">
          <div className="ls-toolbar">
            <label className="ls-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product code or name…" data-testid="ls-search" />{q && <button onClick={() => setQ('')} aria-label="Clear"><X size={13} /></button>}</label>
            <select className="ls-select" value={season} onChange={(e) => setSeason(e.target.value)} data-testid="ls-season"><option value="all">All seasons</option>{SEASONS.map((s) => <option key={s}>{s}</option>)}</select>
            <select className="ls-select" value={coll} onChange={(e) => setColl(e.target.value)} data-testid="ls-filter-collection"><option value="all">All collections</option>{collections.map((c) => <option key={c}>{c}</option>)}</select>
            <button className="ops-btn" onClick={() => setDrawer(true)} data-testid="ls-open-saved"><FolderOpen size={15} /> Saved <b className="ls-count sm">{saved.length}</b></button>
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
                <span className="ls-item-body"><em className="ls-season">{i.season}</em><strong>{i.name} | {i.color} | {i.size}</strong><small>{i.sku}</small></span>
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
            <div className="ls-builder-top">
              <h2>Export setup</h2>
              {current ? <span className="ls-draft" data-testid="ls-draft-badge"><Save size={12} /> {dirty ? 'Unsaved changes' : `Saved ${rel(current.updatedAt)}`}</span> : <span className="ls-draft muted">New draft</span>}
            </div>
            <label className="ls-field"><span>Document title</span><input maxLength={200} value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} data-testid="ls-title" /><small className="ls-hint">Up to 200 characters<b>{doc.title.length}/200</b></small></label>
            <label className="ls-field"><span>Pricing context</span>
              <select value={doc.ctx} onChange={(e) => setDoc({ ...doc, ctx: e.target.value as Ctx })} data-testid="ls-ctx"><option value="customer">Customer</option><option value="list">Price list</option></select>
            </label>
            {doc.ctx === 'customer' ? (
              <div className="ls-field">
                <span>Customer</span>
                <label className="ls-search block"><Search size={14} /><input value={custQ} onChange={(e) => setCustQ(e.target.value)} placeholder="Search name or number…" data-testid="ls-customer-search" /></label>
                {customer
                  ? <div className="ls-cust-sel" data-testid="ls-customer-selected"><span><b>{customer.name}</b> · #{customer.num} · {list.name}</span><button onClick={() => setDoc({ ...doc, customerId: '' })} data-testid="ls-customer-clear">Clear</button></div>
                  : <ul className="ls-cust-list" data-testid="ls-customer-list">
                      {custMatches.slice(0, 8).map((c) => <li key={c.id}><button onClick={() => { setDoc({ ...doc, customerId: c.id }); setCustQ(''); }} data-testid={`ls-customer-${c.id}`}>{c.name}<small>#{c.num}</small></button></li>)}
                      {custMatches.length === 0 && <li className="ls-muted">No customers match.</li>}
                    </ul>}
                {!customer && <small className="ls-hint">Showing the first {Math.min(8, custMatches.length)} of {custMatches.length} customers. Search to narrow the list.</small>}
              </div>
            ) : (
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
          <div className="ls-actions ls-actions-save">
            <button className="ops-btn dark" onClick={() => save(false)} disabled={!chosen.length || saving || (!!current && !dirty)} data-testid="ls-save">{saving ? <Loader2 size={15} className="ls-spin" /> : <Save size={15} />} {current ? 'Save changes' : 'Save draft'}</button>
            {current && <button className="ops-btn" onClick={() => save(true)} disabled={saving} data-testid="ls-save-as-new" title="Save as new"><FilePlus2 size={15} /></button>}
            {current && <button className="ops-btn" onClick={() => copyLink(current)} data-testid="ls-copy-link" title="Copy share link"><Link2 size={15} /></button>}
          </div>
          <div className="ls-actions">
            <button className="ops-btn" onClick={() => setPreview(true)} disabled={!chosen.length || !priced} data-testid="ls-preview"><Eye size={15} /> Preview</button>
            <button className="ops-btn" onClick={() => { setPreview(true); setTimeout(() => window.print(), 400); }} disabled={!chosen.length || !priced} data-testid="ls-print-direct"><Printer size={15} /> Print</button>
            <button className="ops-btn" onClick={() => { setPreview(true); toast('Choose "Save as PDF" in the dialog'); setTimeout(() => window.print(), 400); }} disabled={!chosen.length || !priced} data-testid="ls-download-direct"><Download size={15} /> Download</button>
          </div>
          <small className="ls-foot-hint">{!priced ? 'Choose a customer to resolve prices.' : resolving ? 'Resolving prices…' : current && !dirty ? 'Saved · share link ready' : `${list.name} · ${chosen.length} styles ready`}</small>
        </aside>
      </div>

      {drawer && (
        <>
          <div className="ls-backdrop" onClick={() => setDrawer(false)} />
          <aside className="ls-drawer" data-testid="ls-saved-drawer">
            <div className="ls-drawer-head"><h2>Saved linesheets</h2><button className="ops-btn" onClick={startNew} data-testid="ls-new"><FilePlus2 size={15} /> New</button><button className="ls-x" onClick={() => setDrawer(false)} aria-label="Close"><X size={16} /></button></div>
            {saved.length === 0 && <p className="ls-muted" style={{ padding: 20 }}>No saved linesheets yet. Build one and hit “Save draft”.</p>}
            <ul className="ls-saved">
              {saved.map((ls) => { const c = LS_CUSTOMERS.find((x) => x.id === ls.customerId); return (
                <li key={ls.id} className={current?.id === ls.id ? 'on' : ''} data-testid={`ls-saved-${ls.id}`}>
                  <div className="ls-saved-thumbs">{CATALOG.filter((i) => ls.itemIds.includes(i.id)).slice(0, 3).map((i) => <span key={i.id} className="ls-thumb xs">{i.image ? <img src={i.image} alt="" /> : <Box size={12} />}</span>)}</div>
                  <div className="ls-saved-main">
                    <strong>{ls.title}</strong>
                    <small>{ls.itemIds.length} styles · {ls.ctx === 'customer' ? c?.name ?? 'No customer' : PRICE_LISTS.find((p) => p.id === ls.priceListId)?.name} · {ls.season === 'all' ? 'All seasons' : ls.season}</small>
                    <small className="ls-muted">Updated {rel(ls.updatedAt)} · {ls.views} view{ls.views === 1 ? '' : 's'}</small>
                  </div>
                  <div className="ls-saved-actions">
                    <button className="ops-btn" onClick={() => open(ls)} data-testid={`ls-saved-open-${ls.id}`}><FolderOpen size={14} /> Open</button>
                    <button className="ls-icon" onClick={() => duplicate(ls)} title="Duplicate" data-testid={`ls-saved-dup-${ls.id}`}><Files size={15} /></button>
                    <button className="ls-icon" onClick={() => copyLink(ls)} title="Copy share link" data-testid={`ls-saved-link-${ls.id}`}><Copy size={15} /></button>
                    <button className="ls-icon danger" onClick={() => remove(ls)} title="Delete" data-testid={`ls-saved-del-${ls.id}`}><Trash2 size={15} /></button>
                  </div>
                </li>
              ); })}
            </ul>
          </aside>
        </>
      )}
    </div>
  );
}
