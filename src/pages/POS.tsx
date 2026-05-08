import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, X, CreditCard, Banknote, Smartphone, Receipt, Trash2, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../lib/store';

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuthStore();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
      
    // Shortcut to focus search
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') searchRef.current?.focus();
      if (e.key === 'F9') handleCheckout();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% VAT example
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.sellingPrice })),
          paymentMethod,
          totalAmount: subtotal,
          netAmount: total,
          tax,
          discount: 0
        })
      });
      
      if (res.ok) {
        alert('Transaction Completed Successfully');
        setCart([]);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      alert('Checkout failed. System is offline.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="flex h-[calc(100vh-0px)] bg-zinc-100 overflow-hidden">
      {/* Left Area: Product Selection */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Terminal_POS_01</h1>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="label-micro">Operator</p>
              <p className="text-[10px] font-black uppercase">{user?.name}</p>
            </div>
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
            placeholder="SCAN BARCODE OR SEARCH PRODUCT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-zinc-200 p-5 pl-16 text-lg font-bold uppercase outline-none focus:border-black transition-all shadow-sm"
          />
          {search && (
            <div className="absolute top-full left-0 w-full bg-white border border-zinc-300 shadow-2xl z-10 mt-1 max-h-[400px] overflow-y-auto">
              {filtered.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className="flex justify-between items-center p-4 hover:bg-zinc-900 hover:text-white cursor-pointer group border-b border-zinc-100"
                >
                  <div>
                    <div className="font-bold uppercase text-sm">{product.name}</div>
                    <div className="text-[10px] font-mono opacity-50 uppercase">{product.sku} | STOCK: {product.currentStock}</div>
                  </div>
                  <div className="font-mono font-bold text-blue-600 group-hover:text-white">
                    XAF {product.sellingPrice.toLocaleString()}
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
                className="bg-white border border-zinc-200 p-4 text-left hover:border-black hover:shadow-lg transition-all active:scale-95 flex flex-col justify-between h-32 group"
              >
                <div>
                  <div className="text-[9px] font-bold text-zinc-400 uppercase mb-1 tracking-tighter">{product.sku}</div>
                  <div className="font-bold text-xs uppercase leading-tight line-clamp-2">{product.name}</div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold bg-zinc-100 px-1 uppercase text-zinc-500">{product.unitType}</span>
                  <div className="font-mono font-bold text-sm text-blue-600 group-hover:text-black transition-colors">
                    XAF {product.sellingPrice.toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {['Cement', 'Electrical', 'Plumbing', 'Tools', 'Paint', 'Steel'].map(cat => (
            <button key={cat} className="whitespace-nowrap bg-zinc-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-300">
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Right Area: Cart & Checkout */}
      <div className="w-[450px] bg-white border-l border-zinc-300 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-zinc-400" />
            <h2 className="text-lg font-black uppercase tracking-tighter">Current Session</h2>
          </div>
          <button onClick={() => setCart([])} className="text-zinc-400 hover:text-red-500">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 bg-zinc-50 p-3 border border-zinc-200 group">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">{item.sku}</div>
                <div className="font-bold text-xs uppercase leading-tight mb-2">{item.name}</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-zinc-300 bg-white">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-zinc-100"><Minus size={14} /></button>
                    <span className="w-10 text-center font-mono font-bold text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-zinc-100"><Plus size={14} /></button>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400">@ XAF {item.sellingPrice.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-col justify-between items-end">
                <button onClick={() => removeFromCart(item.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
                <div className="font-mono font-bold text-sm">
                  XAF {(item.sellingPrice * item.quantity).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-300 opacity-50 py-20">
              <Receipt size={64} className="mb-4" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Cart Buffer</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-900 text-white space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs opacity-60 uppercase font-bold tracking-widest">
              <span>Subtotal</span>
              <span>XAF {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs opacity-60 uppercase font-bold tracking-widest">
              <span>Taxes (VAT 19.25%)</span>
              <span>XAF {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-2xl font-black uppercase tracking-tighter pt-4 border-t border-zinc-800">
              <span>Payable</span>
              <span className="text-green-400">XAF {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <PaymentTab active={paymentMethod === 'CASH'} onClick={() => setPaymentMethod('CASH')} icon={<Banknote size={16}/>} label="Cash" />
            <PaymentTab active={paymentMethod === 'MOMO'} onClick={() => setPaymentMethod('MOMO')} icon={<Smartphone size={16}/>} label="Mobile" />
            <PaymentTab active={paymentMethod === 'BANK'} onClick={() => setPaymentMethod('BANK')} icon={<CreditCard size={16}/>} label="Bank" />
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-5 uppercase tracking-[0.4em] text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isProcessing ? 'PROCESSING...' : (
              <>
                <span className="bg-black/10 px-2 py-0.5 rounded text-[10px]">F9</span>
                COMPLETE CHECKOUT
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
