ALTER TABLE `travel_route`
ADD COLUMN `ai_used` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否使用AI文案：1是 0否' AFTER `use_count`;
