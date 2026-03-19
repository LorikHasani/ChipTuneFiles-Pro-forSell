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

      <div className="flex items-center gap-2 text-xs text-neutral-500 pt-4 border-t border-neutral-800">
        <AlertCircle size={14} />
        <span>All prices are in euros. Services are selected during file upload. You can combine a tuning stage with multiple additional options.</span>
      </div>
    </div>
  );
}

function ServiceIcon({ icon }: { icon: string | null | undefined }) {
  if (!icon) return <Settings2 size={22} className="text-neutral-500" />;
  const LucideComp = getLucideIcon(icon);
  if (LucideComp) return <LucideComp size={22} className="text-neutral-500" />;
  return <span className="text-xl">{icon}</span>;
}

function ServiceGrid({ services, isMultiple }: { services: Service[]; isMultiple: boolean }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {services.map(svc => (
        <div key={svc.id} className="relative p-4 flex flex-col items-center text-center rounded-xl border border-purple-500/40 bg-neutral-900/80 hover:border-purple-500/60 transition-colors">
          {svc.description && (
            <div className="absolute top-2 right-2 group">
              <Info size={14} className="text-neutral-500 cursor-help" />
              <div className="hidden group-hover:block absolute right-0 top-5 z-10 w-48 p-2 text-xs text-left bg-black text-neutral-300 rounded-lg shadow-lg border border-neutral-800">
                {svc.description}
              </div>
            </div>
          )}
          <div className="mb-2">
            <ServiceIcon icon={svc.icon} />
          </div>
          <h4 className="text-sm font-medium text-neutral-300 mb-1">{svc.name}</h4>
          <span className={cn('text-sm font-bold', isMultiple ? 'text-emerald-400' : 'text-red-500')}>
            {isMultiple ? '+' : ''}{formatCurrency(svc.basePrice)}
          </span>
        </div>
      ))}
    </div>
  );
}
