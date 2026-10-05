import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatMoney, formatDate } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, X, Users, Phone } from 'lucide-react';

export default function Customers() {
  const { customers, sales, saleItems, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const s = search.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s));
  }, [customers, search]);

  const getCustomerStats = (customerId: string) => {
    const customerSales = sales.filter(s => s.customerId === customerId && s.status === 'completed');
    const totalSpent = customerSales.reduce((sum, s) => sum + s.total, 0);
    const lastSale = customerSales[0];
    return { totalSpent, salesCount: customerSales.length, lastSale };
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', note: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (customer: typeof customers[0]) => {
    setForm({ name: customer.name, phone: customer.phone, note: customer.note });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    if (editingId) {
      await updateCustomer(editingId, form);
    } else {
      await addCustomer(form);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteCustomer(id);
    setConfirmDelete(null);
  };

  const selectedStats = selectedCustomer ? getCustomerStats(selectedCustomer) : null;
  const selectedCustomerData = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
  const selectedSales = selectedCustomer ? sales.filter(s => s.customerId === selectedCustomer && s.status === 'completed') : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Xaridorlar</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
          <Plus size={16} /> Xaridor
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Ism yoki telefon..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {customers.length === 0 ? "Xaridorlar hali qo'shilmagan" : "Qidiruv bo'yicha natija yo'q"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(customer => {
            const stats = getCustomerStats(customer.id);
            return (
              <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{customer.name}</h3>
                    {customer.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Phone size={12} /> {customer.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(customer)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(customer.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Xaridlar</p>
                    <p className="font-bold text-sm">{stats.salesCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jami</p>
                    <p className="font-bold text-sm">{formatMoney(stats.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Oxirgi</p>
                    <p className="font-bold text-xs">{stats.lastSale ? formatDate(stats.lastSale.createdAt) : '-'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(customer.id)}
                  className="mt-3 w-full py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Tarixni ko'rish
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && selectedCustomerData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-bold">{selectedCustomerData.name}</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Jami xaridlar</p>
                  <p className="font-bold">{selectedStats?.salesCount}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Jami summa</p>
                  <p className="font-bold">{formatMoney(selectedStats?.totalSpent || 0)}</p>
                </div>
              </div>
              <h4 className="font-medium mb-2 text-sm">Xaridlar tarixi</h4>
              {selectedSales.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Xaridlar yo'q</p>
              ) : (
                <div className="space-y-2">
                  {selectedSales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded text-sm">
                      <div>
                        <p className="font-medium">{sale.receiptNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(sale.createdAt)}</p>
                      </div>
                      <p className="font-bold">{formatMoney(sale.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold">{editingId ? 'Tahrirlash' : "Yangi xaridor"}</h3>
              <button onClick={resetForm} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Ism *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Izoh</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" rows={2} />
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
            <p className="font-medium mb-4">Xaridorni o'chirishni tasdiqlaysizmi?</p>
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
