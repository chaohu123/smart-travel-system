-- 为用户表添加email字段
ALTER TABLE `user` 
ADD COLUMN `email` varchar(128) DEFAULT NULL COMMENT '邮箱地址' AFTER `signature`;

