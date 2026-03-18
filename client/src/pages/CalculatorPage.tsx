import { useState } from 'react';
import { Calculator, Zap, Gauge } from 'lucide-react';
import { cn } from '../lib/utils';
import PageHeader from '../components/PageHeader';

const stages = [
  { label: 'Stage 1', hpGain: [20, 30], torqueGain: [25, 35], desc: 'ECU software optimization' },
  { label: 'Stage 2', hpGain: [30, 50], torqueGain: [35, 55], desc: 'ECU + hardware modifications' },
  { label: 'Stage 3', hpGain: [50, 80], torqueGain: [55, 85], desc: 'Full performance build' },
];

export default function CalculatorPage() {
  const [hp, setHp] = useState('');
  const [torque, setTorque] = useState('');
  const [stageIdx, setStageIdx] = useState(0);
  const [calculated, setCalculated] = useState(false);

  const currentHp = parseInt(hp) || 0;
  const currentTq = parseInt(torque) || 0;
  const stage = stages[stageIdx];

  const hpLow = Math.round(currentHp * (1 + stage.hpGain[0] / 100));
  const hpHigh = Math.round(currentHp * (1 + stage.hpGain[1] / 100));
  const tqLow = Math.round(currentTq * (1 + stage.torqueGain[0] / 100));
  const tqHigh = Math.round(currentTq * (1 + stage.torqueGain[1] / 100));

  const handleCalculate = () => {
    if (currentHp > 0) setCalculated(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Performance Calculator" subtitle="Estimate your tuning gains" />

      <div className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Current Horsepower (HP)</label>
            <input className="input" type="number" placeholder="e.g. 190" value={hp}
              onChange={e => { setHp(e.target.value); setCalculated(false); }} />
          </div>
          <div>
            <label className="label">Current Torque (Nm)</label>
            <input className="input" type="number" placeholder="e.g. 400" value={torque}
              onChange={e => { setTorque(e.target.value); setCalculated(false); }} />
          </div>
        </div>

        {/* Stage selection */}
        <div>
          <label className="label">Tuning Stage</label>
          <div className="grid grid-cols-3 gap-3">
            {stages.map((s, i) => (
              <button key={i} onClick={() => { setStageIdx(i); setCalculated(false); }}
                className={cn('p-3 rounded-lg border-2 text-left transition-colors',
                  stageIdx === i ? 'border-neutral-500 bg-neutral-100 dark:bg-neutral-800' :
                  'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300')}>
                <p className={cn('font-bold text-sm', stageIdx === i ? 'text-neutral-900 dark:text-white' : 'text-neutral-900 dark:text-white')}>
                  {s.label}
                </p>
                <p className="text-xs text-neutral-500 mt-1">+{s.hpGain[0]}-{s.hpGain[1]}% HP</p>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleCalculate} disabled={!currentHp}
          className="btn-primary w-full">
          <Calculator size={16} /> Calculate Estimated Gains
        </button>
      </div>

      {/* Results */}
      {calculated && currentHp > 0 && (
        <div className="card p-6 space-y-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            Estimated Results - {stage.label}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HP */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
                <Zap size={20} className="text-yellow-500" />
                <span className="font-semibold">Horsepower</span>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-500">Original</span>
                  <span className="font-bold">{currentHp} HP</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-3 mb-2">
                  <div className="bg-neutral-400 h-3 rounded-full" style={{ width: '60%' }} />
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-emerald-600 font-medium">After {stage.label}</span>
                  <span className="font-bold text-emerald-600">{hpLow} - {hpHigh} HP</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-3">
                  <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${Math.min(95, 60 * (hpHigh / currentHp))}%` }} />
                </div>
                <p className="text-center text-emerald-600 font-bold mt-3 text-lg">
                  +{hpLow - currentHp} to +{hpHigh - currentHp} HP
                </p>
              </div>
            </div>

            {/* Torque */}
            {currentTq > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
                  <Gauge size={20} className="text-neutral-500" />
                  <span className="font-semibold">Torque</span>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">Original</span>
                    <span className="font-bold">{currentTq} Nm</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-3 mb-2">
                    <div className="bg-neutral-400 h-3 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600 font-medium">After {stage.label}</span>
                    <span className="font-bold text-neutral-600">{tqLow} - {tqHigh} Nm</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-3">
                    <div className="bg-neutral-500 h-3 rounded-full" style={{ width: `${Math.min(95, 60 * (tqHigh / currentTq))}%` }} />
                  </div>
                  <p className="text-center text-neutral-600 font-bold mt-3 text-lg">
                    +{tqLow - currentTq} to +{tqHigh - currentTq} Nm
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-400 text-center">
            * These are estimates only. Actual results depend on vehicle condition, modifications, and environmental factors.
          </p>
        </div>
      )}
    </div>
  );
}
