import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { useVehicleData, type VehicleData } from '../hooks/useVehicleData';
import { cn } from '../lib/utils';

interface VehicleSelectorProps {
  vehicle: {
    brand: string;
    model: string;
    year: string;
    engineType: string;
    powerHp: string;
    ecuType: string;
  };
  onChange: (updates: Partial<VehicleSelectorProps['vehicle']>) => void;
}

// Searchable combobox component
function ComboBox({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(lower));
  }, [options, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!open) setSearch('');
  }, [value, open]);

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}</label>
      <div
        className={cn(
          'input flex items-center gap-2 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          open && 'ring-2 ring-neutral-400 dark:ring-white/30 border-neutral-400 dark:border-neutral-600'
        )}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-sm dark:text-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={cn('flex-1 text-sm truncate', !value && 'text-neutral-400 dark:text-neutral-600')}>
            {value || placeholder}
          </span>
        )}
        {value && !open ? (
          <X
            size={14}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 shrink-0"
            onClick={e => { e.stopPropagation(); onChange(''); }}
          />
        ) : (
          <ChevronDown size={14} className={cn('text-neutral-400 shrink-0 transition-transform', open && 'rotate-180')} />
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">
              {search ? (
                <button
                  className="w-full text-left hover:text-neutral-900 dark:hover:text-white"
                  onClick={() => { onChange(search); setOpen(false); }}
                >
                  Use "{search}" as custom value
                </button>
              ) : (
                'No options available'
              )}
            </div>
          ) : (
            <>
              {filtered.map(option => (
                <button
                  key={option}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
                    option === value && 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-medium'
                  )}
                  onClick={() => { onChange(option); setOpen(false); }}
                >
                  {option}
                </button>
              ))}
              {search && !filtered.includes(search) && (
                <button
                  className="w-full text-left px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-800"
                  onClick={() => { onChange(search); setOpen(false); }}
                >
                  Use "{search}" as custom value
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function VehicleSelector({ vehicle, onChange }: VehicleSelectorProps) {
  const { data, loading, error } = useVehicleData();

  const brands = useMemo(() => data ? Object.keys(data).sort() : [], [data]);

  const models = useMemo(() => {
    if (!data || !vehicle.brand || !data[vehicle.brand]) return [];
    return Object.keys(data[vehicle.brand]).sort();
  }, [data, vehicle.brand]);

  const generations = useMemo(() => {
    if (!data || !vehicle.brand || !vehicle.model) return [];
    const brandData = data[vehicle.brand];
    if (!brandData || !brandData[vehicle.model]) return [];
    return Object.keys(brandData[vehicle.model]);
  }, [data, vehicle.brand, vehicle.model]);

  const [selectedGeneration, setSelectedGeneration] = useState('');

  const engines = useMemo(() => {
    if (!data || !vehicle.brand || !vehicle.model || !selectedGeneration) return [];
    const modelData = data[vehicle.brand]?.[vehicle.model];
    if (!modelData || !modelData[selectedGeneration]) return [];
    return Object.keys(modelData[selectedGeneration]);
  }, [data, vehicle.brand, vehicle.model, selectedGeneration]);

  const ecuOptions = useMemo(() => {
    if (!data || !vehicle.brand || !vehicle.model || !selectedGeneration || !vehicle.engineType) return [];
    const engineData = data[vehicle.brand]?.[vehicle.model]?.[selectedGeneration]?.[vehicle.engineType];
    return engineData?.ecus || [];
  }, [data, vehicle.brand, vehicle.model, selectedGeneration, vehicle.engineType]);

  const handleEngineSelect = (engineName: string) => {
    if (!data || !vehicle.brand || !vehicle.model || !selectedGeneration) {
      onChange({ engineType: engineName });
      return;
    }
    const engineData = data[vehicle.brand]?.[vehicle.model]?.[selectedGeneration]?.[engineName];
    const updates: Partial<VehicleSelectorProps['vehicle']> = { engineType: engineName };

    if (engineData?.hp) {
      updates.powerHp = String(engineData.hp);
    }
    if (engineData?.ecus?.length === 1) {
      updates.ecuType = engineData.ecus[0];
    } else if (engineData?.ecus?.length === 0) {
      updates.ecuType = '';
    }
    onChange(updates);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-neutral-500">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading vehicle database...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'brand', label: 'Brand', placeholder: 'e.g. BMW' },
          { key: 'model', label: 'Model', placeholder: 'e.g. 320d' },
          { key: 'engineType', label: 'Engine Type', placeholder: 'e.g. N47D20' },
          { key: 'ecuType', label: 'ECU Type', placeholder: 'e.g. Bosch EDC17' },
        ].map(field => (
          <div key={field.key}>
            <label className="label">{field.label}</label>
            <input
              className="input"
              type="text"
              placeholder={field.placeholder}
              value={(vehicle as any)[field.key]}
              onChange={e => onChange({ [field.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ComboBox
        label="Brand"
        value={vehicle.brand}
        options={brands}
        placeholder="Select brand..."
        onChange={val => {
          onChange({ brand: val, model: '', engineType: '', powerHp: '', ecuType: '' });
          setSelectedGeneration('');
        }}
      />

      <ComboBox
        label="Model"
        value={vehicle.model}
        options={models}
        placeholder={vehicle.brand ? 'Select model...' : 'Select brand first'}
        disabled={!vehicle.brand}
        onChange={val => {
          onChange({ model: val, engineType: '', powerHp: '', ecuType: '' });
          setSelectedGeneration('');
        }}
      />

      <div>
        <label className="label">Version/Generation</label>
        <select
          className="input"
          value={selectedGeneration}
          disabled={generations.length === 0}
          onChange={e => {
            setSelectedGeneration(e.target.value);
            onChange({ engineType: '', powerHp: '', ecuType: '' });
          }}
        >
          <option value="">{generations.length === 0 ? 'Select Model first' : 'Select Version...'}</option>
          {generations.map(gen => (
            <option key={gen} value={gen}>{gen}</option>
          ))}
        </select>
      </div>

      <ComboBox
        label="Engine"
        value={vehicle.engineType}
        options={engines}
        placeholder={selectedGeneration ? 'Select engine...' : 'Select Version first'}
        disabled={!selectedGeneration}
        onChange={handleEngineSelect}
      />

      {ecuOptions.length > 1 ? (
        <ComboBox
          label="ECU Type"
          value={vehicle.ecuType}
          options={ecuOptions}
          placeholder="Select ECU..."
          onChange={val => onChange({ ecuType: val })}
        />
      ) : (
        <div>
          <label className="label">ECU Type</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Bosch EDC17"
            value={vehicle.ecuType}
            onChange={e => onChange({ ecuType: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
