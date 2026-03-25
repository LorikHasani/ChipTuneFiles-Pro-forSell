import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Car, Wrench, ChevronRight, ChevronLeft, Check, AlertCircle, FileText, Info, MessageSquare, Cpu, Settings, Zap, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useServices, createJob, uploadFile } from '../hooks/useApi';
import { formatCurrency, cn } from '../lib/utils';
import { getLucideIcon } from '../lib/iconMap';
import FileUpload from '../components/FileUpload';
import Spinner from '../components/Spinner';
import VehicleSelector from '../components/VehicleSelector';
import type { ServiceCategory, Service, JobType } from '../types';

const steps = [
  { id: 1, label: 'Upload File' },
  { id: 2, label: 'Car Info' },
  { id: 3, label: 'Services' },
];

const READING_TOOLS = [
  'Autotuner', 'KESS V2', 'KESS V3', 'K-TAG', 'CMD Flash', 'BDM Pro',
  'Magic Motorsport', 'PCMFlash', 'BitBox', 'MMCFlash', 'NCS Expert', 'Other',
];
const TOOL_TYPES = ['Master', 'Slave'];
const GEARBOX_TYPES = ['Manual', 'Automatic', 'DSG/DCT', 'CVT', 'AMT', 'Other'];

function ServiceIcon({ icon, colorClass = 'text-purple-400' }: { icon: string | null | undefined; colorClass?: string }) {
  if (!icon) return <Wrench size={20} className={colorClass} />;
  const LucideComp = getLucideIcon(icon);
  if (LucideComp) return <LucideComp size={20} className={colorClass} />;
  return <span className="text-lg">{icon}</span>;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              currentStep > step.id ? 'bg-green-500 text-white' :
              currentStep === step.id ? 'bg-blue-600 text-white' :
              'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
            )}>
              {currentStep > step.id ? <Check size={16} /> : step.id}
            </div>
            <span className={cn('text-sm font-medium hidden sm:inline',
              currentStep === step.id ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'
            )}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('w-16 h-0.5 mx-3', currentStep > step.id ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-700')} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function NewJobPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const { categories, loading: loadingServices } = useServices();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [jobType, setJobType] = useState<JobType>('ECU');

  const [vehicle, setVehicle] = useState({
    brand: '', model: '', year: '', engineType: '', powerHp: '',
    ecuType: '', gearboxType: '', vin: '', mileage: '', fuelType: '',
    readingTool: '', toolType: '', isOriginal: true, carNotes: '', clientNotes: '',
  });

  const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);

  const filteredCategories = (categories || []).filter((c: ServiceCategory) => c.jobType === jobType);

  const totalPrice = filteredCategories.reduce((sum: number, cat: ServiceCategory) => {
    const catServices = selectedServices[cat.id] || [];
    return sum + (cat.services || [])
      .filter(s => catServices.includes(s.id))
      .reduce((s, svc) => s + Number(svc.basePrice), 0);
  }, 0);

  const allSelectedServiceIds = Object.values(selectedServices).flat();

  const handleServiceToggle = (categoryId: string, serviceId: string, selectionType: string) => {
    setSelectedServices(prev => {
      const current = prev[categoryId] || [];
      if (selectionType === 'SINGLE') {
        return { ...prev, [categoryId]: current.includes(serviceId) ? [] : [serviceId] };
      }
      return {
        ...prev,
        [categoryId]: current.includes(serviceId)
          ? current.filter(id => id !== serviceId)
          : [...current, serviceId],
      };
    });
  };

  const handleSubmit = async () => {
    if (!file || allSelectedServiceIds.length === 0) {
      toast.error('Please select a file and at least one service');
      return;
    }
    if (totalPrice > Number(user?.creditBalance || 0)) {
      toast.error('Insufficient credits');
      return;
    }
    setSubmitting(true);
    try {
      const parseIntSafe = (v: string): number | undefined => {
        if (!v || !v.trim()) return undefined;
        const n = parseInt(v, 10);
        return isNaN(n) ? undefined : n;
      };
      const job = await createJob({
        jobType,
        brand: vehicle.brand.trim() || undefined,
        model: vehicle.model.trim() || undefined,
        year: parseIntSafe(vehicle.year),
        engineType: vehicle.engineType.trim() || undefined,
        powerHp: parseIntSafe(vehicle.powerHp),
        ecuType: vehicle.ecuType.trim() || undefined,
        gearboxType: vehicle.gearboxType.trim() || undefined,
        vin: vehicle.vin.trim() || undefined,
        mileage: parseIntSafe(vehicle.mileage),
        fuelType: vehicle.fuelType.trim() || undefined,
        readingTool: vehicle.readingTool.trim() || undefined,
        toolType: vehicle.toolType.trim() || undefined,
        isOriginal: vehicle.isOriginal,
        carNotes: vehicle.carNotes.trim() || undefined,
        clientNotes: vehicle.clientNotes.trim() || undefined,
        serviceIds: allSelectedServiceIds,
      });
      await uploadFile(job.id, file);
      await refreshUser();
      toast.success('Job created successfully!');
      navigate(`/jobs/${job.id}`);
    } catch (err: any) {
      const details = err.response?.data?.details;
      let msg = err.response?.data?.error || 'Failed to create job';
      if (details) {
        const fields = Object.entries(details)
          .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
          .join('; ');
        if (fields) msg += ` — ${fields}`;
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (currentStep === 1) return !!file;
    if (currentStep === 2) return !!vehicle.brand;
    if (currentStep === 3) return allSelectedServiceIds.length > 0 && agreedDisclaimer;
    return false;
  };

  const vehicleSummary = [vehicle.brand, vehicle.model, vehicle.engineType, vehicle.powerHp ? `${vehicle.powerHp}hp` : ''].filter(Boolean).join(' · ');

  return (
    <div className="max-w-5xl mx-auto">
      <StepIndicator currentStep={currentStep} />

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Step Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Upload size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Step 1: Upload Your File</h2>
              <p className="text-sm text-neutral-500">Select your ECU or Gearbox file</p>
            </div>
          </div>

          {/* Select File Type */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={16} className="text-neutral-500" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Select File Type</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setJobType('ECU')}
                className={cn('flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                  jobType === 'ECU'
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600')}>
                <Cpu size={32} className={jobType === 'ECU' ? 'text-red-500' : 'text-neutral-500'} />
                <span className={cn('text-sm font-medium', jobType === 'ECU' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400')}>ECU File</span>
              </button>
              <button onClick={() => setJobType('TCU')}
                className={cn('flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                  jobType === 'TCU'
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600')}>
                <Settings size={32} className={jobType === 'TCU' ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-500'} />
                <span className={cn('text-sm font-medium', jobType === 'TCU' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400')}>Gearbox File</span>
              </button>
            </div>
          </div>

          {/* Upload File */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload size={16} className="text-neutral-500" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Upload File</span>
            </div>
            <FileUpload onFileSelected={setFile} label={`Upload your ${jobType} file`} />
            {file && <p className="text-sm text-neutral-400 mt-2">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-neutral-800 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Info size={14} className="text-neutral-500" />
              <span className="text-neutral-500">Balance:</span>
              <span className="text-green-500 font-semibold">€{Number(user?.creditBalance ?? 0).toFixed(0)}</span>
            </div>
            <button onClick={() => setCurrentStep(2)} disabled={!canNext()} className="btn-primary flex items-center gap-1">
              Next Step <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Vehicle Info */}
      {currentStep === 2 && (
        <div className="space-y-5">
          {/* Step Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Car size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Step 2: Vehicle Information</h2>
              <p className="text-sm text-neutral-500">Tell us about your vehicle</p>
            </div>
          </div>

          {/* File badge */}
          {file && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-neutral-500" />
                <span className="text-sm text-neutral-400">File: {file.name}</span>
              </div>
              <span className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-bold">{jobType}</span>
            </div>
          )}

          {/* Is original */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-neutral-500" />
              <span className="text-sm text-neutral-400">Is this an original file?</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setVehicle(prev => ({ ...prev, isOriginal: true }))}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  vehicle.isOriginal ? 'border-neutral-500 bg-white/5 text-green-400' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700')}>
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', vehicle.isOriginal ? 'bg-green-400' : 'bg-neutral-700')} />
                  Yes, Original
                </span>
              </button>
              <button onClick={() => setVehicle(prev => ({ ...prev, isOriginal: false }))}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  !vehicle.isOriginal ? 'border-neutral-500 bg-white/5 text-red-400' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700')}>
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', !vehicle.isOriginal ? 'bg-red-400' : 'bg-neutral-700')} />
                  No, Modified
                </span>
              </button>
            </div>
          </div>

          {/* Vehicle Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Car size={16} className="text-neutral-500" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Vehicle Details</span>
            </div>
            <div className="space-y-4">
              <VehicleSelector vehicle={vehicle} onChange={updates => setVehicle(prev => ({ ...prev, ...updates }))} />
              <div>
                <label className="label">VIN Number</label>
                <input className="input" placeholder="17 character VIN" value={vehicle.vin} maxLength={17}
                  onChange={e => setVehicle(prev => ({ ...prev, vin: e.target.value }))} />
              </div>
              <div>
                <label className="label">Gearbox</label>
                <select className="input" value={vehicle.gearboxType}
                  onChange={e => setVehicle(prev => ({ ...prev, gearboxType: e.target.value }))}>
                  <option value="">Select Gearbox</option>
                  {GEARBOX_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Reading Tool */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wrench size={16} className="text-neutral-500" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Reading Tool</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Select Tool <span className="text-red-500">*</span></label>
                <select className="input" value={vehicle.readingTool}
                  onChange={e => setVehicle(prev => ({ ...prev, readingTool: e.target.value }))}>
                  <option value="">Select Your Tool</option>
                  {READING_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tool Type <span className="text-red-500">*</span></label>
                <select className="input" value={vehicle.toolType}
                  onChange={e => setVehicle(prev => ({ ...prev, toolType: e.target.value }))}>
                  <option value="">Select Type</option>
                  {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Performance Estimate */}
          {vehicle.powerHp && parseInt(vehicle.powerHp) > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-blue-500" />
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">Estimated Performance Gains</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Stage 1', hpRange: [20, 30], tqRange: [25, 35] },
                  { label: 'Stage 2', hpRange: [30, 50], tqRange: [35, 55] },
                  { label: 'Stage 3', hpRange: [50, 80], tqRange: [55, 85] },
                ].map(stage => {
                  const hp = parseInt(vehicle.powerHp);
                  const hpLow = Math.round(hp * stage.hpRange[0] / 100);
                  const hpHigh = Math.round(hp * stage.hpRange[1] / 100);
                  return (
                    <div key={stage.label} className="bg-white dark:bg-neutral-900 rounded-lg p-3 text-center">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">{stage.label}</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">+{hpLow}-{hpHigh}</p>
                      <p className="text-[10px] text-neutral-500">HP gain</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 text-center">* Estimates only. Actual results may vary.</p>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setCurrentStep(1)} className="btn-secondary flex items-center gap-1">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={() => setCurrentStep(3)} disabled={!canNext()} className="btn-primary flex items-center gap-1">
              Next Step <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Services */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center">
                <Wrench size={18} className="text-neutral-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Select Services</h2>
                {vehicleSummary && <p className="text-xs text-neutral-500">{vehicleSummary}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold">{jobType} File</span>
              {vehicle.toolType && <span className="px-3 py-1 rounded bg-neutral-800 text-neutral-400 text-xs font-bold">{vehicle.toolType} Tool</span>}
            </div>
          </div>

          {loadingServices ? <Spinner /> : filteredCategories.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No services available for {jobType}.</p>
          ) : (
            filteredCategories.map((cat: ServiceCategory) => {
              const isStage = cat.selectionType === 'SINGLE';
              let cardType: 'ecu' | 'tcu' | 'option' = 'option';
              if (isStage && cat.jobType === 'ECU') cardType = 'ecu';
              else if (isStage && cat.jobType === 'TCU') cardType = 'tcu';

              const baseStyles = {
                ecu: 'relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/10',
                tcu: 'relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center border-purple-200 dark:border-purple-700/50 bg-purple-50 dark:bg-purple-900/10',
                option: 'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-center transition-all hover:border-zinc-300 dark:hover:border-zinc-500',
              };
              const selectedStyles = {
                ecu: 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-500',
                tcu: 'ring-2 ring-purple-500 border-purple-500 dark:border-purple-500',
                option: 'ring-2 ring-green-500 border-green-500 dark:border-green-500',
              };
              const iconColor = {
                ecu: 'text-blue-500 dark:text-blue-400',
                tcu: 'text-purple-500 dark:text-purple-400',
                option: 'text-zinc-400 dark:text-zinc-500',
              };
              const priceColor = {
                ecu: 'text-lg font-bold text-blue-500 dark:text-blue-400',
                tcu: 'text-lg font-bold text-purple-500 dark:text-purple-400',
                option: 'text-sm font-bold text-green-600 dark:text-green-400',
              };

              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">{cat.name}</h3>
                    <span className="text-xs text-neutral-500">({(cat.services || []).length} available)</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    {(cat.services || []).map((svc: Service) => {
                      const isSelected = (selectedServices[cat.id] || []).includes(svc.id);
                      return (
                        <button key={svc.id} onClick={() => handleServiceToggle(cat.id, svc.id, cat.selectionType)}
                          className={cn(baseStyles[cardType], 'cursor-pointer transition-all',
                            isSelected && selectedStyles[cardType])}>
                          <div className={cn('absolute top-2 right-2 w-4 h-4 border flex items-center justify-center',
                            cat.selectionType === 'SINGLE' ? 'rounded-full' : 'rounded-sm',
                            isSelected ? 'bg-red-600 border-red-600' : 'border-neutral-700 dark:border-neutral-600')}>
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                          <ServiceIcon icon={svc.icon} colorClass={iconColor[cardType]} />
                          <h4 className={cardType === 'option'
                            ? 'text-xs font-medium leading-tight text-zinc-700 dark:text-zinc-300'
                            : 'font-semibold text-sm text-zinc-900 dark:text-white'}>
                            {svc.name}
                          </h4>
                          <span className={priceColor[cardType]}>
                            {cardType === 'option' ? '+' : ''}{formatCurrency(svc.basePrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-neutral-500" />
              <span className="text-sm text-neutral-400">Comments (optional)</span>
            </div>
            <textarea className="input" rows={3} placeholder="Add any notes or special requests for this job..."
              value={vehicle.clientNotes} onChange={e => setVehicle(prev => ({ ...prev, clientNotes: e.target.value }))} />
          </div>

          <div className="card p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreedDisclaimer} onChange={e => setAgreedDisclaimer(e.target.checked)}
                className="mt-1 rounded border-neutral-700 bg-transparent" />
              <span className="text-xs text-neutral-500 leading-relaxed">
                <strong className="text-neutral-400">I hereby declare that I'm a professional.</strong> I confirm that I have the necessary expertise and qualifications to request this service, and I take full responsibility for the use of the modified files.
              </span>
            </label>
          </div>

          <div className="card p-4 flex items-center justify-between">
            <span className="text-sm text-neutral-500">Selected services</span>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">{allSelectedServiceIds.length}</span>
          </div>

          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-500">Total Price:</span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Your Balance:</span>
              <span className={cn('font-semibold', Number(user?.creditBalance || 0) >= totalPrice ? 'text-neutral-700 dark:text-neutral-300' : 'text-red-400')}>
                {formatCurrency(user?.creditBalance || 0)}
              </span>
            </div>
            {totalPrice > (user?.creditBalance || 0) && (
              <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>Insufficient credits. Please top up first.</span>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setCurrentStep(2)} className="btn-secondary flex items-center gap-1">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={handleSubmit} disabled={submitting || !canNext() || totalPrice > Number(user?.creditBalance || 0)}
              className="btn-primary flex items-center gap-1">
              {submitting ? <Spinner size="sm" /> : null}
              {submitting ? 'Creating...' : 'Submit Job'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
