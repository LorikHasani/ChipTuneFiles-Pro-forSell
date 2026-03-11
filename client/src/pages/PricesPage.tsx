import { Settings2, Info } from 'lucide-react';
import { useServices } from '../hooks/useApi';
import { formatCurrency, cn } from '../lib/utils';
import { getLucideIcon } from '../lib/iconMap';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import type { ServiceCategory, Service } from '../types';

export default function PricesPage() {
  const { categories, loading } = useServices();

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const allCategories = categories || [];

  // Group categories by name to merge ECU + TCU under one heading
  const grouped: Record<string, ServiceCategory[]> = {};
  for (const cat of allCategories) {
    const key = cat.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(cat);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Service Prices" subtitle="Transparent pricing for all our tuning services" />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500 text-center py-12">No services available.</p>
      ) : (
        Object.entries(grouped).map(([groupName, cats]) => {
          const hasSubGroups = cats.length > 1;
          const totalServices = cats.reduce((sum, c) => sum + (c.services?.length || 0), 0);
          const isMultiple = cats[0].selectionType === 'MULTIPLE';

          return (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-4">
                {isMultiple ? (
                  <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                ) : (
                  <Settings2 size={20} className="text-gray-400" />
                )}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{groupName}</h2>
                {isMultiple && (
                  <span className="text-sm text-gray-400">({totalServices} available)</span>
                )}
              </div>

              {hasSubGroups ? (
                cats.map(cat => (
                  <div key={cat.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings2 size={16} className="text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {cat.jobType === 'ECU' ? 'ECU' : 'GEARBOX / TCU'}
                      </h3>
                    </div>
                    <ServiceGrid services={cat.services || []} isMultiple={cat.selectionType === 'MULTIPLE'} />
                  </div>
                ))
              ) : (
                <ServiceGrid services={cats[0].services || []} isMultiple={isMultiple} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function ServiceIcon({ icon }: { icon: string | null | undefined }) {
  if (!icon) return <Settings2 size={24} className="text-gray-400 dark:text-gray-500" />;

  // Try as Lucide icon name first
  const LucideComp = getLucideIcon(icon);
  if (LucideComp) return <LucideComp size={24} className="text-gray-400 dark:text-gray-500" />;

  // Otherwise treat as emoji
  return <span className="text-2xl">{icon}</span>;
}

function ServiceGrid({ services, isMultiple }: { services: Service[]; isMultiple: boolean }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {services.map(svc => (
        <div key={svc.id}
          className="relative card p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
          {svc.description && (
            <div className="absolute top-2 right-2 group">
              <Info size={14} className="text-gray-400 cursor-help" />
              <div className="hidden group-hover:block absolute right-0 top-5 z-10 w-48 p-2 text-xs text-left bg-gray-800 text-white rounded-lg shadow-lg">
                {svc.description}
              </div>
            </div>
          )}
          <div className="mb-2">
            <ServiceIcon icon={svc.icon} />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{svc.name}</h4>
          <span className={cn('text-sm font-bold',
            isMultiple ? 'text-green-500' : 'text-primary-400')}>
            {isMultiple ? '+' : ''}{formatCurrency(svc.basePrice)}
          </span>
        </div>
      ))}
    </div>
  );
}
