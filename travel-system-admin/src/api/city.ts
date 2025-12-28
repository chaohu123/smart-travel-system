import http from './http';

export interface City {
  id?: number;
  cityName?: string;
  province?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status?: number;
  createTime?: string;
  updateTime?: string;
  delFlag?: number;
}

export interface CityListResponse {
  code: number;
  msg: string;
  rows: City[];
  total: number;
}

export function fetchCityList(params?: Partial<City & { pageNum?: number; pageSize?: number }>) {
  return http.get<CityListResponse>('/admin/city/list', {
    params
  });
}

export function fetchCityDetail(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('城市ID不能为空'));
  }
  return http.get('/admin/city/' + id);
}

export function createCity(data: City) {
  return http.post('/admin/city', data);
}

export function updateCity(data: City) {
  return http.put('/admin/city', data);
}

export function deleteCity(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('城市ID不能为空'));
  }
  return http.delete('/admin/city/' + id);
}














