 # 行程数据调试指南

## 问题描述
后端返回了详细的JSON数据，但前端行程详情页没有显示数据。

## 数据流检查点

### 1. 后端AI响应解析
- **位置**: `AiServiceImpl.parseJsonResponse()`
- **检查**: 日志中应该看到 "解析到X天的行程数据"
- **输出格式**: `Map<String, String>`，key为 `day1_morning`, `day1_afternoon` 等

### 2. 后端数据保存
- **位置**: `RoutePlanServiceImpl.generateRoute()`
- **检查**: 日志中应该看到 "保存第X天的行程数据，格式: JSON，长度: X 字符"
- **数据库字段**: `travel_route_day.intro`
- **保存格式**: JSON字符串，结构为：
  ```json
  {
    "morning": {
      "timeSlot": "morning",
      "breakfast": {...},
      "routes": [...],
      "scenics": [...]
    },
    "afternoon": {...},
    "evening": {...}
  }
  ```

### 3. 前端数据加载
- **位置**: `itinerary-detail.vue.loadRouteDetail()`
- **检查**: 控制台应该看到 "[loadRouteDetail] 路线数据加载成功"
- **API**: `/api/route/detail?id={routeId}`

### 4. 前端数据解析
- **位置**: `itinerary-detail.vue.formatDayContent()`
- **检查**: 控制台应该看到 "[formatDayContent] 开始格式化"
- **输入**: `dayData.day.intro` (JSON字符串或对象)
- **输出**: 时间段数组，每个时间段包含早餐/路线/景点

## 调试步骤

### 步骤1: 检查后端日志
```bash
# 查看后端日志，确认数据是否正确保存
grep "保存第.*天的行程数据" logs/application.log
```

### 步骤2: 检查数据库
```sql
-- 查看数据库中保存的数据
SELECT id, day_no, intro FROM travel_route_day WHERE route_id = {routeId};
```

### 步骤3: 检查前端控制台
打开浏览器开发者工具，查看控制台日志：
- `[loadRouteDetail]` 相关日志
- `[formatDayContent]` 相关日志

### 步骤4: 检查API响应
在Network标签中查看 `/api/route/detail` 的响应，确认数据结构是否正确。

## 常见问题

### 问题1: intro字段为空
**原因**: AI生成失败或数据保存失败
**解决**: 检查后端日志中的错误信息

### 问题2: intro字段是字符串但不是JSON
**原因**: 使用了旧格式或解析失败
**解决**: 检查后端日志，确认是否使用了降级方案

### 问题3: 前端解析失败
**原因**: JSON格式不正确或字段缺失
**解决**: 查看前端控制台的错误日志，检查 `formatDayContent` 函数的输出

### 问题4: 数据格式不匹配
**原因**: 后端保存的格式与前端期望的格式不一致
**解决**: 检查 `RoutePlanServiceImpl` 中的保存逻辑，确保格式正确

## 修复内容

### 后端修复
1. ✅ 使用 `ObjectMapper` 确保JSON格式正确
2. ✅ 添加详细日志记录保存过程
3. ✅ 正确处理JSON字符串和对象的转换

### 前端修复
1. ✅ 添加详细日志记录解析过程
2. ✅ 修复条件判断，支持只有路线或只有用餐的情况
3. ✅ 增强错误处理和降级方案

## 测试验证

1. **生成新行程**: 创建一个新的行程，确认数据正确保存
2. **查看详情页**: 打开行程详情页，确认数据正确显示
3. **检查控制台**: 查看浏览器控制台，确认没有错误日志
4. **检查后端日志**: 查看后端日志，确认数据正确保存

