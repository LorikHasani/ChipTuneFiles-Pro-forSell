import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Car, Wrench, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useServices, createJob, uploadFile } from '../hooks/useApi';
import { formatCurrency, cn } from '../lib/utils';
import FileUpload from '../components/FileUpload';
import Spinner from '../components/Spinner';
import type { ServiceCategory, JobType } from '../types';

const steps = [
  { id: 1, label: 'Upload File', icon: Upload },
  { id: 2, label: 'Vehicle Info', icon: Car },
  { id: 3, label: 'Select Services', icon: Wrench },
];

export default function NewJobPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const { categories, loading: loadingServices } = useServices();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [file, setFile] = useState<File | null>(null);
  const [jobType, setJobType] = useState<JobType>('ECU');

  // Step 2
  const [vehicle, setVehicle] = useState({
    brand: '', model: '', year: '', engineType: '', powerHp: '',
    ecuType: '', gearboxType: '', vin: '', mileage: '', fuelType: '',
    readingTool: '', toolType: '', isOriginal: true, carNotes: '', clientNotes: '',
  });

  // Step 3
  const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});

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
      const job = await createJob({
        jobType,
        brand: vehicle.brand || undefined,
        model: vehicle.model || undefined,
        year: vehicle.year ? parseInt(vehicle.year) : undefined,
        engineType: vehicle.engineType || undefined,
        powerHp: vehicle.powerHp ? parseInt(vehicle.powerHp) : undefined,
        ecuType: vehicle.ecuType || undefined,
        gearboxType: vehicle.gearboxType || undefined,
        vin: vehicle.vin || undefined,
        mileage: vehicle.mileage ? parseInt(vehicle.mileage) : undefined,
        fuelType: vehicle.fuelType || undefined,
        readingTool: vehicle.readingTool || undefined,
        toolType: vehicle.toolType || undefined,
        isOriginal: vehicle.isOriginal,
        carNotes: vehicle.carNotes || undefined,
        clientNotes: vehicle.clientNotes || undefined,
        serviceIds: allSelectedServiceIds,
      });

      await uploadFile(job.id, file);
      await refreshUser();
      toast.success('Job created successfully!');
      navigate(`/jobs/${job.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (currentStep === 1) return !!file;
    if (currentStep === 2) return true;
    if (currentStep === 3) return allSelectedServiceIds.length > 0;
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              currentStep === step.id ? 'bg-primary-600 text-white' :
              currentStep > step.id ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            )}>
              {currentStep > step.id ? <Check size={16} /> : <step.icon size={16} />}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-12 h-0.5 mx-2', currentStep > step.id ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600')} />
            )}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 1: File Upload */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload ECU/TCU File</h2>
            <div className="flex gap-4">
              {(['ECU', 'TCU'] as JobType[]).map(type => (
                <button key={type} onClick={() => setJobType(type)}
                  className={cn('flex-1 py-3 rounded-lg font-medium text-sm border-2 transition-colors',
                    jobType === type ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' :
                    'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300')}>
                  {type} Tuning
                </button>
              ))}
            </div>
            <FileUpload onFileSelected={setFile} label={`Upload your ${jobType} file`} />
            {file && <p className="text-sm text-green-600 dark:text-green-400">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          </div>
        )}

        {/* Step 2: Vehicle Info */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'brand', label: 'Brand', placeholder: 'e.g. BMW' },
                { key: 'model', label: 'Model', placeholder: 'e.g. 320d' },
                { key: 'year', label: 'Year', placeholder: 'e.g. 2020', type: 'number' },
                { key: 'engineType', label: 'Engine Type', placeholder: 'e.g. N47D20' },
                { key: 'powerHp', label: 'Power (HP)', placeholder: 'e.g. 190', type: 'number' },
                { key: 'ecuType', label: 'ECU Type', placeholder: 'e.g. Bosch EDC17' },
                { key: 'gearboxType', label: 'Gearbox Type', placeholder: 'e.g. ZF 8HP' },
                { key: 'fuelType', label: 'Fuel Type', placeholder: 'e.g. Diesel' },
                { key: 'vin', label: 'VIN', placeholder: 'Vehicle identification number' },
                { key: 'mileage', label: 'Mileage (km)', placeholder: 'e.g. 85000', type: 'number' },
                { key: 'readingTool', label: 'Reading Tool', placeholder: 'e.g. KESS V2' },
                { key: 'toolType', label: 'Tool Type', placeholder: 'e.g. OBD / Bench' },
              ].map(field => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  <input className="input" type={field.type || 'text'} placeholder={field.placeholder}
                    value={(vehicle as any)[field.key]}
                    onChange={e => setVehicle(prev => ({ ...prev, [field.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isOriginal" checked={vehicle.isOriginal}
                onChange={e => setVehicle(prev => ({ ...prev, isOriginal: e.target.checked }))}
                className="rounded border-gray-300" />
              <label htmlFor="isOriginal" className="text-sm text-gray-700 dark:text-gray-300">Original (unmodified) file</label>
            </div>
            <div>
              <label className="label">Car Notes</label>
              <textarea className="input" rows={2} placeholder="Any additional notes about the vehicle..."
                value={vehicle.carNotes} onChange={e => setVehicle(prev => ({ ...prev, carNotes: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes for Tuner</label>
              <textarea className="input" rows={2} placeholder="Special requests or instructions..."
                value={vehicle.clientNotes} onChange={e => setVehicle(prev => ({ ...prev, clientNotes: e.target.value }))} />
            </div>
          </div>
        )}

        {/* Step 3: Select Services */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Services</h2>
            {loadingServices ? <Spinner /> : filteredCategories.length === 0 ? (
              <p className="text-gray-500">No services available for {jobType}.</p>
            ) : (
              filteredCategories.map((cat: ServiceCategory) => (
                <div key={cat.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-gray-500 mb-3">{cat.description}</p>}
                  <p className="text-xs text-gray-400 mb-3">
                    {cat.selectionType === 'SINGLE' ? 'Select one option' : 'Select multiple options'}
                  </p>
                  <div className="space-y-2">
                    {(cat.services || []).map(svc => {
                      const isSelected = (selectedServices[cat.id] || []).includes(svc.id);
                      return (
                        <button key={svc.id} onClick={() => handleServiceToggle(cat.id, svc.id, cat.selectionType)}
                          className={cn('w-full flex items-center justify-between p-3 rounded-lg border-2 text-left transition-colors',
                            isSelected ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' :
                            'border-gray-200 dark:border-gray-600 hover:border-gray-300')}>
                          <div>
                            <p className={cn('font-medium text-sm', isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white')}>
                              {svc.name}
                            </p>
                            {svc.description && <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>}
                          </div>
                          <span className={cn('font-bold text-sm whitespace-nowrap ml-4',
                            isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white')}>
                            {formatCurrency(svc.basePrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Price summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Total Price:</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Your Balance:</span>
                <span className={cn('font-semibold', Number(user?.creditBalance || 0) >= totalPrice ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(user?.creditBalance || 0)}
                </span>
              </div>
              {totalPrice > (user?.creditBalance || 0) && (
                <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>Insufficient credits. Please top up first.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 1}
            className="btn-secondary">
            <ChevronLeft size={16} /> Back
          </button>
          {currentStep < 3 ? (
            <button onClick={() => setCurrentStep(s => s + 1)} disabled={!canNext()}
              className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !canNext() || totalPrice > Number(user?.creditBalance || 0)}
              className="btn-primary">
              {submitting ? <Spinner size="sm" /> : null}
              {submitting ? 'Creating...' : 'Submit Job'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
