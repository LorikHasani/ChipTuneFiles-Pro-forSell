import { useState } from 'react';
import { Tag, Clock, Zap } from 'lucide-react';
import { useServices } from '../hooks/useApi';
import { formatCurrency, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import type { ServiceCategory, JobType } from '../types';

export default function PricesPage() {
  const { categories, loading } = useServices();
  const [activeTab, setActiveTab] = useState<JobType>('ECU');

  const filtered = (categories || []).filter((c: ServiceCategory) => c.jobType === activeTab);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Service Prices" subtitle="View all available tuning services and pricing" />

      {/* Tab switch */}
      <div className="flex gap-2">
        {(['ECU', 'TCU'] as JobType[]).map(type => (
          <button key={type} onClick={() => setActiveTab(type)}
            className={cn('px-6 py-2.5 rounded-lg font-medium text-sm transition-colors',
              activeTab === type ? 'bg-primary-600 text-white' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600')}>
            {type} Tuning
          </button>
        ))}
      </div>

      {/* Categories and services */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No services available for {activeTab} tuning.</p>
      ) : (
        <div className="space-y-8">
          {filtered.map((cat: ServiceCategory) => (
            <div key={cat.id}>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cat.name}</h2>
                {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {cat.selectionType === 'SINGLE' ? 'Choose one option per job' : 'Can combine multiple options'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(cat.services || []).map(svc => (
                  <div key={svc.id} className="card p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {svc.icon ? <span className="text-xl">{svc.icon}</span> : <Zap size={20} className="text-primary-500" />}
                        <h3 className="font-semibold text-gray-900 dark:text-white">{svc.name}</h3>
                      </div>
                      <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2.5 py-0.5 rounded-full text-sm font-bold">
                        {formatCurrency(svc.basePrice)}
                      </span>
                    </div>
                    {svc.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{svc.description}</p>
                    )}
                    {svc.estimatedHours && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={14} />
                        <span>Est. {svc.estimatedHours}h</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
