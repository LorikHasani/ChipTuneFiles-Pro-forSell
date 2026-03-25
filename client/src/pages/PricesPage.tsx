<<<<<<< HEAD
import { Settings2, Info, AlertCircle } from 'lucide-react';
=======
import { Settings2, Info } from 'lucide-react';
>>>>>>> claude/thirsty-dirac
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

<<<<<<< HEAD
=======
  // Group categories by name to merge ECU + TCU under one heading
>>>>>>> claude/thirsty-dirac
  const grouped: Record<string, ServiceCategory[]> = {};
  for (const cat of allCategories) {
    const key = cat.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(cat);
  }

  return (
    <div className="space-y-8">
<<<<<<< HEAD
      <PageHeader title="Services & Pricing" subtitle="Transparent pricing for all our tuning services" />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-neutral-500 text-center py-12">No services available.</p>
      ) : (
        Object.entries(grouped).map(([groupName, cats]) => {
          const totalServices = cats.reduce((sum, c) => sum + (c.services?.length || 0), 0);
          const cat = cats[0];
          const isStage = cat.selectionType === 'SINGLE';
          let cardType: 'ecu' | 'tcu' | 'option' = 'option';
          if (isStage && cat.jobType === 'ECU') cardType = 'ecu';
          else if (isStage && cat.jobType === 'TCU') cardType = 'tcu';
=======
      <PageHeader title="Service Prices" subtitle="Transparent pricing for all our tuning services" />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500 text-center py-12">No services available.</p>
      ) : (
        Object.entries(grouped).map(([groupName, cats]) => {
          const hasSubGroups = cats.length > 1;
          const totalServices = cats.reduce((sum, c) => sum + (c.services?.length || 0), 0);
          const isMultiple = cats[0].selectionType === 'MULTIPLE';
>>>>>>> claude/thirsty-dirac

          return (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-4">
<<<<<<< HEAD
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{groupName}</h2>
                <span className="text-xs text-neutral-500">({totalServices} available)</span>
              </div>

              <ServiceGrid services={cat.services || []} cardType={cardType} />
=======
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
>>>>>>> claude/thirsty-dirac
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

function ServiceIcon({ icon, colorClass = 'text-purple-400', size = 20 }: { icon: string | null | undefined; colorClass?: string; size?: number }) {
  if (!icon) return <Settings2 size={size} className={colorClass} />;
  const LucideComp = getLucideIcon(icon);
  if (LucideComp) return <LucideComp size={size} className={colorClass} />;
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
  option: 'text-zinc-400 dark:text-zinc-500',
};

const priceStyles = {
  ecu: 'text-lg font-bold text-blue-500 dark:text-blue-400',
  tcu: 'text-lg font-bold text-purple-500 dark:text-purple-400',
  option: 'text-sm font-bold text-green-600 dark:text-green-400',
};

function ServiceGrid({ services, cardType }: { services: Service[]; cardType: 'ecu' | 'tcu' | 'option' }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {services.map(svc => (
        <div key={svc.id} className={cardStyles[cardType]}>
          {cardType !== 'option' && svc.description && (
            <div className="absolute top-2 right-2 z-10">
              <button className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600/50 transition-colors group">
                <Info size={14} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300" />
                <div className="hidden group-hover:block absolute right-0 top-7 z-10 w-48 p-2 text-xs text-left bg-black text-neutral-300 rounded-lg shadow-lg border border-neutral-800">
                  {svc.description}
                </div>
              </button>
            </div>
          )}
          <ServiceIcon icon={svc.icon} colorClass={iconStyles[cardType]} size={cardType === 'option' ? 22 : 20} />
          <h4 className={cardType === 'option'
            ? 'text-xs font-medium leading-tight text-zinc-700 dark:text-zinc-300'
            : 'font-semibold text-sm text-zinc-900 dark:text-white'}>
            {svc.name}
          </h4>
          <span className={priceStyles[cardType]}>
            {cardType === 'option' ? '+' : ''}{formatCurrency(svc.basePrice)}
          </span>
        </div>
      ))}
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
