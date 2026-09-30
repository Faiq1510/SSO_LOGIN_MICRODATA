/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AssetStatus = 'Tersedia' | 'Tidak Tersedia' | 'Dipinjam' | 'Maintenance' | 'Arsip';
export type AssetCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
export type BorrowRequestStatus = 'Pending_Supervisor' | 'Approved' | 'Rejected' | 'Selesai';
export type MaintenanceStatus = 'Dijadwalkan' | 'Sedang Berjalan' | 'Selesai';
export type MaintenanceType = 'Rutin' | 'Perbaikan' | 'Kalibrasi';
export type UserRole = 'Administrator' | 'Staff' | 'Supervisor' | 'Teknisi';

export interface Asset {
  id: string; // e.g., JKT-IT-26-0001
  name: string;
  category: string;
  location: string;
  status: AssetStatus;
  condition: AssetCondition;
  purchase_date: string;
  serial_number: string;
  qr_code: string;
  description: string;
  images?: Record<string, unknown>[];
  has_pending_deletion?: boolean;
  deleted_at?: string;
}

export interface Borrowing {
  id: string;
  user_id: string;
  borrower_name: string;
  asset_id: string;
  asset_name: string;
  start_date: string;
  end_date: string;
  purpose: string;
  status: string;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}



export interface MaintenanceRecord {
  id: string; // e.g., MNT-201
  asset_id: string;
  asset_name: string;
  technician_id: string;
  technician_name: string;
  scheduled_date: string;
  actual_start_date?: string;
  completed_date?: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  payment_status: string;
  invoice_url?: string;
  estimated_cost: number;
  actual_cost?: number;
  cost: number;
  notes: string;
  created_at: string;
  updated_at: string;
  is_edited?: boolean;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: 'Peminjaman' | 'Approval' | 'Pengembalian' | 'Maintenance';
  recipientName: string;
  recipientPhone: string;
  message: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  idKaryawan?: string;
  lastLogin?: string;
}

export interface PaginatedResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

