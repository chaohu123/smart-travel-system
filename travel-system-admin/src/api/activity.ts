import http from './http';

export interface Activity {
  id?: number;
  name?: string;
  highlight?: string;
  description?: string;
  rules?: string;
  imageUrl?: string;
  startTime?: string;
  endTime?: string;
  status?: 'online' | 'offline' | 'upcoming' | 'ended';
  linkUrl?: string;
  relatedRouteIds?: number[];
  relatedScenicIds?: number[];
  relatedFoodIds?: number[];
  relatedNoteIds?: number[];
  createTime?: string;
  updateTime?: string;
  delFlag?: number;
}

export interface ActivityListResponse {
  code: number;
  msg: string;
  rows: Activity[];
  total: number;
}

export function fetchActivityList(params?: Partial<Activity & { pageNum?: number; pageSize?: number }>) {
  return http.get<ActivityListResponse>('/admin/activity/list', {
    params
  });
}

export function fetchActivityDetail(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('活动ID不能为空'));
  }
  return http.get('/admin/activity/' + id);
}

export function createActivity(data: Activity) {
  return http.post('/admin/activity', data);
}

export function updateActivity(data: Activity) {
  return http.put('/admin/activity', data);
}

export function deleteActivity(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('活动ID不能为空'));
  }
  return http.delete('/admin/activity/' + id);
}

export interface ActivityParticipant {
  id: number;
  activityId: number;
  userId: number;
  registrationTime: string;
  nickname?: string;
  avatar?: string;
  city?: string;
  gender?: number;
  noteCount?: number;
  checkinCount?: number;
  favoriteCount?: number;
  activityCount?: number;
}

export interface ActivityParticipantListResponse {
  code: number;
  msg: string;
  rows: ActivityParticipant[];
  total: number;
}

export function fetchActivityParticipants(activityId: number, params?: { pageNum?: number; pageSize?: number }) {
  if (activityId === undefined || activityId === null || isNaN(Number(activityId))) {
    return Promise.reject(new Error('活动ID不能为空'));
  }
  return http.get<ActivityParticipantListResponse>(`/admin/activity/${activityId}/participants`, {
    params
  });
}

export function batchDeleteActivity(ids: number[]) {
  if (!ids || ids.length === 0) {
    return Promise.reject(new Error('请选择要删除的活动'));
  }
  return http.post('/admin/activity/batch-delete', { ids });
}

