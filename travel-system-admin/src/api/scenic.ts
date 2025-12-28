import http from './http';

export interface ScenicSpot {
  id?: number;
  name?: string;
  province?: string;
  city?: string;
  cityId?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  intro?: string;
  openTime?: string;
  ticketInfo?: string;
  price?: number;
  imageUrl?: string;
  isWorldHeritage?: number;
  suggestedVisitTime?: string;
  score?: number;
  hotScore?: number;
  isRecommend?: number;
  createTime?: string;
  updateTime?: string;
  delFlag?: number;
  freeNotice?: string;
}

export interface ScenicSpotListResponse {
  code: number;
  msg: string;
  rows: ScenicSpot[];
  total: number;
}

export function fetchScenicSpotList(params?: Partial<ScenicSpot & { pageNum?: number; pageSize?: number }>) {
  return http.get<ScenicSpotListResponse>('/admin/scenic/list', {
    params
  });
}

export function fetchScenicSpotDetail(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('景点ID不能为空'));
  }
  return http.get('/admin/scenic/' + id);
}

export function createScenicSpot(data: ScenicSpot) {
  return http.post('/admin/scenic', data);
}

export function updateScenicSpot(data: ScenicSpot) {
  return http.put('/admin/scenic', data);
}

export function deleteScenicSpot(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('景点ID不能为空'));
  }
  return http.delete('/admin/scenic/' + id);
}











