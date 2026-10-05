import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatMoney, getStartOfDay, getEndOfDay, getStartOfWeek, getStartOfMonth, getStartOfYear, formatNumber } from '../utils/helpers';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Package, Users, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

type Period = 'today' | 'yesterday' | 'week' | 'month' | 'year';

export default function Dashboard() {
  const { sales, saleItems, expenses, products, customers } = useData();
  const [period, setPeriod] = useState<Period>('today');

  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (period) {
      case 'today':
        startDate = getStartOfDay(now); endDate = getEndOfDay(now); break;
      case 'yesterday':
        const y = new Date(now); y.setDate(y.getDate() - 1);
        startDate = getStartOfDay(y); endDate = getEndOfDay(y); break;
      case 'week':
        startDate = getStartOfWeek(now); endDate = getEndOfDay(now); break;
      case 'month':
        startDate = getStartOfMonth(now); endDate = getEndOfDay(now); break;
      case 'year':
        startDate = getStartOfYear(now); endDate = getEndOfDay(now); break;
    }

    const periodSales = sales.filter(s => s.status === 'completed' && new Date(s.createdAt) >= startDate && new Date(s.createdAt) <= endDate);
    const periodSaleIds = new Set(periodSales.map(s => s.id));
    const periodItems = saleItems.filter(si => periodSaleIds.has(si.saleId));
    const periodExpenses = expenses.filter(e => new Date(e.date) >= startDate && new Date(e.date) <= endDate);

    const revenue = periodSales.reduce((sum, s) => sum + s.total, 0);
    const cost = periodItems.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0);
    const grossProfit = revenue - cost;
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    return {
      revenue, cost, grossProfit, totalExpenses, netProfit,
      salesCount: periodSales.length,
      unitsSold: periodItems.reduce((sum, i) => sum + i.quantity, 0),
      customerCount: new Set(periodSales.filter(s => s.customerId).map(s => s.customerId)).size
    };
  }, [period, sales, saleItems, expenses]);

  const chartData = useMemo(() => {
    const now = new Date();
    const days: { name: string; sales: number; profit: number; expenses: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = getStartOfDay(d);
      const end = getEndOfDay(d);
      const daySales = sales.filter(s => s.status === 'completed' && new Date(s.createdAt) >= start && new Date(s.createdAt) <= end);
      const daySaleIds = new Set(daySales.map(s => s.id));
      const dayItems = saleItems.filter(si => daySaleIds.has(si.saleId));
      const dayExpenses = expenses.filter(e => new Date(e.date) >= start && new Date(e.date) <= end);
      
      const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
      const cost = dayItems.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0);
      
      days.push({
        name: d.toLocaleDateString('uz', { weekday: 'short' }),
        sales: revenue,
        profit: revenue - cost,
        expenses: dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      });
    }
    return days;
  }, [sales, saleItems, expenses]);

  const topProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const completedSaleIds = new Set(sales.filter(s => s.status === 'completed').map(s => s.id));
    
    saleItems.filter(si => completedSaleIds.has(si.saleId)).forEach(item => {
      const existing = productMap.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      productMap.set(item.productId, existing);
    });

    return Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [sales, saleItems]);

  const paymentData = useMemo(() => {
    const completedSales = sales.filter(s => s.status === 'completed');
    const cash = completedSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
    const card = completedSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
    return [
      { name: 'Naqd', value: cash, color: '#3b82f6' },
      { name: 'Karta', value: card, color: '#10b981' }
    ].filter(d => d.value > 0);
  }, [sales]);

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Bugun' },
    { key: 'yesterday', label: 'Kecha' },
    { key: 'week', label: 'Hafta' },
    { key: 'month', label: 'Oy' },
    { key: 'year', label: 'Yil' }
  ];

  const hasData = sales.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Boshqaruv paneli</h1>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p.key ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Ma'lumot mavjud emas</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Savdo qilingandan keyin statistika shu yerda ko'rinadi</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<DollarSign size={20} />} label="Jami savdo" value={formatMoney(stats.revenue)} color="blue" />
            <StatCard icon={<TrendingUp size={20} />} label="Sof foyda" value={formatMoney(stats.netProfit)} color={stats.netProfit >= 0 ? 'green' : 'red'} />
            <StatCard icon={<ShoppingCart size={20} />} label="Savdo soni" value={stats.salesCount.toString()} color="purple" />
            <StatCard icon={<Package size={20} />} label="Sotilgan dona" value={formatNumber(stats.unitsSold)} color="orange" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<ArrowUpRight size={20} />} label="Yalpi foyda" value={formatMoney(stats.grossProfit)} color="green" />
            <StatCard icon={<ArrowDownRight size={20} />} label="Xarajatlar" value={formatMoney(stats.totalExpenses)} color="red" />
            <StatCard icon={<TrendingDown size={20} />} label="Tan narx" value={formatMoney(stats.cost)} color="yellow" />
            <StatCard icon={<Users size={20} />} label="Xaridorlar" value={stats.customerCount.toString()} color="indigo" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold mb-4">7 kunlik dinamika</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Savdo" />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Xarajat" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold mb-4">Foyda dinamikasi</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Foyda" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold mb-4">Eng ko'p sotilgan</h3>
              {topProducts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">Ma'lumot yo'q</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <span className="text-sm">{p.name}</span>
                      </div>
                      <span className="text-sm font-medium">{p.quantity} dona</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold mb-4">To'lov turlari</h3>
              {paymentData.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">Ma'lumot yo'q</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {paymentData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatMoney(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold truncate">{value}</p>
    </div>
  );
}
