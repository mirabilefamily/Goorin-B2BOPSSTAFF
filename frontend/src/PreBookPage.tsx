import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Box, Check, ChevronRight, Clock, Download, Info, LayoutGrid, List, Lock as LockIcon, Maximize2, Pencil, Plus, Search, ShoppingCart, Upload } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import { Qty } from './Qty';
import { useBackable } from '@/lib/nav';
import { Lightbox, viewStyle } from './Lightbox';
import './marketplace.css';
import './checkout.css';
import './prebook.css';

type Drop = { id: number; season: string; ship: string; orderBy: string; deadline: string; status: 'closed' | 'open'; daysLeft?: number };
type Item = { id: string; name: string; sku: string; tag: string; price: number; msrp: number; moq: number; moqTarget: number; image: string | null; images: number };

const drops: Drop[] = [
  { id: 1, season: 'SS27', ship: 'Nov 3, 2026 – Nov 10, 2026', orderBy: 'Jul 20, 2026', deadline: 'Jul 20', status: 'closed' },
  { id: 2, season: 'SS27', ship: 'Dec 1, 2026 – Dec 8, 2026', orderBy: 'Aug 21, 2026', deadline: 'Aug 21', status: 'closed' },
  { id: 3, season: 'SS27', ship: 'Jan 5, 2027 – Jan 12, 2027', orderBy: 'Sep 21, 2026', deadline: 'Sep 21', status: 'open', daysLeft: 11 },
];

const img = (n: string) => `/products/${n}.webp`;
const items: Item[] = [
  { id: 'b1', name: 'Crush', sku: '101-0175-BLK01-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 0, moqTarget: 432, image: null, images: 0 },
  { id: 'b2', name: 'Floater', sku: '101-0330-WHT02-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 0, moqTarget: 432, image: null, images: 0 },
  { id: 'b3', name: 'The GOAT', sku: '101-0385-BIS01-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 192, moqTarget: 432, image: null, images: 0 },
  { id: 'b4', name: 'The GOAT', sku: '101-0385-DEN01-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 0, moqTarget: 432, image: img('goat'), images: 4 },
  { id: 'b5', name: 'The Gorilla', sku: '101-0386-BLK01-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 0, moqTarget: 432, image: img('black-sheep'), images: 1 },
  { id: 'b6', name: 'The Deer Rack', sku: '101-0398-GRN04-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 0, moqTarget: 432, image: null, images: 0 },
  { id: 'b7', name: 'The Koala', sku: '101-0443-GRY02-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 192, moqTarget: 432, image: img('panther'), images: 1 },
  { id: 'b8', name: 'El Gallo', sku: '101-0456-WHT01-O/S', tag: 'Carry-Over', price: 8.5, msrp: 42.5, moq: 0, moqTarget: 432, image: img('rooster'), images: 1 },
  { id: 'b9', name: 'The Cancelled Skull', sku: '101-2392-VOI01-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 432, moqTarget: 432, image: img('lone-wolf'), images: 4 },
  { id: 'b10', name: 'Papa Core', sku: '101-2437-EDG01-O/S', tag: 'Papa Core', price: 8.5, msrp: 42.5, moq: 0, moqTarget: 432, image: img('panther'), images: 4 },
  { id: 'b11', name: 'Lone Wolf', sku: '101-2449-NVY01-O/S', tag: 'Original Recipe', price: 8.5, msrp: 42.5, moq: 88, moqTarget: 432, image: img('lone-wolf'), images: 4 },
  { id: 'b12', name: 'Lone Wolf', sku: '101-2449-OLV01-O/S', tag: 'Core Icons', price: 8.5, msrp: 42.5, moq: 0, moqTarget: 432, image: img('lone-wolf'), images: 4 },
];


function Overview({ onOpen, reserved }: { onOpen: (d: Drop) => void; reserved: Record<number, number> }) {
  const next = drops.find((d) => d.status === 'open')!;

  return (
    <div className="pb" data-testid="prebook-page">
      <section className="pb-hero pb-hero--ov pb-hero--v3">
        <div className="pb-hero-main">
          <p className="pb-eyebrow">Seasonal pre-book · {next.season}</p>
          <h1>Pre-Book Window Open</h1>
          <p className="pb-lede">Reserve units ahead of production. Orders confirm once each drop hits its minimum-order quantity.</p>
          <p className="pb-hero-facts"><span><b>{drops.filter((d) => d.status === 'open').length}</b> drop open</span><i /><span><b>{drops.filter((d) => d.status === 'closed').length}</b> closed</span><i /><span>Ships <b>{next.ship}</b></span></p>
        </div>
        <div className="pb-deadline pb-deadline--v3" data-testid="prebook-next-deadline">
          <div className="pb-deadline-top"><small>Next deadline · Drop {next.id}</small><em>{next.daysLeft} days left</em></div>
          <strong>{next.deadline}</strong>
          <div className="pb-deadline-bar"><i style={{ width: `${Math.max(6, Math.min(100, 100 - (next.daysLeft / 45) * 100))}%` }} /></div>
          <span>Order by {next.orderBy}</span>
        </div>
      </section>

      <div className="pb-cols">
        <section>
          <h2 className="pb-h2">Drops this season</h2>
          <div className="pb-drops">
            {drops.map((d) => {
              const closed = d.status === 'closed';
              return (
                <button key={d.id} className={`pb-drop ${d.status}`} disabled={closed} aria-disabled={closed} onClick={() => !closed && onOpen(d)} data-testid={`drop-${d.id}`}>
                  <div className="pb-drop-head">
                    <span className="pb-drop-icon">{closed ? <LockIcon /> : <BookOpen />}</span>
                    <div><div className="pb-drop-title"><strong>Drop {d.id}</strong><em className={d.status}>{closed ? 'Closed' : 'Open'}</em></div><span>{closed ? 'Window closed' : `${d.season} · ${d.daysLeft} days left`}</span></div>
                    {reserved[d.id] > 0 && <span className="pb-drop-reserved" data-testid={`drop-${d.id}-reserved`}>{reserved[d.id]} units reserved</span>}
                    {!closed && <span className="pb-drop-cta" data-testid={`drop-${d.id}-cta`}>Reserve units <ArrowRight /></span>}
                  </div>
                  <dl className="pb-drop-meta">
                    <div><dt>Ship window</dt><dd>{d.ship}</dd></div>
                    <div><dt>Order by</dt><dd>{d.orderBy}</dd></div>
                    {!closed && <div><dt>Season</dt><dd>{d.season}</dd></div>}
                  </dl>
                </button>
              );
            })}
          </div>
        </section>
        <aside>
          <h2 className="pb-h2">How pre-book works</h2>
          <ol className="pb-how">
            <li><i>1</i><div><strong>Reserve units</strong><span>Choose quantities for each product. No commitment yet — just securing your allocation.</span></div></li>
            <li><i>2</i><div><strong>MOQ confirmed</strong><span>Once the drop hits its minimum order quantity, reservations convert to confirmed orders.</span></div></li>
            <li><i>3</i><div><strong>Ships on time</strong><span>Your order ships in the window stated. You're invoiced only after the drop is confirmed.</span></div></li>
          </ol>
        </aside>
      </div>
    </div>
  );
}

function DropBuilder({ drop, onBack, onSubmitted, qty, setQty }: { drop: Drop; onBack: () => void; onSubmitted: () => void; qty: Record<string, number>; setQty: React.Dispatch<React.SetStateAction<Record<string, number>>> }) {
  const notify = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'tile' | 'list'>('tile');
  const [sameBill, setSameBill] = useState(true);
  const [po, setPo] = useState('');
  const [notes, setNotes] = useState('');
  const [customWindow, setCustomWindow] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const asLb = (it: Item) => ({ id: it.id, name: it.name, sku: it.sku, price: it.price, msrp: it.msrp, max: 999, available: 999, image: it.image, images: Math.max(1, it.images), tag: it.tag });

  const list = useMemo(() => { const q = query.trim().toLowerCase(); return q ? items.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)) : items; }, [query]);
  const lines = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const units = lines.reduce((s, i) => s + qty[i.id], 0);
  const total = lines.reduce((s, i) => s + qty[i.id] * i.price, 0);
  const set = (id: string, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(999, n)) }));

  return (
    <div className="pb pb--builder" data-testid="prebook-drop-page">
      <div className="pb-topline">
        <div><button className="pb-back pb-back--pill" onClick={onBack} data-testid="prebook-back"><ArrowLeft /> Pre-Book</button></div>
        <ol className="pb-steps" data-testid="prebook-steps">
          <li className={step === 1 ? 'current' : 'done'}><span>{step > 1 ? <Check /> : 1}</span>Build order</li>
          <li className={step === 2 ? 'current' : ''}><span>2</span>Review &amp; submit</li>
        </ol>
        <span className="pb-closes"><Clock /> Closes <strong>{drop.deadline}</strong></span>
      </div>

      <section className="pb-hero pb-hero--drop pb-hero--drop3">
        <div className="pb-hero-main">
          <p className="pb-eyebrow">Pre-book drop · {drop.season}</p>
          <h1>Drop {drop.id} <em className="pb-open-tag">Open</em></h1>
          <p className="pb-lede pb-lede--sm">Reserve quantities below. Styles confirm once they reach their minimum order quantity.</p>
        </div>
        <dl className="pb-facts" data-testid="pb-hero-facts">
          <div><dt>Order by</dt><dd>{drop.orderBy}<small>12:00 PM · {drop.daysLeft} days left</small></dd></div>
          <div><dt>Ships</dt><dd>{drop.ship.replace(/, 20\d\d/, '')}<small>Est. window</small></dd></div>
          <div className={units > 0 ? 'has' : ''}><dt>Reserved</dt><dd data-testid="pb-hero-units">{units} <span>units</span><small>{units > 0 ? `${lines.length} style${lines.length === 1 ? '' : 's'}` : 'Nothing yet'}</small></dd></div>
        </dl>
      </section>

      <div className="pb-build">
        <div className="pb-catalog">
          {step === 1 ? (
            <>
              <div className="pb-toolbar">
                <label className="mk-search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this drop..." data-testid="pb-search" /></label>
                <div className="mk-segment" role="tablist">
                  <button role="tab" aria-selected={view === 'tile'} className={view === 'tile' ? 'active' : ''} onClick={() => setView('tile')} aria-label="Tile view" data-testid="pb-view-tile"><LayoutGrid /></button>
                  <button role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view" data-testid="pb-view-list"><List /></button>
                </div>
                <button className="mk-btn" onClick={() => notify('Template downloaded', 'success')} data-testid="pb-template"><Download /> Template</button>
                <button className="mk-btn" onClick={() => notify('Upload a filled template to import quantities.', 'info')} data-testid="pb-import"><Upload /> Import</button>
              </div>
              <div className={`mk-grid pb-grid ${view === 'list' ? 'mk-grid--list' : ''}`}>
                {list.map((it) => {
                  const q = qty[it.id] ?? 0;
                  const met = it.moq >= it.moqTarget;
                  return (
                    <article key={it.id} className={`mk-card ${view === 'list' ? 'mk-card--list' : ''}`} data-testid={`pb-card-${it.id}`}>
                      <div className="mk-media">
                        <button className="mk-media-btn" onClick={() => setOpen(it)} aria-label={`Enlarge ${it.name}`} data-testid={`pb-enlarge-${it.id}`}>
                          {it.image ? <img src={it.image} alt={it.name} loading="lazy" style={viewStyle(0)} /> : <span className="pb-skuph">{it.sku}</span>}
                          <span className="mk-zoom"><Maximize2 /></span>
                        </button>
                        <span className="mk-recipe">{it.tag}</span>
                        {it.images > 1 && <span className="mk-dots"><button className="on" aria-label="Image 1" /><button aria-label="Image 2" /><button aria-label="Image 3" /><button aria-label="Image 4" /></span>}
                      </div>
                      <div className="mk-body">
                        <div className="mk-title"><h3>{it.name}</h3><button className="mk-info" aria-label="Product details"><Info /></button></div>
                        <p className="mk-sku">{it.sku}</p>
                        <div className="mk-price"><strong>{money(it.price)}</strong><small>WHSL</small><span>MSRP {money(it.msrp)}</span></div>
                        {met || it.moq + q >= it.moqTarget ? <p className="mk-stock"><span className="pb-moq-met">MOQ Met</span></p> : <p className="mk-stock">MOQ {it.moq + q}/{it.moqTarget}<span className="pb-moq-left">{it.moqTarget - it.moq - q} more to confirm</span></p>}
                        <div className="pb-moqbar"><span style={{ width: `${Math.min(100, ((it.moq + q) / it.moqTarget) * 100)}%` }} /></div>
                        {q > 0 ? (
                          <div className="mk-line" data-testid={`pb-line-${it.id}`}><Qty id={it.id} value={q} max={999} onChange={(n) => set(it.id, n)} /><strong className="mk-line-total">{money(q * it.price)}</strong></div>
                        ) : (
                          <button className="mk-add" onClick={() => set(it.id, 1)} data-testid={`pb-add-${it.id}`}><Plus /> Add to cart</button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="pb-review" data-testid="prebook-review">
              <h2>Review pre-book order</h2>
              <p>Confirm quantities for Drop {drop.id}. Reservations convert to confirmed orders once the drop reaches MOQ.</p>
              <table className="dash-table pb-table">
                <thead><tr><th>Style</th><th>SKU</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
                <tbody>{lines.map((i) => <tr key={i.id}><td className="dash-td-id">{i.name}</td><td>{i.sku}</td><td>{qty[i.id]}</td><td>{money(i.price)}</td><td className="dash-td-total">{money(qty[i.id] * i.price)}</td></tr>)}</tbody>
              </table>
              <div className="pb-review-meta">
                <div><small>Ship to</small><strong>Ryan Mirabile · Mirabile Distribution</strong><span>15354 Rising View Dr # 1 · Montverde, FL 34756</span></div>
                <div><small>Terms</small><strong>50% Prepay, 50% Net 60</strong><span>Invoiced only after the drop confirms and ships</span></div>
                {po && <div><small>PO reference</small><strong>{po}</strong></div>}
                {notes && <div><small>Order notes</small><strong>{notes}</strong></div>}
              </div>
              <div className="co-actions">
                <button className="co-secondary" onClick={() => setStep(1)} data-testid="pb-edit-order"><ArrowLeft /> Edit order</button>
                <button className="co-primary" onClick={() => { notify(`Pre-book submitted · Drop ${drop.id} · ${units} units · ${money(total)}`, 'success'); onSubmitted(); }} data-testid="pb-submit">Submit pre-book order · {money(total)}</button>
              </div>
            </div>
          )}
        </div>

        {open && <Lightbox p={asLb(open)} start={0} inCart={qty[open.id] ?? 0} onAdd={() => set(open.id, 1)} onQty={(n) => set(open.id, n)} onClose={() => setOpen(null)} />}

        <aside className="pb-cart" data-testid="prebook-cart">
          <header><h3><ShoppingCart /> Pre-book cart</h3><span data-testid="pb-cart-units">{units} units</span></header>
          <div className="pb-cart-body">
            <div className="pb-note"><strong>Prices held for this drop.</strong> Your account is invoiced only after the drop confirms and ships.</div>
            {lines.length === 0 ? (
              <div className="pb-cart-empty" data-testid="pb-cart-empty"><ShoppingCart /><span>Your cart is empty</span></div>
            ) : (
              <ul className="pb-cart-lines">
                {lines.map((i) => (
                  <li key={i.id} data-testid={`pb-cart-line-${i.id}`}>
                    <span className="pb-cart-thumb">{i.image ? <img src={i.image} alt="" /> : <Box />}</span>
                    <div className="pb-cart-text"><strong>{i.name}</strong><span>{i.sku}</span></div>
                    <Qty id={`cart-${i.id}`} value={qty[i.id]} max={999} onChange={(n) => set(i.id, n)} />
                    <b>{money(qty[i.id] * i.price)}</b>
                  </li>
                ))}
              </ul>
            )}
            <div className="pb-field"><small>Shipping method</small><div className="co-address is-selected is-radio co-delivery" role="radio" aria-checked><span className="co-radio"><i /></span><strong>Customer Routed</strong></div></div>
            <div className="pb-field"><div className="pb-field-head"><small>Ship to</small><button className="mk-btn pb-addbtn" onClick={() => notify('Address book coming soon', 'info')} data-testid="pb-add-address"><Plus /> Add address</button></div>
              <div className="co-address is-selected is-radio" role="radio" aria-checked><span className="co-radio"><i /></span><div className="co-address-body"><strong>Ryan Mirabile</strong><span>Mirabile Distribution</span><span>15354 Rising View Dr # 1...</span></div><div className="co-address-side"><em>Both</em><button type="button" className="co-edit"><Pencil /> Edit</button></div></div>
            </div>
            <div className="pb-field"><small>Bill to</small><label className="co-check"><input type="checkbox" checked={sameBill} onChange={(e) => setSameBill(e.target.checked)} data-testid="pb-same-bill" /><span /> Same as shipping address</label></div>
            <div className="pb-field"><small>PO reference</small><input className="co-input" value={po} onChange={(e) => setPo(e.target.value)} placeholder="Your purchase-order number" data-testid="pb-po" /></div>
            <div className="pb-field"><small>Order notes</small><textarea className="co-input pb-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note for our team..." data-testid="pb-notes" /></div>
            <label className="co-check pb-upper"><input type="checkbox" checked={customWindow} onChange={(e) => setCustomWindow(e.target.checked)} data-testid="pb-custom-window" /><span /> Request a custom ship window</label>
          </div>
          <footer className="pb-cart-foot">
            <div className="pb-tot"><span>{lines.length} style{lines.length === 1 ? '' : 's'} · {units} units</span><span data-testid="pb-cart-total">{money(total)}</span></div>
            <div className="pb-tot"><span>Shipping</span><span>Customer routed</span></div>
            <div className="pb-tot pb-tot--grand"><span>Estimated total</span><span>{money(total)}</span></div>
            <p>Invoiced only after the drop confirms and ships.</p>
            <small className="pb-est">Estimated ship window</small><strong className="pb-est-val">{drop.ship}</strong>
            <button className="co-secondary pb-full" onClick={() => notify('Draft saved', 'success')} data-testid="pb-save-draft">Save draft</button>
            <button className="co-primary pb-full" disabled={units === 0 || step === 2} onClick={() => setStep(2)} data-testid="pb-review-btn">Review pre-book order <ChevronRight /></button>
            <button className="pb-dup" onClick={() => notify('Duplicated for another location', 'info')} data-testid="pb-duplicate">Duplicate for another location</button>
          </footer>
        </aside>
      </div>

      {units > 0 && step === 1 && (
        <div className="pb-mobilebar" data-testid="pb-mobile-bar">
          <div><strong>{units} units</strong><span>{lines.length} style{lines.length === 1 ? '' : 's'} · {money(total)}</span></div>
          <button onClick={() => document.querySelector('[data-testid="prebook-cart"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} data-testid="pb-mobile-review">Review <ChevronRight /></button>
        </div>
      )}
    </div>
  );
}

export default function PreBookPage({ onNavigate }: { onNavigate: (l: string) => void }) {
  const [drop, setDrop] = useState<Drop | null>(null);
  useBackable(!!drop, () => setDrop(null));
  const [carts, setCarts] = useState<Record<number, Record<string, number>>>({});
  const reserved = Object.fromEntries(drops.map((d) => [d.id, Object.values(carts[d.id] ?? {}).reduce((s, n) => s + n, 0)]));
  if (drop) {
    const qty = carts[drop.id] ?? {};
    const setQty: React.Dispatch<React.SetStateAction<Record<string, number>>> = (u) => setCarts((c) => ({ ...c, [drop.id]: typeof u === 'function' ? u(c[drop.id] ?? {}) : u }));
    return <DropBuilder drop={drop} qty={qty} setQty={setQty} onBack={() => setDrop(null)} onSubmitted={() => { setCarts((c) => ({ ...c, [drop.id]: {} })); setDrop(null); onNavigate('My Orders'); }} />;
  }
  return <Overview onOpen={setDrop} reserved={reserved} />;
}
