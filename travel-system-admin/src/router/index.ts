import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '数据总览', category: '数据总览', showInMenu: true, icon: 'Monitor' }
  },
  {
    path: '/user/manage',
    name: 'UserManage',
    component: () => import('@/views/user/UserManage.vue'),
    meta: { title: '用户管理', category: '用户管理', showInMenu: true, icon: 'User' }
  },
  {
    path: '/content/travel-note-audit',
    name: 'TravelNoteAudit',
    component: () => import('@/views/content/TravelNoteAudit.vue'),
    meta: { title: '游记审核', category: '内容管理', showInMenu: true, icon: 'Notebook' }
  },
  {
    path: '/content/city-manage',
    name: 'CityManage',
    component: () => import('@/views/content/CityManage.vue'),
    meta: { title: '城市管理', category: '内容管理', showInMenu: true, icon: 'OfficeBuilding' }
  },
  {
    path: '/content/scenic-manage',
    name: 'ScenicManage',
    component: () => import('@/views/content/ScenicManage.vue'),
    meta: { title: '景点管理', category: '内容管理', showInMenu: true, icon: 'Picture' }
  },
  {
    path: '/content/food-manage',
    name: 'FoodManage',
    component: () => import('@/views/content/FoodManage.vue'),
    meta: { title: '美食管理', category: '内容管理', showInMenu: true, icon: 'ForkSpoon' }
  },
  {
    path: '/content/comment-manage',
    name: 'CommentManage',
    component: () => import('@/views/content/CommentManage.vue'),
    meta: { title: '评论管理', category: '内容管理', showInMenu: true, icon: 'ChatDotRound' }
  },
  {
    path: '/route/route-manage',
    name: 'RouteManage',
    component: () => import('@/views/route/RouteManage.vue'),
    meta: { title: '路线管理', category: '路线管理', showInMenu: true, icon: 'Guide' }
  },
  {
    path: '/ops/activity-manage',
    name: 'ActivityManage',
    component: () => import('@/views/ops/ActivityManage.vue'),
    meta: { title: '活动/专题管理', category: '运营配置', showInMenu: true, icon: 'Ticket' }
  },
  {
    path: '/ops/recommend-strategy',
    name: 'RecommendStrategy',
    component: () => import('@/views/ops/RecommendStrategy.vue'),
    meta: { title: '推荐策略', category: '运营配置', showInMenu: true, icon: 'MagicStick' }
  },
  {
    path: '/system/params',
    name: 'SystemParams',
    component: () => import('@/views/system/SystemParams.vue'),
    meta: { title: '系统参数', category: '系统管理', showInMenu: true, icon: 'Setting' }
  },
  {
    path: '/system/oplog',
    name: 'OperationLog',
    component: () => import('@/views/system/OperationLog.vue'),
    meta: { title: '操作日志', category: '系统管理', showInMenu: true, icon: 'DocumentChecked' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;





