import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ArrowUpRight, ArrowDownRight, ShoppingCart, Shield, Zap, Edit3 } from 'lucide-react';
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
    if (type === 'CREDIT_PURCHASE' || type === 'ADMIN_ADJUSTMENT') return <ArrowUpRight size={16} className="text-emerald-500" />;
    return <ArrowDownRight size={16} className="text-red-500" />;
  };

  const sortedPackages = [...(packages || [])];
  const popularIdx = sortedPackages.length >= 3 ? 2 : -1;

  return (
    <div className="space-y-6">
      <PageHeader title="Balance" subtitle="Manage your credits and top up your balance" />

      {/* Balance card */}
      <div className="rounded-xl p-6 bg-gradient-to-br from-neutral-950 to-black border border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 mb-1">Your Balance</p>
            <p className="text-4xl font-bold text-white">{formatCurrency(user?.creditBalance ?? 0)}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-neutral-800">
            <Shield size={14} className="text-neutral-400" />
            <span className="text-xs text-neutral-400">Secure payments via Stripe</span>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-neutral-400" />
          <h2 className="text-base font-bold text-white">Top Up Balance</h2>
        </div>
        <p className="text-xs text-neutral-500 mb-4">Choose a package to add funds to your balance.</p>

        {loadingPkg ? <Spinner /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedPackages.map((pkg: CreditPackage, idx: number) => {
              const isPopular = idx === popularIdx;
              const priceNum = Number(pkg.price);
              const creditsNum = Number(pkg.credits);
              const perUnit = creditsNum > 0 ? (priceNum / creditsNum).toFixed(2) : '0';
              const totalWithBonus = creditsNum + (pkg.bonusCredits || 0);

              return (
                <div key={pkg.id}
                  className={cn('card p-5 flex flex-col relative', isPopular && 'ring-1 ring-red-600')}>
                  {isPopular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                      Most Popular
                    </div>
                  )}

                  <h3 className="font-semibold text-neutral-400 text-sm">{pkg.name}</h3>
                  <p className="text-3xl font-bold text-white mt-2">{formatCurrency(pkg.price)}</p>
                  <p className="text-xs text-neutral-500 mb-3">{formatCurrency(perUnit)}/unit</p>

                  <div className="space-y-1.5 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard size={14} className="text-neutral-500" />
                      <span className="text-neutral-400">{formatCurrency(pkg.credits)}</span>
                    </div>
                    {pkg.bonusCredits > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap size={14} className="text-neutral-400" />
                        <span className="text-neutral-400">+{formatCurrency(pkg.bonusCredits)} bonus</span>
                      </div>
                    )}
                    <p className="text-xs text-neutral-500">Total: {formatCurrency(totalWithBonus)}</p>
                  </div>

                  <button onClick={() => handleBuyPackage(pkg)} disabled={purchasing === pkg.id}
                    className={cn('w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2',
                      isPopular ? 'bg-red-600 text-white hover:bg-neutral-800' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300')}>
                    {purchasing === pkg.id ? <Spinner size="sm" /> : null}
                    Buy for {formatCurrency(pkg.price)}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Amount */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Edit3 size={16} className="text-neutral-500" />
          <h2 className="text-base font-bold text-white">Custom Amount</h2>
        </div>
        <p className="text-xs text-neutral-500 mb-4">Need a specific amount? Enter how much you'd like to add.</p>
        <div className="flex gap-3 items-center">
          <input type="number" className="input max-w-xs" placeholder="Min 10, Max 10,000"
            value={customAmount} onChange={e => setCustomAmount(e.target.value)} min={10} max={10000} />
          <button onClick={handleBuyCustom} disabled={purchasing === 'custom'}
            className="btn-primary whitespace-nowrap">
            {purchasing === 'custom' ? <Spinner size="sm" /> : null}
            Buy for {formatCurrency(parseInt(customAmount) || 0)}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-base font-bold text-white">Transaction History</h2>
        </div>
        {loadingTx ? <div className="p-4"><Spinner /></div> : !transactions?.length ? (
          <p className="p-4 text-neutral-500 text-sm">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {transactions.map((tx: Transaction) => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="text-sm font-medium text-neutral-300">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-neutral-500">{formatDateTime(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('font-semibold text-sm',
                    tx.type === 'JOB_PAYMENT' ? 'text-red-400' : 'text-emerald-500')}>
                    {tx.type === 'JOB_PAYMENT' ? '-' : '+'}{Math.abs(Number(tx.amount)).toFixed(0)}
                  </p>
                  <p className="text-xs text-neutral-500">Balance: {tx.balanceAfter != null ? Number(tx.balanceAfter).toFixed(0) : '0'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
