import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBrandingStore } from '../stores/brandingStore';

export default function RefundPolicyPage() {
  const brand = useBrandingStore((s) => s.branding.brand_name);
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/" className="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">Refund Policy</h1>
      <div className="prose dark:prose-invert max-w-none space-y-4 text-neutral-600 dark:text-neutral-300">
        <p>At {brand}, we strive to provide high-quality tuning services. Please review our refund policy below.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">Credit Purchases</h2>
        <p>Credit purchases are generally non-refundable once credits have been added to your account. If you experience a payment issue, contact support within 24 hours.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">Job Refunds</h2>
        <p>If we are unable to complete a job (e.g., unsupported ECU), credits will be refunded to your account balance. Refunds for completed jobs are handled on a case-by-case basis.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">Revision Policy</h2>
        <p>We offer free revisions for tuning adjustments. If the final result does not meet agreed specifications, additional credits may be refunded at our discretion.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">How to Request a Refund</h2>
        <p>Open a support ticket with your job reference number and reason for the refund request. Our team will respond within 24 hours.</p>
      </div>
    </div>
  );
}
