import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Gift, ArrowUpRight, ArrowDownRight, ShoppingCart, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useCreditPackages, useTransactions, createCheckout, verifyPayment } from '../hooks/useApi';
import { formatCurrency, formatDateTime, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import type { CreditPackage, Transaction } from '../types';

export default function CreditsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const { packages, loading: loadingPkg } = useCreditPackages();
  const { transactions, loading: loadingTx, refetch: refetchTx } = useTransactions();
  const [customAmount, setCustomAmount] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Handle Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (success === 'true' && sessionId) {
      verifyPayment(sessionId).then(() => {
        toast.success('Payment successful! Credits have been added.');
        refreshUser();
        refetchTx();
      }).catch(() => {
        toast.success('Payment received! Credits will be added shortly.');
        refreshUser();
      });
      setSearchParams({});
    } else if (canceled === 'true') {
      toast.error('Payment was canceled.');
      setSearchParams({});
    }
  }, []);

  const handleBuyPackage = async (pkg: CreditPackage) => {
    setPurchasing(pkg.id);
    try {
      const url = await createCheckout(pkg.id);
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create checkout');
      setPurchasing(null);
    }
  };

  const handleBuyCustom = async () => {
    const amount = parseInt(customAmount);
    if (!amount || amount < 10 || amount > 10000) {
      toast.error('Enter an amount between 10 and 10,000');
      return;
    }
    setPurchasing('custom');
    try {
      const url = await createCheckout(undefined, amount);
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create checkout');
      setPurchasing(null);
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'CREDIT_PURCHASE' || type === 'ADMIN_ADJUSTMENT') return <ArrowUpRight size={16} className="text-green-500" />;
    return <ArrowDownRight size={16} className="text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Credits" subtitle="Purchase credits to use for tuning services" />

      {/* Balance card */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard size={24} />
          <span className="text-primary-100">Current Balance</span>
        </div>
        <p className="text-4xl font-bold">{user?.creditBalance != null ? Number(user.creditBalance).toFixed(0) : '0'} <span className="text-lg font-normal text-primary-200">credits</span></p>
      </div>

      {/* Credit Packages */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Credit Packages</h2>
        {loadingPkg ? <Spinner /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {(packages || []).map((pkg: CreditPackage) => (
              <div key={pkg.id} className="card p-4 flex flex-col relative">
                {pkg.bonusCredits > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Gift size={12} /> +{pkg.bonusCredits}
                  </div>
                )}
                <h3 className="font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">{pkg.credits}</p>
                <p className="text-xs text-gray-500 mb-3">credits{pkg.bonusCredits > 0 ? ` + ${pkg.bonusCredits} bonus` : ''}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{formatCurrency(pkg.price)}</p>
                <button onClick={() => handleBuyPackage(pkg)} disabled={purchasing === pkg.id}
                  className="btn-primary mt-auto w-full">
                  {purchasing === pkg.id ? <Spinner size="sm" /> : <ShoppingCart size={16} />}
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Amount */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Amount</h2>
        <p className="text-sm text-gray-500 mb-4">1 credit = {formatCurrency(1)}. Minimum 10 credits, maximum 10,000.</p>
        <div className="flex gap-3">
          <input type="number" className="input max-w-xs" placeholder="Enter amount (10-10000)"
            value={customAmount} onChange={e => setCustomAmount(e.target.value)} min={10} max={10000} />
          <button onClick={handleBuyCustom} disabled={purchasing === 'custom'}
            className="btn-primary whitespace-nowrap">
            {purchasing === 'custom' ? <Spinner size="sm" /> : null}
            Buy {customAmount ? `${customAmount} credits for ${formatCurrency(parseInt(customAmount) || 0)}` : 'Credits'}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h2>
        </div>
        {loadingTx ? <div className="p-4"><Spinner /></div> : !transactions?.length ? (
          <p className="p-4 text-gray-500 text-sm">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((tx: Transaction) => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('font-semibold text-sm',
                    tx.type === 'JOB_PAYMENT' ? 'text-red-600' : 'text-green-600')}>
                    {tx.type === 'JOB_PAYMENT' ? '-' : '+'}{Math.abs(Number(tx.amount)).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">Balance: {tx.balanceAfter != null ? Number(tx.balanceAfter).toFixed(0) : '0'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
