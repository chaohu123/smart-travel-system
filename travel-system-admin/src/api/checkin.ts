import http from './http';

export interface CheckinPoint {
  id?: number;
  name?: string;
  targetType?: 'scenic' | 'food';
  targetId?: number;
  targetName?: string;
  imageUrl?: string;
  location?: string;
  checkinCount?: number;
  isActive?: number;
  createTime?: string;
  updateTime?: string;
  delFlag?: number;
}

export interface CheckinPointListResponse {
  code: number;
  msg: string;
  rows: CheckinPoint[];
  total: number;
}

export function fetchCheckinPointList(params?: Partial<CheckinPoint & { pageNum?: number; pageSize?: number }>) {
  return http.get<CheckinPointListResponse>('/admin/checkin/list', {
    params
  });
}

export function fetchCheckinPointDetail(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('打卡点ID不能为空'));
  }
  return http.get('/admin/checkin/' + id);
}

export function createCheckinPoint(data: CheckinPoint) {
  return http.post('/admin/checkin', data);
}

export function updateCheckinPoint(data: CheckinPoint) {
  return http.put('/admin/checkin', data);
}

export function deleteCheckinPoint(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('打卡点ID不能为空'));
  }
  return http.delete('/admin/checkin/' + id);
}


























