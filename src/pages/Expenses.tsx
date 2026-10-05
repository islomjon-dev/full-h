import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { EXPENSE_CATEGORIES } from '../types';
import { formatMoney, formatDate } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, X, Receipt } from 'lucide-react';

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: 'Boshqa', amount: 0, date: new Date().toISOString().slice(0, 10), note: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = expenses;
    if (categoryFilter) result = result.filter(e => e.category === categoryFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e => e.note.toLowerCase().includes(s) || e.category.toLowerCase().includes(s));
    }
    return result;
  }, [expenses, search, categoryFilter]);

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const resetForm = () => {
    setForm({ category: 'Boshqa', amount: 0, date: new Date().toISOString().slice(0, 10), note: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (expense: typeof expenses[0]) => {
    setForm({ category: expense.category, amount: expense.amount, date: expense.date.slice(0, 10), note: expense.note });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) return;
    if (editingId) {
      await updateExpense(editingId, { ...form, date: new Date(form.date).toISOString() });
    } else {
      await addExpense({ ...form, date: new Date(form.date).toISOString() });
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Xarajatlar</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
          <Plus size={16} /> Xarajat
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Jami xarajatlar</p>
        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatMoney(totalAmount)}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Qidirish..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
          <option value="">Barcha kategoriyalar</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Receipt size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {expenses.length === 0 ? "Xarajatlar hali qo'shilmagan" : "Qidiruv bo'yicha natija yo'q"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Kategoriya</th>
                  <th className="text-right px-4 py-3 font-medium">Summa</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Sana</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Izoh</th>
                  <th className="text-center px-4 py-3 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium">{expense.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{formatMoney(expense.amount)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 truncate max-w-[200px]">{expense.note || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(expense)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(expense.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold">{editingId ? 'Tahrirlash' : "Yangi xarajat"}</h3>
              <button onClick={resetForm} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Kategoriya</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Summa *</label>
                <input type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" min="1" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sana</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Izoh</label>
                <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Bekor</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 text-center">
            <p className="font-medium mb-4">Xarajatni o'chirishni tasdiqlaysizmi?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Bekor</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
