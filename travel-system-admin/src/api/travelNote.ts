import http from './http';

export interface TravelNote {
  id?: number;
  userId?: number;
  title?: string;
  content?: string;
  cityId?: number;
  cityName?: string;
  status?: 'draft' | 'pending' | 'pass' | 'reject';
  auditRemark?: string;
  viewCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  commentCount?: number;
  isFeatured?: number;
  createTime?: string;
  updateTime?: string;
  // 作者相关字段
  authorName?: string;
  author?: string;
  authorNickname?: string;
  user?: {
    id?: number;
    nickname?: string;
    userName?: string;
    name?: string;
  };
  authorInfo?: {
    id?: number;
    nickname?: string;
    userName?: string;
    name?: string;
  };
}

export interface TravelNoteListResponse {
  code: number;
  msg: string;
  rows: TravelNote[];
  total: number;
}

export function fetchTravelNoteList(params: Partial<TravelNote>) {
  return http.get<TravelNoteListResponse>('/admin/travel/note/list', {
    params
  });
}

export function fetchTravelNoteDetail(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('游记ID不能为空'));
  }
  return http.get('/admin/travel/note/' + id);
}

export function createTravelNote(data: TravelNote) {
  return http.post('/admin/travel/note', data);
}

export function updateTravelNote(data: TravelNote) {
  return http.put('/admin/travel/note', data);
}

export function deleteTravelNote(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('游记ID不能为空'));
  }
  return http.delete('/admin/travel/note/' + id);
}

export function auditTravelNote(data: { id: number; action: 'pass' | 'reject'; remark?: string }) {
  return http.post('/admin/travel/note/audit', data);
}

export function featureTravelNote(data: { id: number; isFeatured: number }) {
  return http.post('/admin/travel/note/feature', data);
}

// 批量删除游记
export function batchDeleteTravelNotes(ids: number[]) {
  return http.post('/admin/travel/note/batch-delete', { ids });
}








