import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Minus, X, CreditCard, Banknote, Smartphone, Receipt, Trash2, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { useTranslation } from '../lib/i18n';
import { apiFetch } from '../lib/api';

export default function POS() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionType, setTransactionType] = useState<'ENTRY' | 'EXIT'>('EXIT'); // EXIT = Sortie, ENTRY = Entrée
  const { user } = useAuthStore();
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/products?search=${encodeURIComponent(search)}&limit=10`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
    
    // Shortcut keys handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') searchRef.current?.focus();
      if (e.key === 'F9') handleCheckout();
      if (e.key === 'F4') setTransactionType(prev => prev === 'EXIT' ? 'ENTRY' : 'EXIT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchProducts]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, productId: product.id }];
    });
    setSearch('');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const isEntry = transactionType === 'ENTRY';
  const subtotal = cart.reduce((acc, item) => acc + ( (isEntry ? item.purchasePrice : item.sellingPrice) * item.quantity), 0);
  const tax = isEntry ? 0 : subtotal * 0.1925; // No tax on restock entry
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await apiFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          items: cart.map(i => ({ 
            productId: i.id, 
            quantity: i.quantity, 
            price: isEntry ? i.purchasePrice : i.sellingPrice 
          })),
          paymentMethod,
          totalAmount: subtotal,
          netAmount: total,
          tax,
          discount: 0,
          type: transactionType
        })
      });
      
      if (res.ok) {
        alert(isEntry ? 'Stock Replenished' : 'Transaction Completed Successfully');
        setCart([]);
        fetchProducts(); // Refresh stock locally after checkout
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      alert('Checkout failed. System is offline or unauthorized.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isEntry ? 'bg-blue-50' : 'bg-zinc-100'}`}>
      {/* Left Area: Product Selection */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tighter">Terminal_POS_01</h1>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit ${isEntry ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
              Mode: {isEntry ? t('stockEntry') : t('stockExit')}
            </span>
          </div>
          
          <div className="flex items-center gap-4 bg-white border border-zinc-300 p-1 rounded-sm shadow-sm">
            <button 
              onClick={() => setTransactionType('ENTRY')}
              className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${isEntry ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-black'}`}
            >
              ENTRÉE <span className="text-[8px] opacity-40 ml-1">F4</span>
            </button>
            <button 
              onClick={() => setTransactionType('EXIT')}
              className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${!isEntry ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-400 hover:text-black'}`}
            >
              SORTIE <span className="text-[8px] opacity-40 ml-1">F4</span>
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-zinc-400">
            <Search size={20} />
            <span className="text-[10px] font-bold border border-zinc-300 px-1 rounded-sm bg-white">F2</span>
          </div>
          <input 
            ref={searchRef}
            type="text" 
            placeholder={t('search').toUpperCase()}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-white border-2 p-5 pl-16 text-lg font-bold uppercase outline-none transition-all shadow-sm ${isEntry ? 'border-dashed border-blue-400 focus:border-blue-600' : 'border-zinc-200 focus:border-black'}`}
          />
          {search && (
            <div className="absolute top-full left-0 w-full bg-white border border-zinc-300 shadow-2xl z-10 mt-1 max-h-[400px] overflow-y-auto">
              {filtered.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className={`flex justify-between items-center p-4 hover:text-white cursor-pointer group border-b border-zinc-100 ${isEntry ? 'hover:bg-blue-600' : 'hover:bg-black'}`}
                >
                  <div>
                    <div className="font-bold uppercase text-sm">{product.name}</div>
                    <div className="text-[10px] font-mono opacity-50 uppercase">{product.sku} | STOCK: {product.currentStock}</div>
                  </div>
                  <div className={`font-mono font-bold group-hover:text-white ${isEntry ? 'text-zinc-600' : 'text-blue-600'}`}>
                    XAF {(isEntry ? product.purchasePrice : product.sellingPrice).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(0, 12).map(product => (
              <button 
                key={product.id} 
                onClick={() => addToCart(product)}
                className={`bg-white border p-4 text-left hover:shadow-lg transition-all active:scale-95 flex flex-col justify-between h-32 group ${isEntry ? 'border-blue-100 hover:border-blue-600' : 'border-zinc-200 hover:border-black'}`}
              >
                <div>
                  <div className="text-[9px] font-bold text-zinc-400 uppercase mb-1 tracking-tighter">{product.sku}</div>
                  <div className="font-bold text-xs uppercase leading-tight line-clamp-2">{product.name}</div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold bg-zinc-100 px-1 uppercase text-zinc-500">{product.unitType}</span>
                  <div className={`font-mono font-bold text-sm group-hover:text-black transition-colors ${isEntry ? 'text-zinc-400' : 'text-blue-600'}`}>
                    XAF {(isEntry ? product.purchasePrice : product.sellingPrice).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* ... existing categories footer ... */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {['Cement', 'Electrical', 'Plumbing', 'Tools', 'Paint', 'Steel'].map(cat => (
            <button key={cat} className="whitespace-nowrap bg-zinc-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-300">
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Right Area: Cart & Checkout */}
      <div className={`w-[450px] bg-white border-l flex flex-col shadow-2xl transition-all ${isEntry ? 'border-blue-200' : 'border-zinc-300'}`}>
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-zinc-400" />
            <h2 className="text-lg font-black uppercase tracking-tighter">
              {isEntry ? 'Loading Buffer' : 'Current Session'}
            </h2>
          </div>
          <button onClick={() => setCart([])} className="text-zinc-400 hover:text-red-500">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className={`flex gap-4 p-3 border group transition-all ${isEntry ? 'bg-blue-50 border-blue-100' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">{item.sku}</div>
                <div className="font-bold text-xs uppercase leading-tight mb-2">{item.name}</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-zinc-300 bg-white shadow-sm overflow-hidden rounded-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-zinc-100"><Minus size={14} /></button>
                    <span className="w-10 text-center font-mono font-bold text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-zinc-100"><Plus size={14} /></button>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400">@ XAF {(isEntry ? item.purchasePrice : item.sellingPrice).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-col justify-between items-end">
                <button onClick={() => removeFromCart(item.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
                <div className="font-mono font-bold text-sm">
                  XAF {((isEntry ? item.purchasePrice : item.sellingPrice) * item.quantity).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-300 opacity-50 py-20">
              <Receipt size={64} className="mb-4" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">{isEntry ? 'No Items to Add' : 'Empty Cart Buffer'}</p>
            </div>
          )}
        </div>

        <div className={`p-6 text-white space-y-6 transition-colors duration-500 ${isEntry ? 'bg-blue-900' : 'bg-zinc-900'}`}>
          <div className="space-y-2">
            <div className="flex justify-between text-xs opacity-60 uppercase font-bold tracking-widest">
              <span>{isEntry ? 'Cost Total' : 'Subtotal'}</span>
              <span>XAF {subtotal.toLocaleString()}</span>
            </div>
            {!isEntry && (
              <div className="flex justify-between text-xs opacity-60 uppercase font-bold tracking-widest">
                <span>Taxes (VAT 19.25%)</span>
                <span>XAF {tax.toLocaleString()}</span>
              </div>
            )}
            <div className={`flex justify-between text-2xl font-black uppercase tracking-tighter pt-4 border-t ${isEntry ? 'border-blue-800 text-blue-200' : 'border-zinc-800 text-green-400'}`}>
              <span>{isEntry ? 'Investment' : 'Payable'}</span>
              <span>XAF {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <PaymentTab active={paymentMethod === 'CASH'} onClick={() => setPaymentMethod('CASH')} icon={<Banknote size={16}/>} label={isEntry ? 'Supplier' : 'Cash'} />
            <PaymentTab active={paymentMethod === 'MOMO'} onClick={() => setPaymentMethod('MOMO')} icon={<Smartphone size={16}/>} label="Mobile" />
            <PaymentTab active={paymentMethod === 'BANK'} onClick={() => setPaymentMethod('BANK')} icon={<CreditCard size={16}/>} label="Bank" />
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full font-black py-5 uppercase tracking-[0.4em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 ${isEntry ? 'bg-blue-400 hover:bg-blue-300 text-black' : 'bg-green-500 hover:bg-green-400 text-black'}`}
          >
            {isProcessing ? 'PROCESSING...' : (
              <>
                <span className="bg-black/10 px-2 py-0.5 rounded text-[10px]">F9</span>
                {t('complete')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const PaymentTab = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-3 border ${active ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'} transition-all`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
