import type { Transaction } from '../types';

interface InvoiceData {
  transaction: Transaction;
  user: {
    contactName: string | null;
    companyName: string | null;
    email: string;
    country: string | null;
  };
  branding: {
    brand_name: string;
    contact_email: string;
  };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'CREDIT_PURCHASE': return 'Credit Purchase';
    case 'JOB_PAYMENT': return 'Job Payment';
    case 'REFUND': return 'Refund';
    case 'ADMIN_ADJUSTMENT': return 'Credit Adjustment';
    default: return type;
  }
}

export function generateInvoice({ transaction, user, branding }: InvoiceData): void {
  const tx = transaction;
  const isCredit = tx.type !== 'JOB_PAYMENT';
  const invoiceNumber = `INV-${tx.id.slice(0, 8).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5; }
    .brand { font-size: 24px; font-weight: 800; color: #dc2626; }
    .brand-sub { font-size: 11px; color: #737373; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 28px; font-weight: 700; color: #171717; text-transform: uppercase; letter-spacing: 2px; }
    .invoice-title p { font-size: 12px; color: #737373; margin-top: 4px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .meta-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; margin-bottom: 8px; font-weight: 600; }
    .meta-section p { font-size: 13px; color: #404040; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #737373; padding: 12px 16px; border-bottom: 2px solid #e5e5e5; font-weight: 600; }
    .table th:last-child { text-align: right; }
    .table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f5f5f5; }
    .table td:last-child { text-align: right; font-weight: 600; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #525252; }
    .totals-row.total { border-top: 2px solid #171717; padding-top: 12px; margin-top: 4px; font-size: 16px; font-weight: 700; color: #171717; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e5e5e5; }
    .footer p { font-size: 11px; color: #a3a3a3; line-height: 1.8; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-credit { background: #dcfce7; color: #166534; }
    .badge-debit { background: #fef2f2; color: #991b1b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${branding.brand_name}</div>
      <div class="brand-sub">${branding.contact_email}</div>
    </div>
    <div class="invoice-title">
      <h1>${tx.type === 'JOB_PAYMENT' ? 'Receipt' : 'Invoice'}</h1>
      <p>${invoiceNumber}</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-section">
      <h3>Bill To</h3>
      <p>
        <strong>${user.contactName || 'Customer'}</strong><br />
        ${user.companyName ? user.companyName + '<br />' : ''}
        ${user.email}<br />
        ${user.country || ''}
      </p>
    </div>
    <div class="meta-section" style="text-align: right;">
      <h3>Details</h3>
      <p>
        <strong>Date:</strong> ${formatDate(tx.createdAt)}<br />
        <strong>Type:</strong> ${getTypeLabel(tx.type)}<br />
        <strong>Status:</strong> <span class="badge ${isCredit ? 'badge-credit' : 'badge-debit'}">${isCredit ? 'Paid' : 'Deducted'}</span>
      </p>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Type</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${tx.description || getTypeLabel(tx.type)}</td>
        <td><span class="badge ${isCredit ? 'badge-credit' : 'badge-debit'}">${getTypeLabel(tx.type)}</span></td>
        <td>${isCredit ? '+' : '-'}\u20AC${Math.abs(Number(tx.amount)).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span>Balance Before</span>
        <span>\u20AC${Number(tx.balanceBefore).toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>${isCredit ? 'Added' : 'Deducted'}</span>
        <span style="color: ${isCredit ? '#16a34a' : '#dc2626'}">${isCredit ? '+' : '-'}\u20AC${Math.abs(Number(tx.amount)).toFixed(2)}</span>
      </div>
      <div class="totals-row total">
        <span>Balance After</span>
        <span>\u20AC${Number(tx.balanceAfter).toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>
      This is an automatically generated document.<br />
      ${branding.brand_name} &mdash; ${branding.contact_email}<br />
      Thank you for your business!
    </p>
  </div>
</body>
</html>
  `.trim();

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}
