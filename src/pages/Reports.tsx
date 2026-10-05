import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatMoney, formatDate, getStartOfDay, getEndOfDay, getStartOfWeek, getStartOfMonth, getStartOfYear } from '../utils/helpers';
import { exportSalesCSV, exportProductsCSV, exportExpensesCSV, exportReportPDF } from '../utils/export';
import { FileText, Download, Calendar } from 'lucide-react';

type ReportType = 'sales' | 'profit' | 'expenses' | 'products' | 'inventory';
type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function Reports() {
  const { sales, saleItems, products, expenses } = useData();
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [period, setPeriod] = useState<Period>('month');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(1)).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today': return { from: getStartOfDay(now), to: getEndOfDay(now) };
      case 'week': return { from: getStartOfWeek(now), to: getEndOfDay(now) };
      case 'month': return { from: getStartOfMonth(now), to: getEndOfDay(now) };
      case 'year': return { from: getStartOfYear(now), to: getEndOfDay(now) };
      case 'custom': return { from: new Date(dateFrom), to: new Date(dateTo + 'T23:59:59') };
    }
  };

  const report = useMemo(() => {
    const { from, to } = getDateRange();
    const periodSales = sales.filter(s => s.status === 'completed' && new Date(s.createdAt) >= from && new Date(s.createdAt) <= to);
    const periodSaleIds = new Set(periodSales.map(s => s.id));
    const periodItems = saleItems.filter(si => periodSaleIds.has(si.saleId));
    const periodExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= from && d <= to;
    });

    const revenue = periodSales.reduce((sum, s) => sum + s.total, 0);
    const cost = periodItems.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0);
    const grossProfit = revenue - cost;
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const totalDiscount = periodSales.reduce((sum, s) => sum + s.discount, 0);

    return {
      revenue, cost, grossProfit, totalExpenses, netProfit, totalDiscount,
      salesCount: periodSales.length,
      unitsSold: periodItems.reduce((sum, i) => sum + i.quantity, 0),
      periodSales, periodItems, periodExpenses
    };
  }, [reportType, period, dateFrom, dateTo, sales, saleItems, expenses]);

  const handleExportCSV = () => {
    switch (reportType) {
      case 'sales':
        exportSalesCSV(report.periodSales, report.periodItems, 'savdo_hisoboti');
        break;
      case 'expenses':
        exportExpensesCSV(report.periodExpenses, 'xarajat_hisoboti');
        break;
      case 'products':
      case 'inventory':
        exportProductsCSV(products.filter(p => p.isActive), 'mahsulotlar');
        break;
      default:
        exportSalesCSV(report.periodSales, report.periodItems, 'hisobot');
    }
  };

  const handleExportPDF = () => {
    const titles: Record<ReportType, string> = {
      sales: 'Savdo hisoboti',
      profit: 'Foyda hisoboti',
      expenses: 'Xarajat hisoboti',
      products: 'Mahsulotlar hisoboti',
      inventory: 'Ombor hisoboti'
    };

    let headers: string[] = [];
    let rows: string[][] = [];

    switch (reportType) {
      case 'sales':
        headers = ['Chek №', 'Sana', 'Summa', 'To\'lov', 'Holat'];
        rows = report.periodSales.map(s => [
          s.receiptNumber, formatDate(s.createdAt), formatMoney(s.total),
          s.paymentMethod === 'cash' ? 'Naqd' : 'Karta',
          s.status === 'completed' ? 'Bajarilgan' : 'Bekor'
        ]);
        break;
      case 'profit':
        headers = ['Ko\'rsatkich', 'Qiymat'];
        rows = [
          ['Jami savdo', formatMoney(report.revenue)],
          ['Tan narx', formatMoney(report.cost)],
          ['Yalpi foyda', formatMoney(report.grossProfit)],
          ['Xarajatlar', formatMoney(report.totalExpenses)],
          ['Sof foyda', formatMoney(report.netProfit)]
        ];
        break;
      case 'expenses':
        headers = ['Kategoriya', 'Summa', 'Sana', 'Izoh'];
        rows = report.periodExpenses.map(e => [e.category, formatMoney(e.amount), formatDate(e.date), e.note || '-']);
        break;
      case 'products':
      case 'inventory':
        headers = ['Nomi', 'Qoldiq', 'Kirim narxi', 'Sotuv narxi'];
        rows = products.filter(p => p.isActive).map(p => [p.name, `${p.stock} ${p.unit}`, formatMoney(p.costPrice), formatMoney(p.salePrice)]);
        break;
    }

    exportReportPDF(titles[reportType], { headers, rows }, 'IBROHIM OKA CHORSU');
  };

  const periods = [
    { key: 'today' as Period, label: 'Bugun' },
    { key: 'week' as Period, label: 'Hafta' },
    { key: 'month' as Period, label: 'Oy' },
    { key: 'year' as Period, label: 'Yil' },
    { key: 'custom' as Period, label: 'Boshqa' }
  ];

  const reportTypes = [
    { key: 'sales' as ReportType, label: 'Savdo' },
    { key: 'profit' as ReportType, label: 'Foyda' },
    { key: 'expenses' as ReportType, label: 'Xarajat' },
    { key: 'products' as ReportType, label: 'Mahsulot' },
    { key: 'inventory' as ReportType, label: 'Ombor' }
  ];

  const hasData = report.salesCount > 0 || report.periodExpenses.length > 0 || products.length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hisobotlar</h1>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {reportTypes.map(rt => (
          <button key={rt.key} onClick={() => setReportType(rt.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              reportType === rt.key ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}>
            {rt.label}
          </button>
        ))}
      </div>

      {/* Period Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {periods.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p.key ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              <span className="text-gray-400">—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={handleExportCSV} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1">
              <Download size={14} /> CSV
            </button>
            <button onClick={handleExportPDF} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1">
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {!hasData ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Hisobot uchun ma'lumot yetarli emas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          {(reportType === 'sales' || reportType === 'profit') && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Jami savdo</p>
                <p className="text-lg font-bold">{formatMoney(report.revenue)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Tan narx</p>
                <p className="text-lg font-bold">{formatMoney(report.cost)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Yalpi foyda</p>
                <p className="text-lg font-bold text-green-600">{formatMoney(report.grossProfit)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sof foyda</p>
                <p className={`text-lg font-bold ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(report.netProfit)}</p>
              </div>
            </div>
          )}

          {(reportType === 'sales' || reportType === 'profit') && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Savdo soni</p>
                <p className="text-lg font-bold">{report.salesCount}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sotilgan dona</p>
                <p className="text-lg font-bold">{report.unitsSold}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Xarajatlar</p>
                <p className="text-lg font-bold text-red-600">{formatMoney(report.totalExpenses)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Chegirmalar</p>
                <p className="text-lg font-bold">{formatMoney(report.totalDiscount)}</p>
              </div>
            </div>
          )}

          {/* Profit Breakdown */}
          {reportType === 'profit' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold mb-4">Foyda tahlili</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Savdo daromadi</span>
                  <span className="font-medium">{formatMoney(report.revenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">- Tan narx (COGS)</span>
                  <span className="font-medium text-red-500">-{formatMoney(report.cost)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium">= Yalpi foyda</span>
                  <span className="font-bold text-green-600">{formatMoney(report.grossProfit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">- Xarajatlar</span>
                  <span className="font-medium text-red-500">-{formatMoney(report.totalExpenses)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex items-center justify-between">
                  <span className="font-medium">= Sof foyda</span>
                  <span className={`text-xl font-bold ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(report.netProfit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Expenses Report */}
          {reportType === 'expenses' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Kategoriya</th>
                      <th className="text-right px-4 py-3 font-medium">Summa</th>
                      <th className="text-left px-4 py-3 font-medium">Sana</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {report.periodExpenses.map(e => (
                      <tr key={e.id}>
                        <td className="px-4 py-3">{e.category}</td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">{formatMoney(e.amount)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(e.date)}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{e.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <td className="px-4 py-3 font-bold">Jami:</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{formatMoney(report.totalExpenses)}</td>
                      <td className="px-4 py-3" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Products/Inventory Report */}
          {(reportType === 'products' || reportType === 'inventory') && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Mahsulot</th>
                      <th className="text-right px-4 py-3 font-medium">Qoldiq</th>
                      <th className="text-right px-4 py-3 font-medium">Kirim</th>
                      <th className="text-right px-4 py-3 font-medium">Sotuv</th>
                      <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Qoldiq qiymati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {products.filter(p => p.isActive).map(p => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-right">{p.stock} {p.unit}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(p.costPrice)}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(p.salePrice)}</td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">{formatMoney(p.stock * p.costPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales list for sales report */}
          {reportType === 'sales' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Chek №</th>
                      <th className="text-left px-4 py-3 font-medium">Sana</th>
                      <th className="text-right px-4 py-3 font-medium">Summa</th>
                      <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">To'lov</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {report.periodSales.map(s => (
                      <tr key={s.id}>
                        <td className="px-4 py-3 font-medium">{s.receiptNumber}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(s.createdAt)}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatMoney(s.total)}</td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700">
                            {s.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <td className="px-4 py-3 font-bold" colSpan={2}>Jami:</td>
                      <td className="px-4 py-3 text-right font-bold">{formatMoney(report.revenue)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
