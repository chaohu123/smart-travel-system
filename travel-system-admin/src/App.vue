<template>
  <div class="app-wrapper">
    <el-container style="height: 100%">
      <el-aside width="240px" class="sidebar">
        <div class="sidebar-logo">智能旅游系统</div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical-demo"
          router
          background-color="#001529"
          text-color="#bfcbd9"
          active-text-color="#409eff"
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
      </el-aside>
      <el-container>
        <el-header class="layout-header">
          <div class="layout-header-left">
            <div class="layout-header-title">智能旅游系统 · 管理后台</div>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="crumb in breadcrumbs" :key="crumb">
                {{ crumb }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="layout-header-right">
            <el-tag type="info" size="small">Mock 权限</el-tag>
            <el-avatar size="small">管</el-avatar>
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
  DocumentChecked
} from '@element-plus/icons-vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

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

const breadcrumbs = computed(() => {
  const parts: string[] = [];
  if (route.meta?.category) {
    parts.push(route.meta.category as string);
  }
  if (route.meta?.title) {
    parts.push(route.meta.title as string);
  }
  return parts;
});

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

watch(
  () => route.path,
  () => {
    addTag(route.path, (route.meta.title as string) || '未命名');
  },
  { immediate: true }
);

onMounted(() => {
  addTag(route.path, (route.meta.title as string) || '未命名');
});
</script>

