import { Settings2, Info, AlertCircle } from 'lucide-react';
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

  const grouped: Record<string, ServiceCategory[]> = {};
  for (const cat of allCategories) {
    const key = cat.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(cat);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Services & Pricing" subtitle="Transparent pricing for all our tuning services" />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-neutral-500 text-center py-12">No services available.</p>
      ) : (
        Object.entries(grouped).map(([groupName, cats]) => {
          const hasSubGroups = cats.length > 1;
          const totalServices = cats.reduce((sum, c) => sum + (c.services?.length || 0), 0);
          const isMultiple = cats[0].selectionType === 'MULTIPLE';

          return (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-lg font-bold text-white">{groupName}</h2>
                <span className="text-xs text-neutral-500">({totalServices} available)</span>
              </div>

              {hasSubGroups ? (
                cats.map(cat => (
                  <div key={cat.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings2 size={14} className="text-neutral-500" />
                      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                        {cat.jobType === 'ECU' ? 'ECU' : 'GEARBOX / TCU'}
                      </h3>
                    </div>
                    <ServiceGrid services={cat.services || []} cardType={cat.jobType === 'ECU' ? 'ecu' : 'tcu'} />
                  </div>
                ))
              ) : (
                <ServiceGrid services={cats[0].services || []} cardType="option" />
              )}
            </div>
          );
        })
      )}

      <div className="flex items-center gap-2 text-xs text-neutral-500 pt-4 border-t border-neutral-800">
        <AlertCircle size={14} />
        <span>All prices are in euros. Services are selected during file upload. You can combine a tuning stage with multiple additional options.</span>
      </div>
    </div>
  );
}

function ServiceIcon({ icon, colorClass = 'text-purple-400' }: { icon: string | null | undefined; colorClass?: string }) {
  if (!icon) return <Settings2 size={22} className={colorClass} />;
  const LucideComp = getLucideIcon(icon);
  if (LucideComp) return <LucideComp size={22} className={colorClass} />;
  return <span className="text-xl">{icon}</span>;
}

const cardStyles = {
  ecu: 'relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/10',
  tcu: 'relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center border-purple-200 dark:border-purple-700/50 bg-purple-50 dark:bg-purple-900/10',
  option: 'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-center transition-all hover:border-zinc-300 dark:hover:border-zinc-500',
};

const iconStyles = {
  ecu: 'text-blue-500 dark:text-blue-400',
  tcu: 'text-purple-500 dark:text-purple-400',
  option: 'text-zinc-500 dark:text-zinc-400',
};

const priceStyles = {
  ecu: 'text-blue-600 dark:text-blue-400',
  tcu: 'text-purple-600 dark:text-purple-400',
  option: 'text-emerald-600 dark:text-emerald-400',
};

function ServiceGrid({ services, cardType }: { services: Service[]; cardType: 'ecu' | 'tcu' | 'option' }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {services.map(svc => (
        <div key={svc.id} className={cardStyles[cardType]}>
          {svc.description && (
            <div className="absolute top-2 right-2 group">
              <Info size={14} className="text-neutral-400 cursor-help" />
              <div className="hidden group-hover:block absolute right-0 top-5 z-10 w-48 p-2 text-xs text-left bg-black text-neutral-300 rounded-lg shadow-lg border border-neutral-800">
                {svc.description}
              </div>
            </div>
          )}
          <ServiceIcon icon={svc.icon} colorClass={iconStyles[cardType]} />
          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{svc.name}</h4>
          <span className={cn('text-sm font-bold', priceStyles[cardType])}>
            {cardType === 'option' ? '+' : ''}{formatCurrency(svc.basePrice)}
          </span>
        </div>
      ))}
    </div>
  );
}
