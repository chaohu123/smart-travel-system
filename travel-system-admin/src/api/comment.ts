import http from './http';

export interface Comment {
  id?: number;
  contentType?: string;
  contentId?: number;
  userId?: number;
  content?: string;
  parentId?: number;
  status?: number;
  likeCount?: number;
  createTime?: string;
  updateTime?: string;
  delFlag?: number;
}

export interface CommentListResponse {
  code: number;
  msg: string;
  rows: Comment[];
  total: number;
}

export function fetchCommentList(params?: Partial<Comment>) {
  return http.get<CommentListResponse>('/admin/comment/list', {
    params
  });
}

export function fetchCommentDetail(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('评论ID不能为空'));
  }
  return http.get('/admin/comment/' + id);
}

export function createComment(data: Comment) {
  return http.post('/admin/comment', data);
}

export function updateComment(data: Comment) {
  return http.put('/admin/comment', data);
}

export function deleteComment(id: number) {
  if (id === undefined || id === null || isNaN(Number(id))) {
    return Promise.reject(new Error('评论ID不能为空'));
  }
  return http.delete('/admin/comment/' + id);
}

export function auditComment(data: { id: number; status: number }) {
  return http.post('/admin/comment/audit', data);
}




