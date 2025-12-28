-- 美食表更新SQL
-- 执行前请备份数据库

-- 1. 为food表添加image_url字段（如果不存在）
-- ALTER TABLE `food`
-- ADD COLUMN IF NOT EXISTS `image_url` varchar(512) DEFAULT NULL COMMENT '美食图片URL' AFTER `intro`;


 ALTER TABLE `food`
 ADD COLUMN `image_url` varchar(512) DEFAULT NULL COMMENT '美食图片URL' AFTER `intro`;

-- 验证字段是否添加成功
-- SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'food'
--   AND COLUMN_NAME = 'image_url';







