import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBrandingStore } from '../stores/brandingStore';

export default function TermsPage() {
  const brand = useBrandingStore((s) => s.branding.brand_name);
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/" className="inline-flex items-center gap-1 text-red-600 dark:text-red-500 hover:underline mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">Terms of Service</h1>
      <div className="prose dark:prose-invert max-w-none space-y-4 text-neutral-600 dark:text-neutral-300">
        <p>Welcome to {brand}. By using our platform, you agree to the following terms.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">1. Service Description</h2>
        <p>{brand} provides ECU and TCU tuning file services. We process your vehicle's control unit files according to your selected services and specifications.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">2. Credits System</h2>
        <p>Services are purchased using credits. Credits are non-transferable and are deducted at the time of job submission. Unused credits remain in your account indefinitely.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">3. User Responsibilities</h2>
        <p>You are responsible for ensuring that ECU/TCU modifications comply with local laws and regulations in your jurisdiction. {brand} is not liable for misuse of tuned files.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">4. File Handling</h2>
        <p>Uploaded files are stored securely and processed by our team. We do not share your files with third parties.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">5. Revisions</h2>
        <p>You may request revisions for completed jobs. Excessive revision requests may be subject to additional charges at our discretion.</p>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6">6. Limitation of Liability</h2>
        <p>{brand} provides tuning files on an "as is" basis. We are not responsible for any damages resulting from the use of modified files.</p>
      </div>
    </div>
  );
}
