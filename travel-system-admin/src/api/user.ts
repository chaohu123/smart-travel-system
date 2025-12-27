import http from './http';

export interface AdminUser {
  id?: number;
  nickname?: string;
  city?: string;
  status?: number;
  noteCount?: number;
  favoriteCount?: number;
  checkinCount?: number;
  createTime?: string;
}

export interface AdminUserListResponse {
  code: number;
  msg: string;
  rows: AdminUser[];
  total: number;
}

export function fetchUserList(params?: Partial<AdminUser & { pageNum?: number; pageSize?: number }>) {
  return http.get<AdminUserListResponse>('/admin/user/list', { params });
}

export function updateUserStatus(data: { id: number; status: number }) {
  return http.post('/admin/user/status', data);
}

export function exportUserList(params?: Partial<AdminUser>) {
  return http.get('/admin/user/export', { params, responseType: 'blob' });
}

