import axios from '@/lib/axios';

export interface AuditLog {
  id: string;
  action: string;
  entity_name: string;
  entity_id: string;
  old_payload: string;
  new_payload: string;
  changed_by: string;
  created_at: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const auditLogService = {
  getAuditLogs: async (params?: { page?: number; limit?: number; start_date?: string; end_date?: string; user?: string }): Promise<PaginatedAuditLogs> => {
    const response = await axios.get('/audit-logs', { params });
    return response.data;
  }
};
