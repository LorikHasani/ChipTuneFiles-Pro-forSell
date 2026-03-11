// ============================================
// User Types
// ============================================

export type UserRole = 'CLIENT' | 'ADMIN' | 'SUPERADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  contactName: string | null;
  companyName: string | null;
  phone: string | null;
  country: string | null;
  creditBalance: number;
  stripeCustomerId: string | null;
  emailNotifications: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Job Types
// ============================================

export type JobType = 'ECU' | 'TCU';

export type JobStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_INFO'
  | 'COMPLETED'
  | 'REVISION_REQUESTED'
  | 'REJECTED';

export interface Job {
  id: string;
  referenceNumber: string;
  clientId: string;
  assignedAdminId: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  engineType: string | null;
  powerHp: number | null;
  ecuType: string | null;
  gearboxType: string | null;
  vin: string | null;
  mileage: number | null;
  fuelType: string | null;
  jobType: JobType;
  status: JobStatus;
  totalPrice: number;
  creditsUsed: number;
  clientNotes: string | null;
  adminNotes: string | null;
  priority: number;
  revisionCount: number;
  readingTool: string | null;
  toolType: string | null;
  isOriginal: boolean;
  carNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  client?: User;
  assignedAdmin?: User | null;
  services?: JobServiceItem[];
  files?: FileItem[];
  messages?: JobMessage[];
}

export interface JobServiceItem {
  id: string;
  jobId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  service?: Service;
}

// ============================================
// Service Types
// ============================================

export type SelectionType = 'SINGLE' | 'MULTIPLE';

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  selectionType: SelectionType;
  jobType: JobType;
  services?: Service[];
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  description: string | null;
  basePrice: number;
  estimatedHours: number | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  category?: ServiceCategory;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// File Types
// ============================================

export type FileType = 'ORIGINAL' | 'MODIFIED';

export interface FileItem {
  id: string;
  jobId: string;
  fileType: FileType;
  originalName: string;
  storagePath: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
  uploader?: User;
}

// ============================================
// Message Types
// ============================================

export interface JobMessage {
  id: string;
  jobId: string;
  senderId: string;
  message: string;
  isInternal: boolean;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

// ============================================
// Transaction Types
// ============================================

export type TransactionType = 'CREDIT_PURCHASE' | 'JOB_PAYMENT' | 'REFUND' | 'ADMIN_ADJUSTMENT';

export interface Transaction {
  id: string;
  userId: string;
  jobId: string | null;
  processedBy: string | null;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  stripeSessionId: string | null;
  createdAt: string;
  job?: Job;
  processor?: User;
}

// ============================================
// Credit Package Types
// ============================================

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonusCredits: number;
  isActive: boolean;
  sortOrder: number;
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  linkType: string | null;
  linkId: string | null;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// Ticket Types
// ============================================

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface Ticket {
  id: string;
  clientId: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  client?: User;
  messages?: TicketMessage[];
  _count?: { messages: number };
}

// ============================================
// Announcement Types
// ============================================

export type AnnouncementType = 'INFO' | 'WARNING' | 'SUCCESS';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  imageUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

// ============================================
// Settings / Branding Types
// ============================================

export interface BrandingSettings {
  brand_name: string;
  logo_url: string;
  primary_color: string;
  accent_color: string;
  contact_email: string;
  currency_symbol: string;
  support_url: string;
  [key: string]: string;
}

export interface AllSettings {
  [key: string]: string;
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  completedToday: number;
  totalUsers: number;
  totalRevenue: number;
  totalCreditsIssued: number;
  recentJobs: Job[];
}
