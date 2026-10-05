import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import type { CartItem } from '../types';
import { formatMoney, debounce } from '../utils/helpers';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check, CreditCard, Banknote, User } from 'lucide-react';

export default function Sales() {
  const { products, categories, customers, createSale } = useData();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeProducts = useMemo(() => products.filter(p => p.isActive), [products]);
  
  const filteredProducts = useMemo(() => {
    let filtered = activeProducts;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || (p.barcode && p.barcode.includes(s)));
    }
    if (categoryFilter) {
      filtered = filtered.filter(p => p.categoryId === categoryFilter);
    }
    return filtered;
  }, [activeProducts, search, categoryFilter]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0), [cart]);
  const total = subtotal - discount;

  const addToCart = useCallback((product: typeof products[0]) => {
    setError('');
    if (product.stock <= 0) { setError("Mahsulot qoldig'i yo'q"); return; }
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { setError("Qoldiq yetarli emas"); return prev; }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        costPrice: product.costPrice,
        unit: product.unit,
        maxStock: product.stock
      }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      if (newQty > item.maxStock) { setError("Qoldiq yetarli emas"); return item; }
      return { ...item, quantity: newQty };
    }));
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      if (qty <= 0) return item;
      if (qty > item.maxStock) { setError("Qoldiq yetarli emas"); return { ...item, quantity: item.maxStock }; }
      return { ...item, quantity: qty };
    }));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const handleCheckout = async () => {
    setError('');
    if (cart.length === 0) { setError("Savat bo'sh"); return; }
    if (discount > subtotal) { setError("Chegirma summadan katta bo'lishi mumkin emas"); return; }
    if (discount < 0) { setError("Chegirma manfiy bo'lishi mumkin emas"); return; }

    const sale = await createSale(cart, discount, paymentMethod, customerId);
    if (!sale) { setError("Xatolik yuz berdi. Qoldiqni tekshiring."); return; }
    
    setSuccess('Savdo muvaffaqiyatli amalga oshirildi!');
    setCart([]);
    setDiscount(0);
    setCustomerId(null);
    setShowCheckout(false);
    
    setTimeout(() => {
      navigate(`/receipts/${sale.id}`);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Savdo</h1>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
          <Check size={16} /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Products */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Mahsulot yoki shtrix-kod qidirish..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">Barchasi</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                {activeProducts.length === 0 ? (
                  <div>
                    <p className="text-lg mb-2">Mahsulotlar yo'q</p>
                    <p className="text-sm">Avval mahsulot qo'shing</p>
                  </div>
                ) : (
                  <p>Qidiruv bo'yicha natija yo'q</p>
                )}
              </div>
            ) : (
              filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    product.stock <= 0
                      ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md active:scale-95'
                  }`}
                >
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-1">{formatMoney(product.salePrice)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Qoldiq: {product.stock} {product.unit}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col h-fit lg:sticky lg:top-20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <ShoppingCart size={18} /> Savat
              {cart.length > 0 && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{cart.length}</span>}
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-600">Tozalash</button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              <p>Savat bo'sh</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatMoney(item.unitPrice)} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500">
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => setQuantity(item.productId, parseInt(e.target.value) || 0)}
                      className="w-10 text-center text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded py-0.5"
                      min="1"
                      max={item.maxStock}
                    />
                    <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500">
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-20 text-right">{formatMoney(item.unitPrice * item.quantity)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Chegirma:</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={e => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
                  placeholder="0"
                  min="0"
                  max={subtotal}
                />
                <span className="text-xs text-gray-500">so'm</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Jami:</span>
                <span className="text-blue-600 dark:text-blue-400">{formatMoney(total)}</span>
              </div>

              <div className="flex gap-2">
                <select
                  value={customerId || ''}
                  onChange={e => setCustomerId(e.target.value || null)}
                  className="flex-1 px-2 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="">Mijoz (ixtiyoriy)</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors ${paymentMethod === 'cash' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  <Banknote size={14} /> Naqd
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors ${paymentMethod === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  <CreditCard size={14} /> Karta
                </button>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
              >
                To'lov qilish — {formatMoney(total)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
