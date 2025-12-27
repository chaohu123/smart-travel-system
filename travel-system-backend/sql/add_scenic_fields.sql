-- 为景点表添加新字段
-- 注意：如果字段已存在，请先删除再执行，或者使用 IF NOT EXISTS（MySQL 8.0+）

-- 添加价格字段
ALTER TABLE `scenic_spot`
ADD COLUMN `price` decimal(10,2) DEFAULT NULL COMMENT '门票价格' AFTER `ticket_info`;

-- 添加图片URL字段
ALTER TABLE `scenic_spot`
ADD COLUMN `image_url` varchar(512) DEFAULT NULL COMMENT '景点图片URL' AFTER `price`;

-- 添加世界文化遗产字段
ALTER TABLE `scenic_spot`
ADD COLUMN `is_world_heritage` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否世界文化遗产：1是 0否' AFTER `image_url`;

-- 添加建议游览时间字段
ALTER TABLE `scenic_spot`
ADD COLUMN `suggested_visit_time` varchar(64) DEFAULT NULL COMMENT '建议游览时间' AFTER `is_world_heritage`;

