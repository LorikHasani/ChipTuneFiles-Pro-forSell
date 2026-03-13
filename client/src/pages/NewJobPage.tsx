import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Car, Wrench, ChevronRight, ChevronLeft, Check, AlertCircle, FileText, Info, MessageSquare } from 'lucide-react';
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
  { id: 1, label: 'Upload File', icon: Upload },
  { id: 2, label: 'Vehicle Info', icon: Car },
  { id: 3, label: 'Select Services', icon: Wrench },
];

const READING_TOOLS = [
  'Autotuner', 'KESS V2', 'KESS V3', 'K-TAG', 'CMD Flash', 'BDM Pro',
  'Magic Motorsport', 'PCMFlash', 'BitBox', 'MMCFlash', 'NCS Expert', 'Other',
];
const TOOL_TYPES = ['Master', 'Slave'];
const GEARBOX_TYPES = ['Manual', 'Automatic', 'DSG/DCT', 'CVT', 'AMT', 'Other'];

function ServiceIcon({ icon }: { icon: string | null | undefined }) {
  if (!icon) return <Wrench size={20} className="text-gray-600" />;
  const LucideComp = getLucideIcon(icon);
  if (LucideComp) return <LucideComp size={20} className="text-gray-600" />;
  return <span className="text-lg">{icon}</span>;
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
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              currentStep === step.id ? 'bg-red-600 text-white' :
              currentStep > step.id ? 'bg-red-900/40 text-red-400' :
              'bg-gray-800/60 text-gray-500'
            )}>
              {currentStep > step.id ? <Check size={16} /> : <step.icon size={16} />}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-12 h-0.5 mx-2', currentStep > step.id ? 'bg-red-600' : 'bg-gray-800')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <div className="card p-6 space-y-6">
          <h2 className="text-xl font-bold text-white">Upload ECU/TCU File</h2>
          <div className="flex gap-4">
            {(['ECU', 'TCU'] as JobType[]).map(type => (
              <button key={type} onClick={() => setJobType(type)}
                className={cn('flex-1 py-3 rounded-lg font-medium text-sm border transition-colors',
                  jobType === type ? 'border-red-600 bg-red-900/20 text-red-400' :
                  'border-gray-800 text-gray-500 hover:border-gray-700')}>
                {type} Tuning
              </button>
            ))}
          </div>
          <FileUpload onFileSelected={setFile} label={`Upload your ${jobType} file`} />
          {file && <p className="text-sm text-red-400">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          <div className="flex justify-end pt-6 border-t border-gray-800">
            <button onClick={() => setCurrentStep(2)} disabled={!canNext()} className="btn-primary">
              Next Step <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Vehicle Info */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {file && (
            <div className="card px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-500" />
                <span className="text-sm text-gray-400">File: {file.name}</span>
              </div>
              <span className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold">{jobType}</span>
            </div>
          )}

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-gray-500" />
              <span className="text-sm text-gray-400">Is this an original file?</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setVehicle(prev => ({ ...prev, isOriginal: true }))}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  vehicle.isOriginal ? 'border-red-600 bg-red-900/20 text-red-400' : 'border-gray-800 text-gray-500 hover:border-gray-700')}>
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', vehicle.isOriginal ? 'bg-red-500' : 'bg-gray-700')} />
                  Yes, Original
                </span>
              </button>
              <button onClick={() => setVehicle(prev => ({ ...prev, isOriginal: false }))}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  !vehicle.isOriginal ? 'border-red-600 bg-red-900/20 text-red-400' : 'border-gray-800 text-gray-500 hover:border-gray-700')}>
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', !vehicle.isOriginal ? 'bg-red-500' : 'bg-gray-700')} />
                  No, Modified
                </span>
              </button>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-gray-500" />
              <h3 className="text-base font-semibold text-white">Vehicle Details</h3>
            </div>
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

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-gray-500" />
              <h3 className="text-base font-semibold text-white">Reading Tool</h3>
            </div>
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

          <div className="flex justify-between">
            <button onClick={() => setCurrentStep(1)} className="btn-secondary">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={() => setCurrentStep(3)} disabled={!canNext()} className="btn-primary">
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
              <div className="w-9 h-9 rounded-full bg-red-900/30 flex items-center justify-center">
                <Wrench size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Select Services</h2>
                {vehicleSummary && <p className="text-xs text-gray-500">{vehicleSummary}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold">{jobType} File</span>
              {vehicle.toolType && <span className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-xs font-bold">{vehicle.toolType} Tool</span>}
            </div>
          </div>

          {loadingServices ? <Spinner /> : filteredCategories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No services available for {jobType}.</p>
          ) : (
            filteredCategories.map((cat: ServiceCategory) => (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">{cat.name}</h3>
                  <span className="text-xs text-gray-600">({(cat.services || []).length} available)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {(cat.services || []).map((svc: Service) => {
                    const isSelected = (selectedServices[cat.id] || []).includes(svc.id);
                    return (
                      <button key={svc.id} onClick={() => handleServiceToggle(cat.id, svc.id, cat.selectionType)}
                        className={cn('relative card p-4 flex flex-col items-center text-center transition-all',
                          isSelected ? 'ring-1 ring-red-500 border-red-500/50' : 'hover:border-gray-700')}>
                        <div className={cn('absolute top-2 right-2 w-4 h-4 border flex items-center justify-center',
                          cat.selectionType === 'SINGLE' ? 'rounded-full' : 'rounded-sm',
                          isSelected ? 'bg-red-600 border-red-600' : 'border-gray-700')}>
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                        <div className="mb-2 mt-1"><ServiceIcon icon={svc.icon} /></div>
                        <h4 className="text-xs font-medium text-gray-300 mb-1 leading-tight">{svc.name}</h4>
                        <span className="text-xs font-bold text-red-400">+{formatCurrency(svc.basePrice)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-gray-500" />
              <span className="text-sm text-gray-400">Comments (optional)</span>
            </div>
            <textarea className="input" rows={3} placeholder="Add any notes or special requests for this job..."
              value={vehicle.clientNotes} onChange={e => setVehicle(prev => ({ ...prev, clientNotes: e.target.value }))} />
          </div>

          <div className="card p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreedDisclaimer} onChange={e => setAgreedDisclaimer(e.target.checked)}
                className="mt-1 rounded border-gray-700 bg-transparent" />
              <span className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-400">I hereby declare that I'm a professional.</strong> I confirm that I have the necessary expertise and qualifications to request this service, and I take full responsibility for the use of the modified files.
              </span>
            </label>
          </div>

          <div className="card p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Selected services</span>
            <span className="text-lg font-bold text-white">{allSelectedServiceIds.length}</span>
          </div>

          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">Total Price:</span>
              <span className="text-2xl font-bold text-white">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Your Balance:</span>
              <span className={cn('font-semibold', Number(user?.creditBalance || 0) >= totalPrice ? 'text-gray-300' : 'text-red-400')}>
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
            <button onClick={() => setCurrentStep(2)} className="btn-secondary">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={handleSubmit} disabled={submitting || !canNext() || totalPrice > Number(user?.creditBalance || 0)}
              className="btn-primary">
              {submitting ? <Spinner size="sm" /> : null}
              {submitting ? 'Creating...' : 'Submit Job'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
