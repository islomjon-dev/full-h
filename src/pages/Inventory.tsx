import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatMoney, formatDate } from '../utils/helpers';
import { Plus, Package, ArrowDown, ArrowUp, X, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const { products, inventoryMovements, addStock, updateProduct } = useData();
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [note, setNote] = useState('');
  const [showMinStock, setShowMinStock] = useState<string | null>(null);
  const [minStockValue, setMinStockValue] = useState(0);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const activeProducts = useMemo(() => products.filter(p => p.isActive), [products]);

  const filtered = useMemo(() => {
    if (filter === 'low') return activeProducts.filter(p => p.stock > 0 && p.stock <= p.minStock);
    if (filter === 'out') return activeProducts.filter(p => p.stock === 0);
    return activeProducts;
  }, [activeProducts, filter]);

  const lowStockProducts = useMemo(() => activeProducts.filter(p => p.stock <= p.minStock && p.stock > 0), [activeProducts]);
  const outOfStockProducts = useMemo(() => activeProducts.filter(p => p.stock === 0), [activeProducts]);

  const handleAddStock = async () => {
    if (!selectedProduct || quantity <= 0) return;
    await addStock(selectedProduct, quantity, costPrice, note);
    setShowAddStock(false);
    setSelectedProduct('');
    setQuantity(0);
    setCostPrice(0);
    setNote('');
  };

  const handleUpdateMinStock = async () => {
    if (!showMinStock) return;
    await updateProduct(showMinStock, { minStock: minStockValue });
    setShowMinStock(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Ombor</h1>
        <button onClick={() => setShowAddStock(true)} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
          <Plus size={16} /> Kirim
        </button>
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="space-y-2">
          {outOfStockProducts.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{outOfStockProducts.length} ta mahsulot tugagan</span>
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400">{lowStockProducts.length} ta mahsulot kam qolgan</span>
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>Barchasi ({activeProducts.length})</button>
        <button onClick={() => setFilter('low')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'low' ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>Kam qolgan ({lowStockProducts.length})</button>
        <button onClick={() => setFilter('out')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'out' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>Tugagan ({outOfStockProducts.length})</button>
      </div>

      {/* Inventory Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Mahsulotlar yo'q</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Mahsulot</th>
                  <th className="text-right px-4 py-3 font-medium">Qoldiq</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Min. qoldiq</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Kirim narxi</th>
                  <th className="text-center px-4 py-3 font-medium">Holat</th>
                  <th className="text-center px-4 py-3 font-medium">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-right font-bold">{product.stock} {product.unit}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">{product.minStock} {product.unit}</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">{formatMoney(product.costPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        product.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                        product.stock <= product.minStock ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                        'bg-green-100 dark:bg-green-900/30 text-green-600'
                      }`}>
                        {product.stock === 0 ? 'Tugagan' : product.stock <= product.minStock ? 'Kam' : 'Yetarli'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { setSelectedProduct(product.id); setShowAddStock(true); setCostPrice(product.costPrice); }}
                        className="px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                        + Kirim
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Movements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-3">So'nggi harakatlar</h3>
        {inventoryMovements.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Harakatlar yo'q</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {inventoryMovements.slice(0, 20).map(mov => {
              const product = products.find(p => p.id === mov.productId);
              return (
                <div key={mov.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded text-sm">
                  <div className="flex items-center gap-2">
                    {mov.type === 'in' || mov.type === 'return' ? (
                      <ArrowDown size={14} className="text-green-500" />
                    ) : (
                      <ArrowUp size={14} className="text-red-500" />
                    )}
                    <span className="font-medium">{product?.name || 'Noma\'lum'}</span>
                  </div>
                  <div className="text-right">
                    <span className={mov.type === 'in' || mov.type === 'return' ? 'text-green-600' : 'text-red-600'}>
                      {mov.type === 'in' || mov.type === 'return' ? '+' : '-'}{mov.quantity}
                    </span>
                    <p className="text-xs text-gray-500">{formatDate(mov.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold">Kirim qilish</h3>
              <button onClick={() => setShowAddStock(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mahsulot</label>
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                  <option value="">Tanlang</option>
                  {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name} (hozir: {p.stock})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Miqdor</label>
                <input type="number" value={quantity || ''} onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kirim narxi</label>
                <input type="number" value={costPrice || ''} onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Izoh</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
              <button onClick={handleAddStock} disabled={!selectedProduct || quantity <= 0}
                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
