import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatMoney, formatDateTime, formatTime } from '../utils/helpers';
import { exportReceiptPDF } from '../utils/export';
import { Printer, Download, Share2, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sales, saleItems, customers, settings } = useData();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [telegramError, setTelegramError] = useState('');

  const sale = sales.find(s => s.id === id);
  const items = saleItems.filter(si => si.saleId === id);
  const customer = sale?.customerId ? customers.find(c => c.id === sale.customerId) : null;
  const brandName = settings?.brandName || 'IBROHIM OKA CHORSU';

  useEffect(() => {
    if (sale) {
      const qrData = JSON.stringify({
        receipt: sale.receiptNumber,
        date: sale.createdAt,
        total: sale.total,
        items: items.length,
        verify: true
      });
      QRCode.toDataURL(qrData, { width: 150, margin: 1 }).then(setQrDataUrl).catch(() => {});
    }
  }, [sale, items]);

  if (!sale) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Chek topilmadi</p>
        <button onClick={() => navigate('/sales/history')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          Ortga qaytish
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    exportReceiptPDF(sale, items, customer?.name || '', brandName);
  };

  const handleTelegramShare = async () => {
    const botToken = settings?.telegramBotToken;
    const chatId = settings?.telegramChatId;
    
    if (!botToken || !chatId) {
      setTelegramStatus('error');
      setTelegramError("Telegram bot sozlanmagan. Sozlamalardan token va chat ID kiriting.");
      return;
    }

    setTelegramStatus('sending');
    setTelegramError('');

    try {
      const receiptText = `🧾 ${brandName}\n\n` +
        `Chek: ${sale.receiptNumber}\n` +
        `Sana: ${formatDateTime(sale.createdAt)}\n` +
        `${customer ? `Mijoz: ${customer.name}\n` : ''}` +
        `━━━━━━━━━━━━━━\n` +
        items.map(i => `${i.productName} x${i.quantity} — ${formatMoney(i.total)}`).join('\n') +
        `\n━━━━━━━━━━━━━━\n` +
        `Subtotal: ${formatMoney(sale.subtotal)}\n` +
        (sale.discount > 0 ? `Chegirma: -${formatMoney(sale.discount)}\n` : '') +
        `*JAMI: ${formatMoney(sale.total)}*\n` +
        `To'lov: ${sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}\n\n` +
        `Rahmat! 🙏`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: receiptText,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json();
      if (data.ok) {
        setTelegramStatus('success');
        setTimeout(() => setTelegramStatus('idle'), 3000);
      } else {
        setTelegramStatus('error');
        setTelegramError(data.description || "Telegram'ga yuborishda xatolik");
      }
    } catch (err) {
      setTelegramStatus('error');
      setTelegramError("Tarmoq xatoligi. Qayta urinib ko'ring.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
          <ArrowLeft size={16} /> Ortga
        </button>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1">
            <Printer size={14} /> Chop etish
          </button>
          <button onClick={handleDownloadPDF} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1">
            <Download size={14} /> PDF
          </button>
          <button onClick={handleTelegramShare} disabled={telegramStatus === 'sending'}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">
            <Share2 size={14} /> {telegramStatus === 'sending' ? 'Yuborilmoqda...' : 'Telegram'}
          </button>
        </div>
      </div>

      {telegramStatus === 'success' && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2 print:hidden">
          <Check size={16} /> Telegram'ga muvaffaqiyatli yuborildi!
        </div>
      )}
      {telegramStatus === 'error' && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2 print:hidden">
          <AlertCircle size={16} /> {telegramError}
        </div>
      )}

      {/* Receipt */}
      <div className="max-w-sm mx-auto">
        <div ref={receiptRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 print:border-0 print:shadow-none print:rounded-none">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">{brandName}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDateTime(sale.createdAt)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Chek: {sale.receiptNumber}</p>
            {customer && <p className="text-xs text-gray-500 dark:text-gray-400">Mijoz: {customer.name}</p>}
          </div>

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3"></div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
              <span>Mahsulot</span>
              <span>Miqd.</span>
              <span>Jami</span>
            </div>
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="flex-1 truncate pr-2">{item.productName}</span>
                <span className="w-10 text-center">{item.quantity}</span>
                <span className="w-24 text-right font-medium">{formatMoney(item.total)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3"></div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
              <span>{formatMoney(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Chegirma:</span>
                <span className="text-red-500">-{formatMoney(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-1">
              <span>JAMI:</span>
              <span className="text-blue-600 dark:text-blue-400">{formatMoney(sale.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>To'lov:</span>
              <span>{sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}</span>
            </div>
          </div>

          {sale.status === 'cancelled' && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 rounded text-center text-red-600 dark:text-red-400 text-sm font-medium">
              BEKOR QILINGAN
            </div>
          )}

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3"></div>

          {qrDataUrl && (
            <div className="flex justify-center mb-3">
              <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
            </div>
          )}

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {settings?.receiptFooter || 'Rahmat!'}
          </p>
        </div>
      </div>
    </div>
  );
}
