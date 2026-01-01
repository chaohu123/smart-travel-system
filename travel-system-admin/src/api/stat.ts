import http from './http';

export interface UserSummary {
  total: number;
  today: number;
  yesterday: number;
  lastWeek: number;
}

export interface TrendData {
  day: string;
  count: number;
}

export interface TrendResponse {
  trend: TrendData[];
  todayCount: number;
  yesterdayCount: number;
}

export interface CityTopData {
  city: string;
  count: number;
}

export interface StatResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// 用户统计摘要
export function fetchUserSummary() {
  return http.get<StatResponse<UserSummary>>('/admin/stat/user/summary');
}

// 游记发布趋势（支持时间范围：7/14/30天）
export function fetchTravelNoteTrend(days: number = 14) {
  return http.get<StatResponse<TrendResponse>>('/admin/stat/travelNote/trend', {
    params: { days }
  });
}

// 打卡趋势（支持时间范围：7/14/30天）
export function fetchCheckinTrend(days: number = 14) {
  return http.get<StatResponse<TrendResponse>>('/admin/stat/checkin/trend', {
    params: { days }
  });
}

// 热门城市TOP10
export function fetchCityTop() {
  return http.get<StatResponse<CityTopData[]>>('/admin/stat/city/top');
}

