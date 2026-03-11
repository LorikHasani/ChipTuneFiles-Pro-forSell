import { useState } from 'react';
import { User, Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import api, { getErrorMessage } from '../lib/api';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [form, setForm] = useState({
    contactName: user?.contactName || '',
    companyName: user?.companyName || '',
    phone: user?.phone || '',
    country: user?.country || '',
    emailNotifications: user?.emailNotifications ?? true,
  });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/me', form);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/auth/me', { password: pwForm.newPassword });
      toast.success('Password updated');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account settings" />

      {/* Profile info */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <User size={24} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Name</label>
            <input className="input" value={form.contactName}
              onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Company Name</label>
            <input className="input" value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="emailNotif" checked={form.emailNotifications}
            onChange={e => setForm(f => ({ ...f, emailNotifications: e.target.checked }))}
            className="rounded border-gray-300" />
          <label htmlFor="emailNotif" className="text-sm text-gray-700 dark:text-gray-300">Receive email notifications</label>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : <Save size={16} />} Save Changes
        </button>
      </div>

      {/* Change Password */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Lock size={20} /> Change Password
        </h3>
        <div>
          <label className="label">New Password</label>
          <input className="input" type="password" placeholder="Min 8 characters" value={pwForm.newPassword}
            onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input className="input" type="password" placeholder="Confirm password" value={pwForm.confirmPassword}
            onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
        </div>
        <button onClick={handleChangePassword} disabled={savingPw} className="btn-primary">
          {savingPw ? <Spinner size="sm" /> : null} Update Password
        </button>
      </div>
    </div>
  );
}
