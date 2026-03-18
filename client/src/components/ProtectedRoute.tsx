import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Spinner from './Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, isInitialized } = useAuthStore();

  // Still initializing -- show loading spinner
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-black">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated -- redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Requires admin but user is not admin -- redirect to home
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
