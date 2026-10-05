import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatMoney, formatDate, formatDateTime } from '../utils/helpers';
import { Search, Eye, XCircle, Receipt, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SalesHistory() {
  const { sales, saleItems, customers, cancelSale } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = sales;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(sale => {
        const customer = customers.find(c => c.id === sale.customerId);
        return sale.receiptNumber.toLowerCase().includes(s) || (customer?.name.toLowerCase().includes(s));
      });
    }
    if (statusFilter) result = result.filter(s => s.status === statusFilter);
    if (paymentFilter) result = result.filter(s => s.paymentMethod === paymentFilter);
    if (dateFrom) result = result.filter(s => s.createdAt >= dateFrom);
    if (dateTo) result = result.filter(s => s.createdAt <= dateTo + 'T23:59:59');
    return result;
  }, [sales, search, statusFilter, paymentFilter, dateFrom, dateTo, customers]);

  const handleCancel = async (saleId: string) => {
    await cancelSale(saleId);
    setConfirmCancel(null);
  };

  const selectedSaleData = selectedSale ? sales.find(s => s.id === selectedSale) : null;
  const selectedSaleItems = selectedSale ? saleItems.filter(si => si.saleId === selectedSale) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Savdo tarixi</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Chek № yoki mijoz..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
            <option value="">Barcha holatlar</option>
            <option value="completed">Bajarilgan</option>
            <option value="cancelled">Bekor qilingan</option>
          </select>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
            <option value="">Barcha to'lovlar</option>
            <option value="cash">Naqd</option>
            <option value="card">Karta</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
        </div>
      </div>

      {/* Sales List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Receipt size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {sales.length === 0 ? "Hali savdo mavjud emas" : "Qidiruv bo'yicha natija yo'q"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Chek №</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Sana</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Mijoz</th>
                  <th className="text-right px-4 py-3 font-medium">Summa</th>
                  <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">To'lov</th>
                  <th className="text-center px-4 py-3 font-medium">Holat</th>
                  <th className="text-center px-4 py-3 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(sale => {
                  const customer = customers.find(c => c.id === sale.customerId);
                  const items = saleItems.filter(si => si.saleId === sale.id);
                  return (
                    <tr key={sale.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${sale.status === 'cancelled' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-medium">{sale.receiptNumber}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{formatDateTime(sale.createdAt)}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-500">{customer?.name || '-'}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatMoney(sale.total)}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700">
                          {sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          sale.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                        }`}>
                          {sale.status === 'completed' ? 'Bajarilgan' : 'Bekor'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link to={`/receipts/${sale.id}`} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500">
                            <Receipt size={14} />
                          </Link>
                          <button onClick={() => setSelectedSale(sale.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                            <Eye size={14} />
                          </button>
                          {sale.status === 'completed' && (
                            <button onClick={() => setConfirmCancel(sale.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
                              <XCircle size={14} />
                            </button>
                          )}
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

      {/* Sale Detail Modal */}
      {selectedSale && selectedSaleData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-bold">{selectedSaleData.receiptNumber}</h3>
                <p className="text-xs text-gray-500">{formatDateTime(selectedSaleData.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                {selectedSaleItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded text-sm">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.quantity} x {formatMoney(item.unitPrice)}</p>
                    </div>
                    <p className="font-bold">{formatMoney(item.total)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>{formatMoney(selectedSaleData.subtotal)}</span>
                </div>
                {selectedSaleData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Chegirma:</span>
                    <span className="text-red-500">-{formatMoney(selectedSaleData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Jami:</span>
                  <span>{formatMoney(selectedSaleData.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 text-center">
            <p className="font-medium mb-2">Savdoni bekor qilishni tasdiqlaysizmi?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Mahsulotlar omborga qaytariladi</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmCancel(null)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Bekor</button>
              <button onClick={() => handleCancel(confirmCancel)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Bekor qilish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
