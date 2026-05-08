import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Filter, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { apiFetch } from '../lib/api';

export default function Inventory() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    categoryId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    unitType: 'PIECE',
    currentStock: 0
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const prodRes = await apiFetch(`/api/products?search=${encodeURIComponent(search)}&page=${page}`);
      const prodData = await prodRes.json();
      setProducts(prodData.products);
      setTotalPages(prodData.pages);
      setTotalCount(prodData.total);

      const catRes = await apiFetch('/api/categories');
      const catData = await catRes.json();
      setCategories(catData);
      if (catData.length > 0 && !newProduct.categoryId) {
        setNewProduct(prev => ({ ...prev, categoryId: catData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchData();
      }
    } catch (error) {
      alert('Failed to add product');
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-zinc-300 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">{t('inventory')}</h1>
          <p className="label-micro mt-1 font-bold">Stock Database / Registry</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg"
          >
            <Plus size={16} /> {t('addProduct')}
          </button>
          <button className="flex items-center gap-2 border border-zinc-300 px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all">
            <Download size={16} /> EXPORT CSV
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
              <h2 className="text-xl font-black uppercase tracking-tight">{t('addProduct')}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-4">
              <div className="col-span-1 space-y-1">
                <label className="label-micro">{t('sku')}</label>
                <input required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-bold outline-none" />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="label-micro">{t('unit')}</label>
                <select value={newProduct.unitType} onChange={e => setNewProduct({...newProduct, unitType: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-bold outline-none">
                  {['PIECE', 'BAG', 'KG', 'BUNDLE', 'METRE'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="label-micro">{t('name')}</label>
                <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-bold outline-none" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="label-micro">{t('category')}</label>
                <select required value={newProduct.categoryId} onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-bold outline-none">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-1 space-y-1">
                <label className="label-micro">Purchase Price (XAF)</label>
                <input type="number" required value={newProduct.purchasePrice} onChange={e => setNewProduct({...newProduct, purchasePrice: Number(e.target.value)})} className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-mono font-bold outline-none" />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="label-micro">Selling Price (XAF)</label>
                <input type="number" required value={newProduct.sellingPrice} onChange={e => setNewProduct({...newProduct, sellingPrice: Number(e.target.value)})} className="w-full bg-zinc-50 border border-zinc-200 p-2 text-xs font-mono font-bold outline-none" />
              </div>
              <div className="col-span-2 pt-4">
                <button type="submit" className="w-full bg-black text-white p-4 font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all">
                  {t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center bg-white border border-zinc-300 p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH BY NAME, SKU OR BARCODE..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-zinc-50 border border-zinc-200 p-3 pl-10 text-[11px] font-mono font-bold uppercase outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 border border-zinc-200 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50">
          <Filter size={16} /> FILTER
        </button>
      </div>

      <div className="bg-white border border-zinc-300 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_200px_100px_120px_120px_120px] bg-zinc-900 text-white p-4">
          <div className="col-header text-white opacity-40">{t('sku')}</div>
          <div className="col-header text-white opacity-40">{t('name')}</div>
          <div className="col-header text-white opacity-40">{t('category')}</div>
          <div className="col-header text-white opacity-40 text-right">Stock</div>
          <div className="col-header text-white opacity-40 text-right">{t('unit')}</div>
          <div className="col-header text-white opacity-40 text-right">Purchase</div>
          <div className="col-header text-white opacity-40 text-right">{t('price')}</div>
        </div>

        {loading ? (
          <div className="p-20 text-center animate-pulse">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">ACCESSING ENGINE DATABASE...</p>
          </div>
        ) : (
          <>
            {products.map((product) => (
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

            {products.length === 0 && (
              <div className="p-20 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">NO RECORDS FOUND IN CURRENT MATRIX</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        <div>Showing {products.length} of {totalCount} products</div>
        <div className="flex gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1 border border-zinc-300 disabled:opacity-30 hover:bg-zinc-50 transition-colors"
          >
            <ChevronLeft size={14} /> PREV
          </button>
          <div className="px-4 py-1 flex items-center bg-zinc-100 text-black">
            PAGE {page} / {totalPages}
          </div>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1 border border-zinc-300 disabled:opacity-30 hover:bg-zinc-50 transition-colors"
          >
            NEXT <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
