import http from './http';

export interface Food {
  id?: number;
  name?: string;
  cityId?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  foodType?: string;
  avgPrice?: number;
  intro?: string;
  score?: number;
  hotScore?: number;
  isRecommend?: number;
  createTime?: string;
  updateTime?: string;
  delFlag?: number;
}

export interface FoodListResponse {
  code: number;
  msg: string;
  rows: Food[];
  total: number;
}

export function fetchFoodList(params?: Partial<Food>) {
  return http.get<FoodListResponse>('/admin/food/list', {
    params
  });
}

export function fetchFoodDetail(id: number) {
  return http.get('/admin/food/' + id);
}

export function createFood(data: Food) {
  return http.post('/admin/food', data);
}

export function updateFood(data: Food) {
  return http.put('/admin/food', data);
}

export function deleteFood(id: number) {
  return http.delete('/admin/food/' + id);
}



















