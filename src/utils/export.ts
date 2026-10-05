import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Sale, SaleItem, Product, Expense, Customer } from '../types';
import { formatMoney, formatDate, formatDateTime } from './helpers';

export function exportSalesCSV(sales: Sale[], saleItems: SaleItem[], filename: string = 'savdo_hisoboti') {
  const headers = ['Chek №', 'Sana', 'Mijoz', 'Mahsulotlar', 'Summa', 'Chegirma', 'Jami', "To'lov", 'Holat'];
  const rows = sales.map(sale => {
    const items = saleItems.filter(si => si.saleId === sale.id);
    const itemsStr = items.map(i => `${i.productName} x${i.quantity}`).join(', ');
    return [
      sale.receiptNumber,
      formatDateTime(sale.createdAt),
      '-',
      itemsStr,
      formatMoney(sale.subtotal),
      formatMoney(sale.discount),
      formatMoney(sale.total),
      sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta',
      sale.status === 'completed' ? 'Bajarilgan' : 'Bekor qilingan'
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportProductsCSV(products: Product[], filename: string = 'mahsulotlar') {
  const headers = ['Nomi', 'Kategoriya', 'Shtrix-kod', "Birlik", "Kirim narxi", "Sotuv narxi", 'Qoldiq', 'Holat'];
  const rows = products.map(p => [
    p.name,
    '',
    p.barcode || '-',
    p.unit,
    formatMoney(p.costPrice),
    formatMoney(p.salePrice),
    p.stock.toString(),
    p.isActive ? 'Faol' : 'Arxivlangan'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportExpensesCSV(expenses: Expense[], filename: string = 'xarajatlar') {
  const headers = ['Kategoriya', 'Summa', 'Sana', 'Izoh'];
  const rows = expenses.map(e => [
    e.category,
    formatMoney(e.amount),
    formatDate(e.date),
    e.note || '-'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportReceiptPDF(sale: Sale, items: SaleItem[], customerName: string, brandName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200]
  });

  let y = 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName, 40, y, { align: 'center' });
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateTime(sale.createdAt), 40, y, { align: 'center' });
  y += 4;
  doc.text(`Chek: ${sale.receiptNumber}`, 40, y, { align: 'center' });
  y += 4;
  if (customerName) {
    doc.text(`Mijoz: ${customerName}`, 40, y, { align: 'center' });
    y += 4;
  }
  y += 2;
  doc.line(5, y, 75, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Mahsulot', 5, y);
  doc.text('Miqd.', 45, y);
  doc.text('Jami', 60, y, { align: 'right' });
  y += 4;
  doc.setFont('helvetica', 'normal');

  items.forEach(item => {
    const name = item.productName.length > 18 ? item.productName.substring(0, 18) + '..' : item.productName;
    doc.text(name, 5, y);
    doc.text(item.quantity.toString(), 48, y);
    doc.text(formatMoney(item.total), 75, y, { align: 'right' });
    y += 4;
    if (y > 180) {
      doc.addPage([80, 200]);
      y = 10;
    }
  });

  y += 2;
  doc.line(5, y, 75, y);
  y += 5;
  doc.text(`Subtotal: ${formatMoney(sale.subtotal)}`, 75, y, { align: 'right' });
  y += 4;
  if (sale.discount > 0) {
    doc.text(`Chegirma: ${formatMoney(sale.discount)}`, 75, y, { align: 'right' });
    y += 4;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`JAMI: ${formatMoney(sale.total)}`, 75, y, { align: 'right' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`To'lov: ${sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}`, 75, y, { align: 'right' });
  y += 8;
  doc.line(5, y, 75, y);
  y += 5;
  doc.setFontSize(9);
  doc.text('Rahmat!', 40, y, { align: 'center' });

  doc.save(`${sale.receiptNumber}.pdf`);
}

export function exportReportPDF(title: string, data: { headers: string[], rows: string[][] }, brandName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName, 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(title, 105, 30, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sana: ${formatDate(new Date().toISOString())}`, 105, 38, { align: 'center' });

  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: 45,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`${title.replace(/\s/g, '_')}.pdf`);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
