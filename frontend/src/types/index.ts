// Types shared across the frontend application

export type Role = 'GUARD' | 'MEMBER' | 'ADMIN';
export type MemberType = 'STUDENT' | 'FACULTY' | 'EMPLOYEE' | 'MANAGEMENT';
export type VisitType = 'PRE_REGISTERED' | 'WALK_IN' | 'DELIVERY';
export type VisitStatus = 'EXPECTED' | 'PENDING_VERIFICATION' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
export type VehicleType = 'CAR' | 'BIKE' | 'TRUCK' | 'AUTO' | 'OTHER' | 'NONE';

export interface UniversityMember {
  id: string;
  userId: string;
  memberType: MemberType;
  rollNo?: string;
  employeeId?: string;
  department: string;
  publicMeetingPoint?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  createdAt: string;
  member?: UniversityMember | null;
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  defaultType?: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  visitorId: string;
  visitor: Visitor;
  hostMemberId?: string | null;
  hostMember?: User | null;
  visitType: VisitType;
  purpose: string;
  campusLocation: string;
  expectedDate?: string | null;
  expectedTime?: string | null;
  expectedDuration?: string | null;
  actualEntryTime?: string | null;
  actualExitTime?: string | null;
  status: VisitStatus;
  idVerified: boolean;
  notes?: string | null;
  vehicleType: VehicleType;
  vehicleNumber?: string | null;
  deliveryCompany?: string | null;
  receivingPerson?: string | null;
  deliveryDest?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  member?: UniversityMember | null;
}

export interface GuardStats {
  todayTotal: number;
  currentlyInside: number;
  expectedToday: number;
  pendingVerification: number;
  walkInsToday: number;
  checkedOutToday: number;
}

export interface AdminStats {
  todayVisitors: number;
  currentlyInside: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  expectedVisitors: number;
  walkIns: number;
  totalMembers: number;
  totalGuards: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const CAMPUS_LOCATIONS = [
  'Gate 1',
  'Gate 2',
  'Hostel',
  'Academic Block',
  'Admin Block',
  'Library',
  'Sports Complex',
  'Cafeteria',
] as const;

export const STATUS_CONFIG: Record<VisitStatus, { label: string; className: string; dotColor: string }> = {
  EXPECTED: { label: 'Expected', className: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  PENDING_VERIFICATION: { label: 'Pending Verification', className: 'bg-orange-50 text-orange-700 border-orange-200', dotColor: 'bg-orange-500' },
  CHECKED_IN: { label: 'Checked In', className: 'bg-green-50 text-green-700 border-green-200', dotColor: 'bg-green-500' },
  CHECKED_OUT: { label: 'Checked Out', className: 'bg-gray-100 text-gray-600 border-gray-200', dotColor: 'bg-gray-400' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200', dotColor: 'bg-red-500' },
};

export const VISIT_TYPE_CONFIG: Record<VisitType, { label: string; className: string }> = {
  PRE_REGISTERED: { label: 'Pre-Registered', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  WALK_IN: { label: 'Walk-in', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  DELIVERY: { label: 'Delivery', className: 'bg-teal-50 text-teal-700 border-teal-200' },
};
