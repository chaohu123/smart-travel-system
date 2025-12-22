# 数据库设计 TodoList（db-design-todolist.md）

> 目标：完成智能旅游系统的数据库概念结构、逻辑结构和物理结构设计，并为后端实现打好基础。

---

## 1. 总体设计任务

- [ ] **1.1 明确数据库设计原则**
  - [ ] 满足功能需求：用户、游记、景点、美食、线路、打卡、推荐、统计等
  - [ ] 支持前后端分离与高并发访问
  - [ ] 兼顾可扩展性（支持多城市、多标签、多种内容类型）

- [ ] **1.2 绘制 E-R 图（概念结构设计）**
  - [ ] 确定核心实体：用户、游记、景点、美食、旅游线路、打卡记录、标签、行为记录
  - [ ] 明确实体之间的关系：
    - 用户 – 游记（1:N）
    - 用户 – 打卡（1:N）
    - 用户 – 行为记录（1:N）
    - 游记 – 图片（1:N）
    - 游记 – 景点（N:M）
    - 用户 – 标签（N:M）
    - 线路 – 景点（N:M，并带顺序与天数）
  - [ ] 用工具（PowerDesigner/Visio/Navicat/在线ER图工具）画出 E-R 图

- [ ] **1.3 确定命名规范**
  - [ ] 表名、字段名采用统一风格（如：小写下划线）
  - [ ] 主键统一为 `id`（bigint 自增或雪花 ID）
  - [ ] 统一通用字段：`create_time`、`update_time`、`create_by`、`update_by`、`del_flag` 等

---

## 2. 用户与标签相关表设计

- [ ] **2.1 用户表（user）**
  - [ ] 字段设计：
    - [ ] `id`：主键
    - [ ] `openid`：微信唯一标识
    - [ ] `nickname`：昵称
    - [ ] `avatar`：头像地址
    - [ ] `gender`：性别
    - [ ] `city`：常驻城市
    - [ ] `signature`：个性签名
    - [ ] `status`：状态（正常/禁用）
    - [ ] 统计字段（可选）：`note_count`、`favorite_count`、`checkin_count`
    - [ ] 通用字段：`create_time`、`update_time`、`del_flag`
  - [ ] 索引设计：
    - [ ] `uniq_openid` 唯一索引
    - [ ] 状态 + 城市组合查询索引

- [ ] **2.2 标签表（tag）**
  - [ ] 字段设计：
    - [ ] `id`：主键
    - [ ] `tag_name`：标签名（美食、自然、历史…）
    - [ ] `tag_type`：标签类型（用户兴趣/内容标签/通用）
    - [ ] `status`：启用/禁用
  - [ ] 为标签名称建立唯一索引

- [ ] **2.3 用户兴趣标签关联表（user_tag）**
  - [ ] 字段设计：
    - [ ] `id`
    - [ ] `user_id`
    - [ ] `tag_id`
    - [ ] `weight`：偏好权重（可选，用于推荐）
  - [ ] 联合唯一索引 `(user_id, tag_id)`

---

## 3. 景点与美食相关表设计

- [ ] **3.1 城市表（city）【可选但推荐】**
  - [ ] 字段：`id`、`city_name`、`province`、`country`、`latitude`、`longitude`、`status`

- [ ] **3.2 景点表（scenic_spot）**
  - [ ] 字段设计：
    - [ ] `id`
    - [ ] `name`：景点名称
    - [ ] `city_id`：所属城市
    - [ ] `address`：地址
    - [ ] `latitude`、`longitude`：坐标
    - [ ] `intro`：简介
    - [ ] `open_time`：开放时间
    - [ ] `ticket_info`：门票信息
    - [ ] `score`：评分
    - [ ] `hot_score`：热度值
    - [ ] `is_recommend`：是否推荐
    - [ ] 通用字段
  - [ ] 索引：按 `city_id`、`hot_score`、`is_recommend` 建索引

- [ ] **3.3 美食表（food）**
  - [ ] 字段设计：
    - [ ] `id`
    - [ ] `name`
    - [ ] `city_id`
    - [ ] `address`
    - [ ] `latitude`、`longitude`
    - [ ] `food_type`：菜系/类型
    - [ ] `avg_price`：人均价格
    - [ ] `intro`
    - [ ] `score`、`hot_score`、`is_recommend`
    - [ ] 通用字段
  - [ ] 索引：`city_id`、`food_type`、`hot_score`

- [ ] **3.4 景点/美食与标签关联表（content_tag）**
  - [ ] 字段：`id`、`content_type`（景点/美食/游记）、`content_id`、`tag_id`
  - [ ] 联合索引 `(content_type, content_id)`、`tag_id` 索引

---

## 4. 游记与图片、评论表设计

- [ ] **4.1 游记表（travel_note）**
  - [ ] 字段设计：
    - [ ] `id`
    - [ ] `user_id`
    - [ ] `title`
    - [ ] `content`（长文本）
    - [ ] `city_id`
    - [ ] `status`（草稿/待审/通过/拒绝）
    - [ ] `view_count`、`like_count`、`favorite_count`、`comment_count`
    - [ ] `is_featured`：是否精选
    - [ ] 通用字段
  - [ ] 索引：`user_id`、`city_id`、`status`、`is_featured`

- [ ] **4.2 游记图片表（travel_note_image）**
  - [ ] 字段：`id`、`note_id`、`url`、`sort`、通用字段
  - [ ] 按 `note_id` 建索引

- [ ] **4.3 游记与景点关联表（note_scenic_ref）**
  - [ ] 字段：`id`、`note_id`、`scenic_id`
  - [ ] 联合唯一索引 `(note_id, scenic_id)`

- [ ] **4.4 评论表（comment）**
  - [ ] 字段：`id`、`content_type`（游记等）、`content_id`、`user_id`、`content`、`parent_id`、`status`、`like_count`、通用字段
  - [ ] 支持一级/二级评论（`parent_id`）

---

## 5. 旅游线路与行程表设计

- [ ] **5.1 旅游线路主表（travel_route）**
  - [ ] 字段：
    - [ ] `id`
    - [ ] `route_name`
    - [ ] `city_id`
    - [ ] `days`：天数
    - [ ] `suitable_people`：适合人群
    - [ ] `source_type`：模板/系统生成/用户自定义
    - [ ] `summary`：行程概要
    - [ ] `cover_image`
    - [ ] 热度字段：`view_count`、`favorite_count`、`use_count`
    - [ ] 通用字段
  - [ ] 索引：`city_id`、`source_type`

- [ ] **5.2 线路日程表（travel_route_day）**
  - [ ] 字段：`id`、`route_id`、`day_no`、`title`、`intro`、通用字段
  - [ ] 联合索引 `(route_id, day_no)`

- [ ] **5.3 线路日程明细表（travel_route_poi）**
  - [ ] 字段：
    - [ ] `id`
    - [ ] `route_day_id`
    - [ ] `poi_type`（景点/美食）
    - [ ] `poi_id`
    - [ ] `sort`：顺序
    - [ ] `stay_time`：预估停留时间（可选）
    - [ ] `note`：特别说明（可选）
  - [ ] 联合索引 `(route_day_id, sort)`

- [ ] **5.4 用户收藏行程表（user_route_favorite）**
  - [ ] 字段：`id`、`user_id`、`route_id`、`create_time`
  - [ ] 联合唯一索引 `(user_id, route_id)`

---

## 6. 打卡与行为记录表设计

- [ ] **6.1 打卡记录表（checkin_record）**
  - [ ] 字段：
    - [ ] `id`
    - [ ] `user_id`
    - [ ] `target_type`（景点/美食）
    - [ ] `target_id`
    - [ ] `photo_url`
    - [ ] `content`：文字描述
    - [ ] `latitude`、`longitude`
    - [ ] `checkin_time`
    - [ ] 通用字段
  - [ ] 索引：`user_id`、`target_type + target_id`

- [ ] **6.2 用户行为记录表（user_behavior）**
  - [ ] 字段：
    - [ ] `id`
    - [ ] `user_id`
    - [ ] `behavior_type`（浏览/点赞/收藏/打卡）
    - [ ] `content_type`（游记/景点/美食/线路）
    - [ ] `content_id`
    - [ ] `score`：行为权重值
    - [ ] `behavior_time`
  - [ ] 索引：`user_id`、`content_type + content_id`

---

## 7. 推荐与统计辅助表设计（可选/扩展）

- [ ] 推荐结果缓存表（有需要时）
- [ ] 运营专题配置表（例如节日活动线路）
- [ ] 定时统计结果表（按日记录统计快照）

---

## 8. 物理与性能设计

- [ ] 为高频查询字段加合适索引，并避免过度索引
- [ ] 适当预留字段用于扩展（如冗余城市名称/封面图等）
- [ ] 规划分库分表可能性（后期扩展点）
- [ ] 编写建表 SQL 脚本，归档到 `doc/sql` 目录
---

## 9. 数据生命周期与清理策略

- [ ] **逻辑删除与物理删除约定**
  - [ ] 明确哪些表采用 `del_flag` 逻辑删除（如游记、评论、打卡、线路）
  - [ ] 明确哪些日志/行为类表可以定期物理删除或归档（如 `user_behavior`、AI 调用日志表）

- [ ] **历史数据归档与清理**
  - [ ] 设计简单的“统计快照表”，按日汇总用户数、游记数、打卡数等
  - [ ] 为行为日志设计保留周期（例如只保留最近 6 个月），通过定时任务清理旧数据
  - [ ] 为大字段表（游记内容、评论内容）考虑分表或归档（作为扩展点）

- [ ] **演示/初始化数据设计**
  - [ ] 设计初始城市、景点、美食、线路模板的 SQL 脚本
  - [ ] 设计几条示例游记、打卡记录，方便演示与测试
  - [ ] 将初始化脚本统一放置在 `doc/sql/init` 目录，并在文档中说明使用方法
