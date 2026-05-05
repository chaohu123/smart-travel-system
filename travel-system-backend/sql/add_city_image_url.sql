
use smart_travel;

ALTER TABLE `city`
ADD COLUMN `image_url` varchar(512) DEFAULT NULL COMMENT '城市图片URL' AFTER `country`;
