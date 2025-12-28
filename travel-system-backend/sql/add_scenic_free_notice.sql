-- 为景点表添加免费说明字段
-- 用于存储免费景点的特殊说明，如"是否需要预约"

ALTER TABLE `scenic_spot`
ADD COLUMN `free_notice` varchar(255) DEFAULT NULL COMMENT '免费景点特殊说明（如：是否需要预约）' AFTER `is_recommend`;

