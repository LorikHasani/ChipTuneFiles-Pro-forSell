import { useState, useEffect } from 'react';
import { Save, Palette, Mail, Globe, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings, updateSettings } from '../../hooks/useApi';
import { useBrandingStore } from '../../stores/brandingStore';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';

export default function AdminSettingsPage() {
  const { settings, loading, refetch } = useSettings();
  const loadBranding = useBrandingStore((s) => s.loadBranding);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Settings saved');
      refetch();
      loadBranding(); // reload branding
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const updateField = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Platform Settings" subtitle="Configure your white-label platform">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : <Save size={16} />} Save All
        </button>
      </PageHeader>

      {/* Branding */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><Palette size={18} /> Branding</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Brand Name</label>
            <input className="input" value={form.brand_name || ''} onChange={e => updateField('brand_name', e.target.value)}
              placeholder="Your company name" />
          </div>
          <div>
            <label className="label">Logo URL</label>
            <input className="input" value={form.logo_url || ''} onChange={e => updateField('logo_url', e.target.value)}
              placeholder="https://your-logo-url.com/logo.png" />
          </div>
          {/* Preview */}
          <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              {form.logo_url ? <img src={form.logo_url} alt="Logo" className="h-8 w-8 object-contain" /> :
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-neutral-900 dark:bg-white dark:text-black">
                  {(form.brand_name || 'C')[0]}
                </div>}
              <span className="text-lg font-bold">{form.brand_name || 'ChipTuneFiles'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><Globe size={18} /> Contact & General</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Contact Email</label>
            <input className="input" value={form.contact_email || ''} onChange={e => updateField('contact_email', e.target.value)} />
          </div>
          <div>
            <label className="label">Support URL</label>
            <input className="input" value={form.support_url || ''} onChange={e => updateField('support_url', e.target.value)} />
          </div>
          <div>
            <label className="label">Currency Symbol</label>
            <input className="input max-w-xs" value={form.currency_symbol || '€'} onChange={e => updateField('currency_symbol', e.target.value)} />
          </div>
        </div>
      </div>

      {/* SMTP */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><Mail size={18} /> Email (SMTP)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SMTP Host</label>
              <input className="input" value={form.smtp_host || ''} onChange={e => updateField('smtp_host', e.target.value)}
                placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="label">SMTP Port</label>
              <input className="input" value={form.smtp_port || ''} onChange={e => updateField('smtp_port', e.target.value)}
                placeholder="587" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SMTP User</label>
              <input className="input" value={form.smtp_user || ''} onChange={e => updateField('smtp_user', e.target.value)} />
            </div>
            <div>
              <label className="label">SMTP Password</label>
              <input className="input" type="password" value={form.smtp_pass || ''} onChange={e => updateField('smtp_pass', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Email From</label>
            <input className="input" value={form.email_from || ''} onChange={e => updateField('email_from', e.target.value)}
              placeholder="noreply@yourdomain.com" />
          </div>
        </div>
      </div>

      {/* Save button bottom */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : <Save size={16} />} Save All Settings
        </button>
      </div>
    </div>
  );
}
