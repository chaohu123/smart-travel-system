<template>
  <div class="app-wrapper">
    <el-container class="admin-shell">
      <el-aside :width="sidebarCollapsed ? '72px' : '232px'" class="sidebar">
        <div class="sidebar-brand" :class="{ collapsed: sidebarCollapsed }">
          <span class="brand-mark">旅</span>
          <span v-if="!sidebarCollapsed" class="brand-text">智能旅游 · 后台</span>
        </div>
        <el-scrollbar class="sidebar-scroll">
          <el-menu
            :default-active="activeMenu"
            :collapse="sidebarCollapsed"
            :collapse-transition="true"
            router
            class="admin-menu"
          >
            <template v-for="group in orderedMenuGroups" :key="group.category">
              <el-menu-item
                v-if="group.category === '数据总览' && group.items.length === 1"
                :index="group.items[0].path"
              >
                <el-icon v-if="group.items[0].icon">
                  <component :is="group.items[0].icon" />
                </el-icon>
                <span>{{ group.items[0].title }}</span>
              </el-menu-item>
              <el-sub-menu v-else :index="group.category">
                <template #title>
                  <el-icon v-if="group.icon">
                    <component :is="group.icon" />
                  </el-icon>
                  <span>{{ group.category }}</span>
                </template>
                <el-menu-item
                  v-for="item in group.items"
                  :key="item.path"
                  :index="item.path"
                >
                  <el-icon v-if="item.icon">
                    <component :is="item.icon" />
                  </el-icon>
                  <span>{{ item.title }}</span>
                </el-menu-item>
              </el-sub-menu>
            </template>
          </el-menu>
        </el-scrollbar>
        <div class="sidebar-collapse-bar">
          <el-tooltip :content="sidebarCollapsed ? '展开菜单' : '收起菜单'" placement="right">
            <el-button class="collapse-btn" text circle @click="sidebarCollapsed = !sidebarCollapsed">
              <el-icon :size="18">
                <Expand v-if="sidebarCollapsed" />
                <Fold v-else />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </el-aside>
      <el-container class="main-column">
        <el-header class="layout-header">
          <div class="layout-header-left">
            <div class="header-title-block">
              <h1 class="header-page-title">{{ pageTitle }}</h1>
              <p v-if="headerSubtitle" class="header-breadcrumb">{{ headerSubtitle }}</p>
            </div>
          </div>
          <div class="layout-header-right">
            <template v-if="isDashboard">
              <el-button class="header-action" @click="emitDashboard('refresh')">
                <el-icon class="header-action-icon"><Refresh /></el-icon>
                刷新数据
              </el-button>
              <el-button class="header-action primary" type="primary" @click="emitDashboard('export')">
                <el-icon class="header-action-icon"><Download /></el-icon>
                导出报表
              </el-button>
            </template>
            <el-tag size="small" effect="plain" class="env-tag">Mock 权限</el-tag>
            <el-avatar size="small" class="user-avatar">管</el-avatar>
          </div>
        </el-header>
        <div class="tags-view">
          <div
            v-for="tag in visitedViews"
            :key="tag.path"
            :class="['tags-view-item', { active: tag.path === activeMenu }]"
            @click="goTag(tag)"
          >
            <span>{{ tag.title }}</span>
            <el-icon
              v-if="visitedViews.length > 1"
              class="tag-close"
              @click.stop="closeTag(tag)"
            >
              <Close />
            </el-icon>
          </div>
        </div>
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import {
  Close,
  Monitor,
  Document,
  Location,
  User,
  Notebook,
  OfficeBuilding,
  Picture,
  ForkSpoon,
  ChatDotRound,
  Guide,
  Ticket,
  MagicStick,
  Setting,
  DocumentChecked,
  Trophy,
  Fold,
  Expand,
  Refresh,
  Download
} from '@element-plus/icons-vue';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const sidebarCollapsed = ref(false);

const iconMap = {
  数据总览: Monitor,
  用户管理: User,
  内容管理: Document,
  路线管理: Location,
  游记审核: Notebook,
  城市管理: OfficeBuilding,
  景点管理: Picture,
  美食管理: ForkSpoon,
  评论管理: ChatDotRound,
  路线管理_项: Guide,
  运营配置: MagicStick,
  活动专题管理: Ticket,
  推荐策略: MagicStick,
  等级管理: Trophy,
  系统管理: Setting,
  系统参数: Setting,
  操作日志: DocumentChecked
};

const orderedCategories = ['数据总览', '用户管理', '内容管理', '路线管理', '运营配置', '系统管理'];

const menuGroups = computed(() => {
  const groups: Record<
    string,
    { category: string; items: { path: string; title: string; icon?: any }[]; icon?: any }
  > = {};
  router.getRoutes().forEach((r) => {
    if (r.meta?.showInMenu && r.meta?.title) {
      const category = (r.meta.category as string) || '其它';
      if (!groups[category]) {
        groups[category] = { category, items: [], icon: iconMap[category] };
      }
      groups[category].items.push({
        path: r.path,
        title: r.meta.title as string,
        icon:
          iconMap[(r.meta.title as string)] ||
          (category === '路线管理' ? iconMap['路线管理_项'] : undefined) ||
          iconMap[category]
      });
    }
  });
  return Object.values(groups);
});

const orderedMenuGroups = computed(() => {
  const groups = menuGroups.value;
  return groups.sort((a, b) => {
    const ai = orderedCategories.indexOf(a.category);
    const bi = orderedCategories.indexOf(b.category);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
});

const pageTitle = computed(() => (route.meta?.title as string) || '管理后台');

const headerSubtitle = computed(() => {
  const cat = route.meta?.category as string | undefined;
  const title = route.meta?.title as string | undefined;
  if (!cat || !title || cat === title) {
    return '';
  }
  return `${cat} / ${title}`;
});

const isDashboard = computed(() => route.path === '/dashboard');

const emitDashboard = (action: 'refresh' | 'export') => {
  window.dispatchEvent(new CustomEvent('admin-dashboard-action', { detail: action }));
};

const visitedViews = ref<{ path: string; title: string }[]>([]);
const activeMenu = computed(() => route.path);

const addTag = (path: string, title: string) => {
  if (!visitedViews.value.find((t) => t.path === path)) {
    visitedViews.value.push({ path, title });
  }
};

const goTag = (tag: { path: string }) => {
  if (tag.path !== route.path) {
    router.push(tag.path);
  }
};

const closeTag = (tag: { path: string }) => {
  const idx = visitedViews.value.findIndex((t) => t.path === tag.path);
  if (idx === -1) return;
  visitedViews.value.splice(idx, 1);
  if (tag.path === route.path) {
    const fallback = visitedViews.value[idx - 1] || visitedViews.value[idx] || { path: '/dashboard' };
    router.push(fallback.path);
  }
};

const getRouteTitle = (path: string): string => {
  if (route.path === path && route.meta?.title) {
    return route.meta.title as string;
  }
  const matchedRoute = router.getRoutes().find((r) => r.path === path);
  if (matchedRoute?.meta?.title) {
    return matchedRoute.meta.title as string;
  }
  if (path === '/' || path === '') {
    return '数据总览';
  }
  return '未命名';
};

watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/' || newPath === '') {
      return;
    }
    const title = getRouteTitle(newPath);
    addTag(newPath, title);
  },
  { immediate: true }
);

onMounted(() => {
  nextTick(() => {
    const currentPath = route.path;
    if (currentPath === '/' || currentPath === '') {
      setTimeout(() => {
        const finalPath = route.path;
        if (finalPath !== '/' && finalPath !== '') {
          const title = getRouteTitle(finalPath);
          addTag(finalPath, title);
        }
      }, 100);
    } else {
      const title = getRouteTitle(currentPath);
      addTag(currentPath, title);
    }
  });
});
</script>

<style scoped>
.admin-shell {
  height: 100%;
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--admin-card);
  border-right: 1px solid var(--admin-border);
  transition: width 0.22s ease;
  box-shadow: 2px 0 24px rgba(15, 23, 42, 0.04);
}

.sidebar-brand {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid var(--admin-border);
  flex-shrink: 0;
}

.sidebar-brand.collapsed {
  justify-content: center;
  padding: 0;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(145deg, var(--admin-lake-500), var(--admin-lake-600));
  box-shadow: 0 4px 12px var(--admin-lake-glow);
}

.brand-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;
}

.sidebar-collapse-bar {
  flex-shrink: 0;
  padding: 8px 12px 12px;
  border-top: 1px solid var(--admin-border);
  display: flex;
  justify-content: center;
}

.collapse-btn {
  color: var(--admin-muted);
}

.collapse-btn:hover {
  color: var(--admin-lake-600);
  background: var(--admin-lake-soft) !important;
}

.main-column {
  min-width: 0;
  background: var(--admin-surface);
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: var(--admin-card);
  border-bottom: 1px solid var(--admin-border);
  box-shadow: none;
}

.layout-header-left {
  min-width: 0;
}

.header-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--admin-text);
  letter-spacing: 0.01em;
}

.header-breadcrumb {
  margin: 0;
  font-size: 12px;
  color: var(--admin-muted);
}

.layout-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.header-action {
  border-radius: 10px;
  font-weight: 500;
}

.header-action.primary {
  --el-button-bg-color: var(--admin-lake-500);
  --el-button-border-color: var(--admin-lake-500);
  --el-button-hover-bg-color: var(--admin-lake-600);
  --el-button-hover-border-color: var(--admin-lake-600);
}

.header-action-icon {
  margin-right: 4px;
}

.env-tag {
  border-radius: 8px;
  color: var(--admin-muted);
  border-color: var(--admin-border);
  background: var(--admin-surface);
}

.user-avatar {
  background: var(--admin-lake-soft);
  color: var(--admin-lake-600);
  font-weight: 600;
}

.tags-view {
  height: 40px;
  padding: 4px 16px;
  background: var(--admin-surface-2);
  border-bottom: 1px solid var(--admin-border);
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
}

.tags-view-item {
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--admin-card);
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--admin-muted);
  white-space: nowrap;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.tags-view-item:hover {
  border-color: var(--admin-lake-200);
  color: var(--admin-lake-600);
}

.tags-view-item.active {
  background: var(--admin-lake-soft);
  color: var(--admin-lake-600);
  border-color: rgba(93, 146, 176, 0.35);
  font-weight: 500;
}

.main-content {
  padding: 0;
  background: var(--admin-surface);
}

.tag-close {
  font-size: 12px;
  opacity: 0.65;
}

.tag-close:hover {
  opacity: 1;
}

:deep(.admin-menu) {
  border-right: none;
  background: transparent;
  --el-menu-item-height: 44px;
  --el-menu-sub-item-height: 42px;
}

:deep(.admin-menu.el-menu--collapse) {
  width: 72px;
}

:deep(.admin-menu .el-menu-item),
:deep(.admin-menu .el-sub-menu__title) {
  color: var(--admin-muted);
  border-radius: 10px;
  margin: 2px 8px;
  width: calc(100% - 16px);
}

:deep(.admin-menu .el-menu-item:hover),
:deep(.admin-menu .el-sub-menu__title:hover) {
  background: var(--admin-lake-soft) !important;
  color: var(--admin-lake-600) !important;
}

:deep(.admin-menu .el-menu-item.is-active) {
  background: var(--admin-lake-soft) !important;
  color: var(--admin-lake-600) !important;
  font-weight: 600;
}

:deep(.admin-menu .el-menu-item.is-active .el-icon),
:deep(.admin-menu .el-sub-menu.is-active > .el-sub-menu__title .el-icon) {
  color: var(--admin-lake-600);
}

:deep(.admin-menu .el-icon) {
  color: inherit;
}

:deep(.admin-menu .el-menu--inline) {
  background: transparent !important;
}

:deep(.admin-menu .el-menu--inline .el-menu-item) {
  padding-left: 52px !important;
}
</style>
