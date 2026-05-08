import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Download } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-zinc-300 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Inventory Matrix</h1>
          <p className="label-micro mt-1 font-bold">Stock Database / Registry</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-black text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg">
            <Plus size={16} /> ADD PRODUCT
          </button>
          <button className="flex items-center gap-2 border border-zinc-300 px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all">
            <Download size={16} /> EXPORT CSV
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white border border-zinc-300 p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH BY NAME, SKU OR BARCODE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 p-3 pl-10 text-[11px] font-mono font-bold uppercase outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 border border-zinc-200 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50">
          <Filter size={16} /> FILTER
        </button>
      </div>

      <div className="bg-white border border-zinc-300 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_200px_100px_120px_120px_120px] bg-zinc-900 text-white p-4">
          <div className="col-header text-white opacity-40">SKU</div>
          <div className="col-header text-white opacity-40">Product Name</div>
          <div className="col-header text-white opacity-40">Category</div>
          <div className="col-header text-white opacity-40 text-right">Stock</div>
          <div className="col-header text-white opacity-40 text-right">Unit</div>
          <div className="col-header text-white opacity-40 text-right">Purchase</div>
          <div className="col-header text-white opacity-40 text-right">Price</div>
        </div>

        {filtered.map((product) => (
          <div key={product.id} className="technical-row grid grid-cols-[80px_1fr_200px_100px_120px_120px_120px] items-center">
            <div className="font-mono text-[10px] font-bold opacity-60">{product.sku}</div>
            <div className="font-bold text-sm tracking-tight">{product.name}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{product.category.name}</div>
            <div className={`text-right font-mono font-bold text-sm ${product.currentStock <= product.minStockLevel ? 'text-red-500' : ''}`}>
              {product.currentStock}
            </div>
            <div className="text-right text-[10px] font-bold uppercase opacity-60">{product.unitType}</div>
            <div className="text-right font-mono text-[11px] opacity-60">XAF {product.purchasePrice.toLocaleString()}</div>
            <div className="text-right font-mono font-bold text-blue-600">XAF {product.sellingPrice.toLocaleString()}</div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">NO RECORDS FOUND IN CURRENT MATRIX</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        <div>Showing {filtered.length} of {products.length} products</div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-zinc-300 opacity-50 cursor-not-allowed">PREV</button>
          <button className="px-3 py-1 border border-zinc-300">NEXT</button>
        </div>
      </div>
    </div>
  );
}
