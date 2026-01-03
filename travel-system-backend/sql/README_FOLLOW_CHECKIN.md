# 用户关注和签到功能数据库脚本

## 执行顺序

请按以下顺序执行SQL脚本：

1. **user_follow_table.sql** - 创建用户关注关系表和签到记录表
2. **add_user_email_column.sql** - 为用户表添加email字段

## 表结构说明

### user_follow 表
- 存储用户之间的关注关系
- user_id: 关注者ID
- followed_user_id: 被关注者ID
- 唯一索引：user_id + followed_user_id + del_flag

### user_checkin 表
- 存储用户签到记录
- user_id: 用户ID
- checkin_date: 签到日期（DATE类型）
- experience_gained: 获得经验值（默认10）
- 唯一索引：user_id + checkin_date（确保一天只能签到一次）

### user 表新增字段
- email: 邮箱地址（varchar(128)）

## API接口

### 关注相关
- GET `/api/v1/user/followers` - 获取粉丝列表
- GET `/api/v1/user/following` - 获取关注列表
- POST `/api/v1/user/follow` - 关注/取消关注

### 签到相关
- POST `/api/v1/user/checkin` - 签到（一天只能签到一次，+10经验）

### 用户信息更新
- POST `/api/v1/admin/user/update` - 更新用户资料（支持email字段）

