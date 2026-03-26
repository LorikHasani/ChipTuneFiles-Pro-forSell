import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../lib/api';
import type {
  User,
  Job,
  JobType,
  JobStatus,
  Service,
  ServiceCategory,
  FileItem,
  JobMessage,
  TicketMessage,
  Transaction,
  CreditPackage,
  Notification,
  Ticket,
  Announcement,
  AllSettings,
  DashboardStats,
} from '../types/index';

// ============================================
// Shared Types
// ============================================

export interface CreateJobData {
  jobType: JobType;
  brand?: string;
  model?: string;
  year?: number;
  engineType?: string;
  powerHp?: number;
  ecuType?: string;
  gearboxType?: string;
  vin?: string;
  mileage?: number;
  fuelType?: string;
  clientNotes?: string;
  readingTool?: string;
  toolType?: string;
  isOriginal?: boolean;
  carNotes?: string;
  serviceIds: string[];
}

// ============================================
// Generic Fetch Hook
// ============================================

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, ...deps]);

  return { data, loading, error, refetch };
}

/**
 * Helper: unwrap API response.
 * Backend returns { data: ... } or paginated { data: ..., meta: ... }.
 * Axios wraps the whole body in response.data.
 * So response.data = { data: actualPayload } → we want actualPayload.
 */
function unwrap(responseData: any): any {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return responseData.data;
  }
  return responseData;
}

// ============================================
// Jobs Hooks
// ============================================

export function useJobs(status?: JobStatus) {
  const result = useFetch<Job[]>(async () => {
    const params: Record<string, string | number> = { page: 1, limit: 50 };
    if (status) params.status = status;
    const response = await api.get('/jobs', { params });
    return unwrap(response.data);
  }, [status]);

  return {
    jobs: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useJob(jobId: string) {
  const result = useFetch<Job>(async () => {
    const response = await api.get(`/jobs/${jobId}`);
    // Jobs endpoint returns { job: {...} }
    return response.data.job ?? unwrap(response.data);
  }, [jobId]);

  return {
    job: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Services Hooks
// ============================================

export function useServices() {
  const result = useFetch<ServiceCategory[]>(async () => {
    const response = await api.get('/services');
    return unwrap(response.data);
  }, []);

  return {
    categories: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAllServices() {
  const result = useFetch<ServiceCategory[]>(async () => {
    const response = await api.get('/services/all');
    return unwrap(response.data);
  }, []);

  return {
    categories: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Credits Hooks
// ============================================

export function useCreditPackages() {
  const result = useFetch<CreditPackage[]>(async () => {
    const response = await api.get('/credits/packages');
    return unwrap(response.data);
  }, []);

  return {
    packages: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAdminCreditPackages() {
  const result = useFetch<CreditPackage[]>(async () => {
    const response = await api.get('/admin/packages');
    return unwrap(response.data);
  }, []);

  return {
    packages: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useTransactions(userId?: string) {
  const result = useFetch<Transaction[]>(async () => {
    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    const response = await api.get('/credits/transactions', { params });
    return unwrap(response.data);
  }, [userId]);

  return {
    transactions: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Tickets Hooks
// ============================================

export function useTickets(status?: string) {
  const result = useFetch<Ticket[]>(async () => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await api.get('/tickets', { params });
    return unwrap(response.data);
  }, [status]);

  return {
    tickets: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useTicket(ticketId: string) {
  const result = useFetch<Ticket>(async () => {
    const response = await api.get(`/tickets/${ticketId}`);
    return unwrap(response.data);
  }, [ticketId]);

  return {
    ticket: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Notifications Hook
// ============================================

export function useNotifications() {
  const result = useFetch<Notification[]>(async () => {
    const response = await api.get('/notifications');
    return unwrap(response.data);
  }, []);

  const unreadCount = result.data
    ? result.data.filter((n) => !n.isRead).length
    : 0;

  return {
    notifications: result.data,
    unreadCount,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Admin Hooks
// ============================================

export function useDashboardStats() {
  const result = useFetch<DashboardStats>(async () => {
    const response = await api.get('/admin/dashboard');
    return unwrap(response.data);
  }, []);

  return {
    stats: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAdminUsers(search?: string, role?: string) {
  const result = useFetch<User[]>(async () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (role) params.role = role;
    const response = await api.get('/admin/users', { params });
    return unwrap(response.data);
  }, [search, role]);

  return {
    users: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAdminUser(userId: string) {
  const result = useFetch<User>(async () => {
    const response = await api.get(`/admin/users/${userId}`);
    return unwrap(response.data);
  }, [userId]);

  return {
    user: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAnnouncements() {
  const result = useFetch<Announcement[]>(async () => {
    const response = await api.get('/admin/announcements');
    return unwrap(response.data);
  }, []);

  return {
    announcements: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useActiveAnnouncements() {
  const result = useFetch<Announcement[]>(async () => {
    const response = await api.get('/admin/announcements/active');
    return unwrap(response.data);
  }, []);

  return {
    announcements: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useSettings() {
  const result = useFetch<AllSettings>(async () => {
    const response = await api.get('/settings');
    return unwrap(response.data);
  }, []);

  return {
    settings: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Messages Hooks
// ============================================

export function useJobMessages(jobId: string) {
  const result = useFetch<JobMessage[]>(async () => {
    const response = await api.get(`/messages/job/${jobId}`);
    return unwrap(response.data);
  }, [jobId]);

  return {
    messages: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useTicketMessages(ticketId: string) {
  const result = useFetch<TicketMessage[]>(async () => {
    const response = await api.get(`/messages/ticket/${ticketId}`);
    return unwrap(response.data);
  }, [ticketId]);

  return {
    messages: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Job Mutation Functions
// ============================================

export async function createJob(data: CreateJobData): Promise<Job> {
  const response = await api.post('/jobs', data);
  return response.data.job ?? unwrap(response.data);
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  adminNotes?: string
): Promise<Job> {
  const response = await api.put(`/jobs/${jobId}/status`, { status, adminNotes });
  return response.data.job ?? unwrap(response.data);
}

export async function assignJob(jobId: string, adminId: string): Promise<Job> {
  const response = await api.put(`/jobs/${jobId}/assign`, { adminId });
  return response.data.job ?? unwrap(response.data);
}

export async function requestRevision(jobId: string, reason: string): Promise<Job> {
  const response = await api.post(`/jobs/${jobId}/revision`, { reason });
  return response.data.job ?? unwrap(response.data);
}

// ============================================
// File Mutation Functions
// ============================================

export async function uploadFile(jobId: string, file: File, fileType: string = 'ORIGINAL'): Promise<FileItem> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  const response = await api.post(`/files/upload/${jobId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function downloadFile(fileId: string, fileName: string): Promise<void> {
  const response = await api.get(`/files/download/${fileId}`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}`);
}

// ============================================
// Service Mutation Functions (Admin)
// ============================================

export async function createCategory(
  data: Partial<ServiceCategory>
): Promise<ServiceCategory> {
  const response = await api.post('/services/categories', data);
  return unwrap(response.data) ?? response.data;
}

export async function updateCategory(
  id: string,
  data: Partial<ServiceCategory>
): Promise<ServiceCategory> {
  const response = await api.put(`/services/categories/${id}`, data);
  return unwrap(response.data) ?? response.data;
}

export async function createService(data: Partial<Service>): Promise<Service> {
  const response = await api.post('/services', data);
  return unwrap(response.data) ?? response.data;
}

export async function updateService(
  id: string,
  data: Partial<Service>
): Promise<Service> {
  const response = await api.put(`/services/${id}`, data);
  return unwrap(response.data) ?? response.data;
}

// ============================================
// Credits Mutation Functions
// ============================================

export async function createCheckout(
  packageId?: string,
  customAmount?: number
): Promise<string> {
  const response = await api.post('/credits/checkout', { packageId, customCredits: customAmount });
  return response.data.url;
}

export async function verifyPayment(sessionId: string): Promise<any> {
  const response = await api.get(`/credits/verify/${sessionId}`);
  return response.data;
}

// ============================================
// Message Mutation Functions
// ============================================

export async function sendJobMessage(
  jobId: string,
  message: string,
  isInternal?: boolean
): Promise<JobMessage> {
  const response = await api.post(`/messages/job/${jobId}`, { message, isInternal });
  return unwrap(response.data);
}

export async function markJobMessagesRead(jobId: string): Promise<void> {
  await api.put(`/messages/job/${jobId}/read`);
}

export async function sendTicketMessage(
  ticketId: string,
  message: string
): Promise<TicketMessage> {
  const response = await api.post(`/messages/ticket/${ticketId}`, { message });
  return unwrap(response.data);
}

export async function markTicketMessagesRead(ticketId: string): Promise<void> {
  await api.put(`/messages/ticket/${ticketId}/read`);
}

// ============================================
// Ticket Mutation Functions
// ============================================

export async function createTicket(
  subject: string,
  message: string
): Promise<Ticket> {
  const response = await api.post('/tickets', { subject, message });
  return unwrap(response.data);
}

export async function updateTicketStatus(
  ticketId: string,
  status: string
): Promise<Ticket> {
  const response = await api.put(`/tickets/${ticketId}/status`, { status });
  return unwrap(response.data);
}

// ============================================
// Notification Mutation Functions
// ============================================

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  linkType?: string,
  linkId?: string
): Promise<Notification> {
  const response = await api.post('/notifications', {
    userId,
    title,
    message,
    linkType,
    linkId,
  });
  return unwrap(response.data);
}

// ============================================
// Admin User Mutation Functions
// ============================================

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const response = await api.put(`/admin/users/${id}`, data);
  return unwrap(response.data);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}

export async function adjustCredits(
  userId: string,
  amount: number,
  description: string
): Promise<User> {
  const response = await api.post(`/admin/users/${userId}/credits`, {
    amount,
    description,
  });
  return unwrap(response.data);
}

// ============================================
// Announcement Mutation Functions
// ============================================

export async function createAnnouncement(
  data: Partial<Announcement>
): Promise<Announcement> {
  const response = await api.post('/admin/announcements', data);
  return unwrap(response.data);
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Announcement>
): Promise<Announcement> {
  const response = await api.put(`/admin/announcements/${id}`, data);
  return unwrap(response.data);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/admin/announcements/${id}`);
}

export async function uploadAnnouncementImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/files/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.imageUrl;
}

// ============================================
// Settings Mutation Functions (Admin)
// ============================================

export async function updateSettings(
  settings: Record<string, string>
): Promise<void> {
  await api.put('/settings', settings);
}

// ============================================
// Credit Package Mutation Functions (Admin)
// ============================================

export async function createCreditPackage(
  data: Partial<CreditPackage>
): Promise<CreditPackage> {
  const response = await api.post('/admin/packages', data);
  return unwrap(response.data);
}

export async function updateCreditPackage(
  id: string,
  data: Partial<CreditPackage>
): Promise<CreditPackage> {
  const response = await api.put(`/admin/packages/${id}`, data);
  return unwrap(response.data);
}

export async function deleteCreditPackage(id: string): Promise<void> {
  await api.delete(`/admin/packages/${id}`);
}

// ============================================
// Email Mutation Functions (Admin)
// ============================================

export async function sendBulkEmail(data: {
  recipientIds: string[];
  subject: string;
  message: string;
  colorTheme: 'blue' | 'red';
}): Promise<{ total: number; success: number; failed: number }> {
  const response = await api.post('/admin/emails/send', data);
  return unwrap(response.data);
}
