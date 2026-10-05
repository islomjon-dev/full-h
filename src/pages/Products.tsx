import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { Product } from '../types';
import { UNITS } from '../types';
import { formatMoney } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, X, Package, Filter } from 'lucide-react';

export default function Products() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', categoryId: '', barcode: '', unit: 'dona' as string,
    costPrice: 0, salePrice: 0, stock: 0, minStock: 0, image: '', note: ''
  });

  const activeProducts = useMemo(() => products.filter(p => p.isActive), [products]);

  const filtered = useMemo(() => {
    let result = activeProducts;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(s) || (p.barcode && p.barcode.includes(s)));
    }
    if (categoryFilter) result = result.filter(p => p.categoryId === categoryFilter);
    if (stockFilter === 'low') result = result.filter(p => p.stock > 0 && p.stock <= p.minStock);
    if (stockFilter === 'out') result = result.filter(p => p.stock === 0);
    if (stockFilter === 'available') result = result.filter(p => p.stock > 0);
    return result;
  }, [activeProducts, search, categoryFilter, stockFilter]);

  const resetForm = () => {
    setForm({ name: '', categoryId: '', barcode: '', unit: 'dona', costPrice: 0, salePrice: 0, stock: 0, minStock: 0, image: '', note: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name, categoryId: product.categoryId, barcode: product.barcode,
      unit: product.unit, costPrice: product.costPrice, salePrice: product.salePrice,
      stock: product.stock, minStock: product.minStock, image: product.image, note: product.note
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.salePrice) return;
    
    if (editingId) {
      await updateProduct(editingId, form);
    } else {
      await addProduct({ ...form, isActive: true });
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    setConfirmDelete(null);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await addCategory(newCatName.trim());
    setNewCatName('');
    setShowCatForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Mahsulotlar</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCatForm(true)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            Kategoriya +
          </button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
            <Plus size={16} /> Mahsulot
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nomi yoki shtrix-kod..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
          <option value="">Barcha kategoriyalar</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
          <option value="">Barcha holatlar</option>
          <option value="available">Mavjud</option>
          <option value="low">Kam qolgan</option>
          <option value="out">Tugagan</option>
        </select>
      </div>

      {/* Products Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {activeProducts.length === 0 ? "Mahsulotlar hali qo'shilmagan" : "Qidiruv bo'yicha natija yo'q"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Nomi</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Kategoriya</th>
                  <th className="text-right px-4 py-3 font-medium">Kirim</th>
                  <th className="text-right px-4 py-3 font-medium">Sotuv</th>
                  <th className="text-right px-4 py-3 font-medium">Qoldiq</th>
                  <th className="text-center px-4 py-3 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(product => {
                  const cat = categories.find(c => c.id === product.categoryId);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{product.name}</p>
                        {product.barcode && <p className="text-xs text-gray-500">{product.barcode}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{cat?.name || '-'}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(product.costPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(product.salePrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          product.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          product.stock <= product.minStock ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                          'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {product.stock} {product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(product)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete(product.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold">{editingId ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h3>
              <button onClick={resetForm} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nomi *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategoriya</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                    <option value="">Tanlang</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birlik</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shtrix-kod</label>
                <input type="text" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Kirim narxi</label>
                  <input type="number" value={form.costPrice || ''} onChange={e => setForm(f => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sotuv narxi *</label>
                  <input type="number" value={form.salePrice || ''} onChange={e => setForm(f => ({ ...f, salePrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" min="0" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Boshlang'ich qoldiq</label>
                  <input type="number" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min. qoldiq</label>
                  <input type="number" value={form.minStock || ''} onChange={e => setForm(f => ({ ...f, minStock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" min="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Izoh</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Bekor</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                  {editingId ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold">Kategoriyalar</h3>
              <button onClick={() => setShowCatForm(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  placeholder="Kategoriya nomi" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
                <button onClick={handleAddCategory} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Qo'shish</button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm">{c.name}</span>
                    <button onClick={() => deleteCategory(c.id)} className="text-red-500 p-1"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 text-center">
            <p className="font-medium mb-4">Mahsulotni arxivlashni tasdiqlaysizmi?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Bekor</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Arxivlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
