import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBrandingStore } from '../stores/brandingStore';

export default function PrivacyPage() {
  const brand = useBrandingStore((s) => s.branding.brand_name);
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/" className="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none space-y-4 text-neutral-600 dark:text-neutral-300">
        <p>{brand} is committed to protecting your privacy. This policy describes how we collect, use, and safeguard your information.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">Information We Collect</h2>
        <p>We collect account information (email, name, company), vehicle data you submit with jobs, and payment information processed securely through Stripe.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">How We Use Your Information</h2>
        <p>Your data is used to provide tuning services, process payments, communicate about jobs, and improve our platform.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">Data Security</h2>
        <p>We use industry-standard encryption and security measures to protect your data. ECU files are stored in secure, encrypted storage.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">Data Retention</h2>
        <p>Account data is retained as long as your account is active. Job files are retained for 90 days after completion unless otherwise requested.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">Contact</h2>
        <p>For privacy-related inquiries, contact us through the support ticket system.</p>
      </div>
    </div>
  );
}
