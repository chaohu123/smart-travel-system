-- 为food表添加image_url字段
ALTER TABLE `food`
ADD COLUMN `image_url` varchar(512) DEFAULT NULL COMMENT '美食图片URL' AFTER `intro`;







