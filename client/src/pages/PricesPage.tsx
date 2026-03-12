import { Settings2, Info, AlertCircle } from 'lucide-react';
import { useServices } from '../hooks/useApi';
import { formatCurrency, cn } from '../lib/utils';
import { getLucideIcon } from '../lib/iconMap';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import type { ServiceCategory, Service } from '../types';

const CATEGORY_COLORS: Record<string, { border: string; text: string; price: string; dot: string }> = {
  'Performance Tuning': { border: 'border-l-orange-500', text: 'text-orange-400', price: 'text-yellow-400', dot: 'bg-orange-500' },
  'Emissions': { border: 'border-l-green-500', text: 'text-green-400', price: 'text-green-400', dot: 'bg-green-500' },
  'Special Features': { border: 'border-l-blue-500', text: 'text-blue-400', price: 'text-blue-400', dot: 'bg-blue-500' },
};
const DEFAULT_COLOR = { border: 'border-l-purple-500', text: 'text-purple-400', price: 'text-purple-400', dot: 'bg-purple-500' };

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
      <PageHeader title="Services & Pricing" subtitle="Transparent pricing for all our tuning services" />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500 text-center py-12">No services available.</p>
      ) : (
        Object.entries(grouped).map(([groupName, cats]) => {
          const hasSubGroups = cats.length > 1;
          const totalServices = cats.reduce((sum, c) => sum + (c.services?.length || 0), 0);
          const isMultiple = cats[0].selectionType === 'MULTIPLE';
          const colors = CATEGORY_COLORS[groupName] || DEFAULT_COLOR;

          return (
            <div key={groupName}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-4">
                <span className={cn('w-2.5 h-2.5 rounded-full', colors.dot)} />
                <h2 className={cn('text-xl font-bold', colors.text)}>{groupName}</h2>
                {isMultiple && (
                  <span className="text-sm text-gray-500">({totalServices} available)</span>
                )}
              </div>

              {hasSubGroups ? (
                cats.map(cat => (
                  <div key={cat.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings2 size={16} className="text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                        {cat.jobType === 'ECU' ? 'ECU' : 'GEARBOX / TCU'}
                      </h3>
                    </div>
                    <ServiceGrid services={cat.services || []} isMultiple={cat.selectionType === 'MULTIPLE'} colors={colors} />
                  </div>
                ))
              ) : (
                <ServiceGrid services={cats[0].services || []} isMultiple={isMultiple} colors={colors} />
              )}
            </div>
          );
        })
      )}

      {/* Info footer */}
      <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-800">
        <AlertCircle size={16} />
        <span>All prices are in euros (&euro;). Services are selected during file upload. You can combine a tuning stage with multiple additional options.</span>
      </div>
    </div>
  );
}

function ServiceIcon({ icon }: { icon: string | null | undefined }) {
  if (!icon) return <Settings2 size={24} className="text-gray-500" />;
  const LucideComp = getLucideIcon(icon);
  if (LucideComp) return <LucideComp size={24} className="text-gray-500" />;
  return <span className="text-2xl">{icon}</span>;
}

function ServiceGrid({ services, isMultiple, colors }: {
  services: Service[];
  isMultiple: boolean;
  colors: { border: string; text: string; price: string; dot: string };
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {services.map(svc => (
        <div key={svc.id}
          className={cn(
            'relative card p-4 flex flex-col items-center text-center border-l-4',
            colors.border
          )}>
          {svc.description && (
            <div className="absolute top-2 right-2 group">
              <Info size={14} className="text-gray-500 cursor-help" />
              <div className="hidden group-hover:block absolute right-0 top-5 z-10 w-48 p-2 text-xs text-left bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700">
                {svc.description}
              </div>
            </div>
          )}
          <div className="mb-2">
            <ServiceIcon icon={svc.icon} />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">{svc.name}</h4>
          <span className={cn('text-sm font-bold', isMultiple ? colors.price : 'text-yellow-400')}>
            {isMultiple ? '+' : ''}{formatCurrency(svc.basePrice)}
          </span>
        </div>
      ))}
    </div>
  );
}
