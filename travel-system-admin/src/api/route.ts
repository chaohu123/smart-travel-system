import http from './http';

export interface TravelRoute {
  id?: number;
  routeName?: string;
  cityId?: number;
  days?: number;
  suitablePeople?: string;
  sourceType?: string;
  summary?: string;
  coverImage?: string;
  viewCount?: number;
  favoriteCount?: number;
  useCount?: number;
  createTime?: string;
  updateTime?: string;
  delFlag?: number;
}

export interface TravelRouteListResponse {
  code: number;
  msg: string;
  rows: TravelRoute[];
  total: number;
}

export function fetchRouteList(params?: Partial<TravelRoute & { pageNum?: number; pageSize?: number }>) {
  return http.get<TravelRouteListResponse>('/admin/route/list', {
    params
  });
}

export function fetchRouteDetail(id: number) {
  return http.get('/admin/route/' + id);
}

export function createRoute(data: TravelRoute) {
  return http.post('/admin/route', data);
}

export function updateRoute(data: TravelRoute) {
  return http.put('/admin/route', data);
}

export function deleteRoute(id: number) {
  return http.delete('/admin/route/' + id);
}

export function fetchRouteDays(routeId: number) {
  return http.get('/admin/route/day/list', { params: { routeId } });
}

export function saveRouteDay(data: any) {
  return http.post('/admin/route/day/save', data);
}

export function deleteRouteDay(id: number) {
  return http.delete('/admin/route/day/' + id);
}




