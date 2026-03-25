import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ArrowUpRight, ArrowDownRight, ShoppingCart, Shield, Zap, Edit3, Clock, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useCreditPackages, useTransactions, createCheckout, verifyPayment } from '../hooks/useApi';
import { formatCurrency, formatDateTime, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import type { CreditPackage, Transaction } from '../types';
import { useBrandingStore } from '../stores/brandingStore';
import { generateInvoice } from '../lib/generateInvoice';

export default function CreditsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const { branding } = useBrandingStore();
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

  const sortedPackages = [...(packages || [])];
  const popularIdx = sortedPackages.length >= 3 ? 2 : -1;

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 bg-neutral-100 dark:bg-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Your Balance</p>
            <p className="text-4xl font-bold text-neutral-900 dark:text-white">{formatCurrency(user?.creditBalance ?? 0)}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600">
            <Shield size={14} className="text-green-500" />
            <span className="text-xs text-neutral-600 dark:text-neutral-300">Secure payments via Stripe</span>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-neutral-400" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Top Up Balance</h2>
        </div>
        <p className="text-xs text-neutral-500 mb-4">Choose a package to add funds to your balance.</p>

        {loadingPkg ? <Spinner /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedPackages.map((pkg: CreditPackage, idx: number) => {
              const isPopular = idx === popularIdx;
              const priceNum = Number(pkg.price);
              const creditsNum = Number(pkg.credits);
              const perUnit = creditsNum > 0 ? (priceNum / creditsNum).toFixed(2) : '0';
              const totalWithBonus = creditsNum + Number(pkg.bonusCredits || 0);

              return (
                <div key={pkg.id}
                  className={cn(
                    'rounded-xl border p-5 flex flex-col relative',
                    isPopular
                      ? 'border-red-600 bg-white dark:bg-neutral-900'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                  )}>
                  {isPopular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-red-600/80 text-white text-[10px] font-medium rounded-full tracking-wide">
                      Most Popular
                    </div>
                  )}

                  <h3 className="font-bold text-neutral-900 dark:text-white text-sm">{pkg.name}</h3>
                  <p className="text-3xl font-bold mt-1 text-neutral-900 dark:text-white">{formatCurrency(pkg.price)}</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mb-3">{formatCurrency(perUnit)}/unit</p>

                  <div className="space-y-1.5 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard size={14} className="text-neutral-400 dark:text-neutral-500" />
                      <span className="text-neutral-600 dark:text-neutral-300">{formatCurrency(pkg.credits)}</span>
                    </div>
                    {pkg.bonusCredits > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap size={14} className="text-green-600 dark:text-green-500" />
                        <span className="text-green-600 dark:text-green-500">+{formatCurrency(pkg.bonusCredits)} bonus</span>
                      </div>
                    )}
                    <div className="border-t border-neutral-200 dark:border-neutral-700/50 pt-1.5 mt-1.5">
                      <p className="text-xs text-neutral-500">Total: {formatCurrency(totalWithBonus)}</p>
                    </div>
                  </div>

                  <button onClick={() => handleBuyPackage(pkg)} disabled={purchasing === pkg.id}
                    className={cn('w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 mt-auto',
                      isPopular ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300')}>
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
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Custom Amount</h2>
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
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <Clock size={16} className="text-neutral-400" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Transaction History</h2>
        </div>
        {loadingTx ? <div className="p-4"><Spinner /></div> : !transactions?.length ? (
          <p className="p-4 text-neutral-500 text-sm">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500">Balance</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {transactions.map((tx: Transaction) => {
                  const isDebit = tx.type === 'JOB_PAYMENT';
                  const typeLabel = tx.type === 'CREDIT_PURCHASE' ? 'Purchase'
                    : tx.type === 'JOB_PAYMENT' ? 'Job Payment'
                    : tx.type === 'REFUND' ? 'Refund'
                    : 'Adjustment';
                  const typeBadgeClass = tx.type === 'JOB_PAYMENT'
                    ? 'bg-red-500/10 text-red-400'
                    : tx.type === 'CREDIT_PURCHASE'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-emerald-500/10 text-emerald-400';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                      <td className="px-5 py-3.5 text-neutral-700 dark:text-neutral-300 font-medium">{tx.description || tx.type.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium', typeBadgeClass)}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          {isDebit
                            ? <ArrowDownRight size={14} className="text-red-400" />
                            : <ArrowUpRight size={14} className="text-emerald-500" />
                          }
                          <span className={cn('font-semibold', isDebit ? 'text-red-400' : 'text-emerald-500')}>
                            {isDebit ? '-' : '+'}{formatCurrency(Math.abs(Number(tx.amount)))}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-neutral-400 font-medium">{formatCurrency(Number(tx.balanceAfter ?? 0))}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => generateInvoice({
                            transaction: tx,
                            user: {
                              contactName: user?.contactName ?? null,
                              companyName: user?.companyName ?? null,
                              email: user?.email ?? '',
                              country: user?.country ?? null,
                            },
                            branding: {
                              brand_name: branding.brand_name,
                              contact_email: branding.contact_email,
                            },
                          })}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Download receipt"
                        >
                          <FileDown size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
