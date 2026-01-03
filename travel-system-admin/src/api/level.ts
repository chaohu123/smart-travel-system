import http from './http';

export interface Level {
  id?: number;
  level: number;
  levelName: string;
  minExperience: number;
  maxExperience?: number;
  medalName: string;
  medalIcon: string;
  description?: string;
  status: number;
}

export interface LevelListResponse {
  code: number;
  msg: string;
  rows: Level[];
  total: number;
}

export interface ExpRule {
  commentExp: number;
  noteExp: number;
  checkinExp: number;
  dailyCheckinExp: number;
}

export interface ExpRuleResponse {
  code: number;
  msg: string;
  data?: ExpRule;
}

// 获取等级列表
export function fetchLevelList(params?: { pageNum?: number; pageSize?: number }) {
  return http.get<LevelListResponse>('/admin/level/list', { params });
}

// 创建等级
export function createLevel(data: Level) {
  return http.post<{ code: number; msg: string }>('/admin/level/create', data);
}

// 更新等级
export function updateLevel(data: Level) {
  return http.post<{ code: number; msg: string }>('/admin/level/update', data);
}

// 删除等级
export function deleteLevel(id: number) {
  return http.post<{ code: number; msg: string }>('/admin/level/delete', { id });
}

// 获取经验值规则
export function fetchExpRules() {
  return http.get<ExpRuleResponse>('/admin/level/exp-rules');
}

// 保存经验值规则
export function saveExpRules(data: ExpRule) {
  return http.post<{ code: number; msg: string }>('/admin/level/exp-rules', data);
}

