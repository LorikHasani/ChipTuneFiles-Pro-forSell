import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useBrandingStore } from './stores/brandingStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const NewJobPage = lazy(() => import('./pages/NewJobPage'));
const CreditsPage = lazy(() => import('./pages/CreditsPage'));
const PricesPage = lazy(() => import('./pages/PricesPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminJobsPage = lazy(() => import('./pages/admin/AdminJobsPage'));
const AdminJobDetailPage = lazy(() => import('./pages/admin/AdminJobDetailPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/admin/AdminUserDetailPage'));
const AdminServicesPage = lazy(() => import('./pages/admin/AdminServicesPage'));
const AdminPackagesPage = lazy(() => import('./pages/admin/AdminPackagesPage'));
const AdminTicketsPage = lazy(() => import('./pages/admin/AdminTicketsPage'));
const AdminTicketDetailPage = lazy(() => import('./pages/admin/AdminTicketDetailPage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/admin/AdminAnnouncementsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminStatsPage = lazy(() => import('./pages/admin/AdminStatsPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadBranding = useBrandingStore((s) => s.loadBranding);

  useEffect(() => {
    loadBranding();
    initialize();
  }, []);

  // Init dark mode from localStorage
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' ||
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/new" element={<NewJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="credits" element={<CreditsPage />} />
          <Route path="prices" element={<PricesPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="calculator" element={<CalculatorPage />} />

          {/* Admin routes */}
          <Route path="admin" element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="admin/jobs" element={<ProtectedRoute requireAdmin><AdminJobsPage /></ProtectedRoute>} />
          <Route path="admin/jobs/:id" element={<ProtectedRoute requireAdmin><AdminJobDetailPage /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute requireAdmin><AdminUsersPage /></ProtectedRoute>} />
          <Route path="admin/users/:id" element={<ProtectedRoute requireAdmin><AdminUserDetailPage /></ProtectedRoute>} />
          <Route path="admin/services" element={<ProtectedRoute requireAdmin><AdminServicesPage /></ProtectedRoute>} />
          <Route path="admin/packages" element={<ProtectedRoute requireAdmin><AdminPackagesPage /></ProtectedRoute>} />
          <Route path="admin/tickets" element={<ProtectedRoute requireAdmin><AdminTicketsPage /></ProtectedRoute>} />
          <Route path="admin/tickets/:id" element={<ProtectedRoute requireAdmin><AdminTicketDetailPage /></ProtectedRoute>} />
          <Route path="admin/announcements" element={<ProtectedRoute requireAdmin><AdminAnnouncementsPage /></ProtectedRoute>} />
          <Route path="admin/settings" element={<ProtectedRoute requireAdmin><AdminSettingsPage /></ProtectedRoute>} />
          <Route path="admin/stats" element={<ProtectedRoute requireAdmin><AdminStatsPage /></ProtectedRoute>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
