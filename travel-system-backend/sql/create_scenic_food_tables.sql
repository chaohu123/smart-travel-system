-- ============================================
-- 景点表（scenic_spot）创建语句
-- ============================================
CREATE TABLE IF NOT EXISTS `scenic_spot` (
  `id`                    bigint(20)      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name`                  varchar(128)    NOT NULL COMMENT '景点名称',
  `province`              varchar(64)     DEFAULT NULL COMMENT '省份',
  `city`                  varchar(64)     DEFAULT NULL COMMENT '城市名称',
  `city_id`               bigint(20)      NOT NULL COMMENT '所属城市ID（关联city表）',
  `address`               varchar(255)     DEFAULT NULL COMMENT '详细地址',
  `latitude`              decimal(10,6)   DEFAULT NULL COMMENT '纬度（用于地图定位）',
  `longitude`             decimal(10,6)   DEFAULT NULL COMMENT '经度（用于地图定位）',
  `intro`                 text            DEFAULT NULL COMMENT '景点简介（详细介绍）',
  `open_time`             varchar(128)    DEFAULT NULL COMMENT '开放时间描述（如：08:00-18:00）',
  `ticket_info`           varchar(255)    DEFAULT NULL COMMENT '门票信息描述（如：成人票60元/人）',
  `price`                 decimal(10,2)   DEFAULT NULL COMMENT '门票价格（元）',
  `image_url`             varchar(512)    DEFAULT NULL COMMENT '景点图片URL（主图）',
  `is_world_heritage`     tinyint(1)      NOT NULL DEFAULT 0 COMMENT '是否世界文化遗产：1是 0否',
  `suggested_visit_time`  varchar(64)     DEFAULT NULL COMMENT '建议游览时间（如：2-3小时、全天）',
  `score`                 decimal(3,2)    DEFAULT 0.00 COMMENT '评分（0.00-5.00）',
  `hot_score`             int(11)         DEFAULT 0 COMMENT '热度值（用于排序和推荐）',
  `is_recommend`          tinyint(1)      NOT NULL DEFAULT 0 COMMENT '是否推荐：1是 0否',
  `free_notice`           varchar(255)    DEFAULT NULL COMMENT '免费景点特殊说明（如：是否需要预约）',
  `create_time`           datetime        DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time`           datetime        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by`             bigint(20)      DEFAULT NULL COMMENT '创建人ID',
  `update_by`             bigint(20)      DEFAULT NULL COMMENT '更新人ID',
  `del_flag`              tinyint(1)      NOT NULL DEFAULT 0 COMMENT '删除标志：0未删除 1已删除',
  PRIMARY KEY (`id`),
  KEY `idx_scenic_city` (`city_id`) COMMENT '城市ID索引（用于按城市查询）',
  KEY `idx_scenic_hot` (`hot_score`) COMMENT '热度值索引（用于排序）',
  KEY `idx_scenic_recommend` (`is_recommend`) COMMENT '推荐标志索引（用于筛选推荐景点）',
  KEY `idx_scenic_del_flag` (`del_flag`) COMMENT '删除标志索引（用于过滤已删除数据）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='景点表';


-- ============================================
-- 美食表（food）创建语句
-- ============================================
CREATE TABLE IF NOT EXISTS `food` (
  `id`                    bigint(20)      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name`                  varchar(128)    NOT NULL COMMENT '餐厅/美食名称',
  `city_id`               bigint(20)      NOT NULL COMMENT '所属城市ID（关联city表）',
  `address`               varchar(255)    DEFAULT NULL COMMENT '详细地址',
  `latitude`              decimal(10,6)   DEFAULT NULL COMMENT '纬度（用于地图定位）',
  `longitude`             decimal(10,6)   DEFAULT NULL COMMENT '经度（用于地图定位）',
  `food_type`             varchar(64)     DEFAULT NULL COMMENT '菜系/类型（如：川菜、粤菜、火锅、小吃等）',
  `avg_price`             decimal(10,2)  DEFAULT NULL COMMENT '人均消费（元）',
  `intro`                 text            DEFAULT NULL COMMENT '餐厅/美食简介（详细介绍）',
  `image_url`             varchar(512)    DEFAULT NULL COMMENT '美食图片URL（主图）',
  `score`                 decimal(3,2)    DEFAULT 0.00 COMMENT '评分（0.00-5.00）',
  `hot_score`             int(11)         DEFAULT 0 COMMENT '热度值（用于排序和推荐）',
  `is_recommend`          tinyint(1)      NOT NULL DEFAULT 0 COMMENT '是否推荐：1是 0否',
  `create_time`           datetime        DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time`           datetime        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by`             bigint(20)      DEFAULT NULL COMMENT '创建人ID',
  `update_by`             bigint(20)      DEFAULT NULL COMMENT '更新人ID',
  `del_flag`              tinyint(1)      NOT NULL DEFAULT 0 COMMENT '删除标志：0未删除 1已删除',
  PRIMARY KEY (`id`),
  KEY `idx_food_city` (`city_id`) COMMENT '城市ID索引（用于按城市查询）',
  KEY `idx_food_type` (`food_type`) COMMENT '菜系类型索引（用于按类型筛选）',
  KEY `idx_food_hot` (`hot_score`) COMMENT '热度值索引（用于排序）',
  KEY `idx_food_del_flag` (`del_flag`) COMMENT '删除标志索引（用于过滤已删除数据）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='美食表';

