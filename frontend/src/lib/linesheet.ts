import { products } from './products';

export type LsItem = { id: string; name: string; sku: string; style: string; collection: string; shape: string; season: string; colors: string[]; base: number; msrp: number; image: string | null; moq: number; delivery: string };
export type PriceList = { id: string; name: string; mult: number; note: string };
export type LsCustomer = { id: string; name: string; priceList: string; contact: string };

export const PRICE_LISTS: PriceList[] = [
  { id: 'usw', name: 'US Wholesale', mult: 1, note: 'Standard wholesale · Net 30' },
  { id: 'key', name: 'Key Account', mult: 0.92, note: 'Volume tier · Net 60' },
  { id: 'dist', name: 'Distributor', mult: 0.55, note: 'FOB factory · prepay 50%' },
  { id: 'intl', name: 'International EUR', mult: 1.08, note: 'EUR equivalent · DDP' },
];

export const LS_CUSTOMERS: LsCustomer[] = [
  { id: 'c1', name: 'Mirabile Distribution', priceList: 'dist', contact: 'Ryan M' },
  { id: 'c2', name: 'Lids', priceList: 'key', contact: 'Buying team' },
  { id: 'c3', name: 'Buckle Inc., The', priceList: 'key', contact: 'Merch dept' },
  { id: 'c4', name: 'SASAtrend', priceList: 'dist', contact: 'Ling Zhao' },
  { id: 'c5', name: 'Grupo Gardea SA DE CV', priceList: 'dist', contact: 'Diego R' },
  { id: 'c6', name: 'Hat Club', priceList: 'usw', contact: 'Store ops' },
  { id: 'c7', name: 'Urban Outfitters', priceList: 'key', contact: 'Accessories buyer' },
];

export const SEASONS = ['SS27', 'FW26', 'Core'];
const SEASON_OF = (i: number) => (i % 3 === 0 ? 'FW26' : i % 3 === 1 ? 'SS27' : 'Core');
const COLORS = [['Black', 'Olive', 'Navy'], ['Vintage Black', 'Whiskey'], ['Charcoal', 'Sand', 'Bone'], ['Black'], ['Denim', 'Black']];
const DELIVERY: Record<string, string> = { SS27: 'Jan 15 – Feb 28, 2027', FW26: 'Jul 15 – Aug 30, 2026', Core: 'At once · ATS' };

export const CATALOG: LsItem[] = products.map((p, i) => ({
  id: p.id, name: p.name, sku: p.sku, style: p.sku.split('-').slice(0, 2).join('-'), collection: p.collection, shape: p.shape,
  season: SEASON_OF(i), colors: COLORS[i % COLORS.length], base: p.price, msrp: p.msrp, image: p.image, moq: p.shape === 'Snapback' ? 12 : 6, delivery: DELIVERY[SEASON_OF(i)],
}));

export const priceFor = (item: LsItem, list: PriceList) => Math.round(item.base * list.mult * 100) / 100;
export const fmt = (n: number, cur = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur === 'EUR' ? 'EUR' : 'USD' }).format(n);
