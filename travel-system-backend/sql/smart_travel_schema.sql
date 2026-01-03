-- 智能旅游系统数据库建表脚本
CREATE DATABASE smart_travel DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- 然后在该库中执行本脚本

SET NAMES utf8mb4;

use smart_travel;
/*========================
  1. 用户与标签相关表
  ========================*/

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id`            bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `openid`        varchar(64)  NOT NULL COMMENT '微信 OpenID',
  `nickname`      varchar(64)  NOT NULL COMMENT '昵称',
  `avatar`        varchar(255) DEFAULT NULL COMMENT '头像地址',
  `gender`        tinyint(1)   DEFAULT NULL COMMENT '性别：0未知 1男 2女',
  `city`          varchar(64)  DEFAULT NULL COMMENT '常驻城市名称',
  `signature`     varchar(255) DEFAULT NULL COMMENT '个性签名',
  `status`        tinyint(1)   NOT NULL DEFAULT 1 COMMENT '状态：1正常 0禁用',
  `note_count`        int(11) DEFAULT 0 COMMENT '游记数量',
  `favorite_count`    int(11) DEFAULT 0 COMMENT '收藏数量',
  `checkin_count`     int(11) DEFAULT 0 COMMENT '打卡数量',
  `create_time`   datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`   datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`     bigint(20)   DEFAULT NULL,
  `update_by`     bigint(20)   DEFAULT NULL,
  `del_flag`      tinyint(1)   NOT NULL DEFAULT 0 COMMENT '删除标记：0正常 1删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_openid` (`openid`),
  KEY `idx_user_city_status` (`city`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 标签表
CREATE TABLE IF NOT EXISTS `tag` (
  `id`         bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `tag_name`   varchar(64)  NOT NULL COMMENT '标签名',
  `tag_type`   varchar(32)  NOT NULL COMMENT '标签类型：user/content/common 等',
  `status`     tinyint(1)   NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `create_time` datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`  bigint(20)   DEFAULT NULL,
  `update_by`  bigint(20)   DEFAULT NULL,
  `del_flag`   tinyint(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_tag_name_type` (`tag_name`, `tag_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表';

-- 用户兴趣标签关联表
CREATE TABLE IF NOT EXISTS `user_tag` (
  `id`        bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`   bigint(20) NOT NULL COMMENT '用户ID',
  `tag_id`    bigint(20) NOT NULL COMMENT '标签ID',
  `weight`    int(11)    DEFAULT 0 COMMENT '偏好权重',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by` bigint(20) DEFAULT NULL,
  `update_by` bigint(20) DEFAULT NULL,
  `del_flag`  tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_tag` (`user_id`, `tag_id`),
  KEY `idx_user_tag_user` (`user_id`),
  KEY `idx_user_tag_tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户兴趣标签关联表';


/*========================
  2. 城市、景点、美食与内容标签
  ========================*/

-- 城市表
CREATE TABLE IF NOT EXISTS `city` (
  `id`         bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `city_name`  varchar(64)  NOT NULL COMMENT '城市名',
  `province`   varchar(64)  DEFAULT NULL COMMENT '省份',
  `country`    varchar(64)  DEFAULT '中国' COMMENT '国家',
  `latitude`   decimal(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude`  decimal(10,6) DEFAULT NULL COMMENT '经度',
  `status`     tinyint(1)   NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `create_time` datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`  bigint(20)   DEFAULT NULL,
  `update_by`  bigint(20)   DEFAULT NULL,
  `del_flag`   tinyint(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_city_name` (`city_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='城市表';

-- 景点表
CREATE TABLE IF NOT EXISTS `scenic_spot` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name`        varchar(128) NOT NULL COMMENT '景点名称',
  `city_id`     bigint(20)   NOT NULL COMMENT '所属城市',
  `address`     varchar(255) DEFAULT NULL COMMENT '详细地址',
  `latitude`    decimal(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude`   decimal(10,6) DEFAULT NULL COMMENT '经度',
  `intro`       text          DEFAULT NULL COMMENT '简介',
  `open_time`   varchar(128)  DEFAULT NULL COMMENT '开放时间描述',
  `ticket_info` varchar(255)  DEFAULT NULL COMMENT '门票信息',
  `price`       decimal(10,2) DEFAULT NULL COMMENT '门票价格',
  `image_url`   varchar(512)   DEFAULT NULL COMMENT '景点图片URL',
  `is_world_heritage` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否世界文化遗产：1是 0否',
  `suggested_visit_time` varchar(64) DEFAULT NULL COMMENT '建议游览时间',
  `score`       decimal(3,2)  DEFAULT 0.0 COMMENT '评分',
  `hot_score`   int(11)       DEFAULT 0 COMMENT '热度值',
  `is_recommend` tinyint(1)   NOT NULL DEFAULT 0 COMMENT '是否推荐：1是 0否',
  `create_time` datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`   bigint(20)    DEFAULT NULL,
  `update_by`   bigint(20)    DEFAULT NULL,
  `del_flag`    tinyint(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_scenic_city` (`city_id`),
  KEY `idx_scenic_hot` (`hot_score`),
  KEY `idx_scenic_recommend` (`is_recommend`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='景点表';

-- 美食表
CREATE TABLE IF NOT EXISTS `food` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name`        varchar(128) NOT NULL COMMENT '餐厅/美食名称',
  `city_id`     bigint(20)   NOT NULL COMMENT '所属城市',
  `address`     varchar(255) DEFAULT NULL COMMENT '地址',
  `latitude`    decimal(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude`   decimal(10,6) DEFAULT NULL COMMENT '经度',
  `food_type`   varchar(64)  DEFAULT NULL COMMENT '菜系/类型',
  `avg_price`   decimal(10,2) DEFAULT NULL COMMENT '人均消费',
  `intro`       text          DEFAULT NULL COMMENT '简介',
  `score`       decimal(3,2)  DEFAULT 0.0 COMMENT '评分',
  `hot_score`   int(11)       DEFAULT 0 COMMENT '热度值',
  `is_recommend` tinyint(1)   NOT NULL DEFAULT 0 COMMENT '是否推荐',
  `create_time` datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`   bigint(20)    DEFAULT NULL,
  `update_by`   bigint(20)    DEFAULT NULL,
  `del_flag`    tinyint(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_food_city` (`city_id`),
  KEY `idx_food_type` (`food_type`),
  KEY `idx_food_hot` (`hot_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='美食表';

-- 内容标签关联表
CREATE TABLE IF NOT EXISTS `content_tag` (
  `id`           bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `content_type` varchar(32) NOT NULL COMMENT '内容类型：note/scenic/food 等',
  `content_id`   bigint(20)  NOT NULL COMMENT '内容ID',
  `tag_id`       bigint(20)  NOT NULL COMMENT '标签ID',
  `create_time`  datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time`  datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`    bigint(20)  DEFAULT NULL,
  `update_by`    bigint(20)  DEFAULT NULL,
  `del_flag`     tinyint(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_content` (`content_type`, `content_id`),
  KEY `idx_tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容标签关联表';


/*========================
  3. 游记、图片、评论相关表
  ========================*/

-- 游记表
CREATE TABLE IF NOT EXISTS `travel_note` (
  `id`             bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`        bigint(20) NOT NULL COMMENT '作者用户ID',
  `title`          varchar(255) NOT NULL COMMENT '标题',
  `content`        longtext      DEFAULT NULL COMMENT '正文内容',
  `city_id`        bigint(20)    DEFAULT NULL COMMENT '城市ID',
  `city_name`      varchar(64)   DEFAULT NULL COMMENT '城市名称冗余',
  `status`         varchar(16)   NOT NULL DEFAULT 'pending' COMMENT '状态：draft/pending/pass/reject',
  `view_count`     int(11)       DEFAULT 0 COMMENT '浏览数',
  `like_count`     int(11)       DEFAULT 0 COMMENT '点赞数',
  `favorite_count` int(11)       DEFAULT 0 COMMENT '收藏数',
  `comment_count`  int(11)       DEFAULT 0 COMMENT '评论数',
  `is_featured`    tinyint(1)    NOT NULL DEFAULT 0 COMMENT '是否精选：1是 0否',
  `audit_remark`   varchar(500)  DEFAULT NULL COMMENT '审核备注（拒绝原因等）',
  `create_time`    datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`    datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`      bigint(20)    DEFAULT NULL,
  `update_by`      bigint(20)    DEFAULT NULL,
  `del_flag`       tinyint(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_note_user` (`user_id`),
  KEY `idx_note_city` (`city_id`),
  KEY `idx_note_status` (`status`),
  KEY `idx_note_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游记表';

-- 游记图片表
CREATE TABLE IF NOT EXISTS `travel_note_image` (
  `id`         bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `note_id`    bigint(20) NOT NULL COMMENT '游记ID',
  `url`        varchar(255) NOT NULL COMMENT '图片地址',
  `sort`       int(11)      DEFAULT 0 COMMENT '排序',
  `create_time` datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`  bigint(20)   DEFAULT NULL,
  `update_by`  bigint(20)   DEFAULT NULL,
  `del_flag`   tinyint(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_note_image_note` (`note_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游记图片表';

-- 游记-景点关联表
CREATE TABLE IF NOT EXISTS `note_scenic_ref` (
  `id`        bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `note_id`   bigint(20) NOT NULL COMMENT '游记ID',
  `scenic_id` bigint(20) NOT NULL COMMENT '景点ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by` bigint(20) DEFAULT NULL,
  `update_by` bigint(20) DEFAULT NULL,
  `del_flag`  tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_note_scenic` (`note_id`, `scenic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游记-景点关联表';

-- 评论表
CREATE TABLE IF NOT EXISTS `comment` (
  `id`           bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `content_type` varchar(32) NOT NULL COMMENT '被评论内容类型：note 等',
  `content_id`   bigint(20)  NOT NULL COMMENT '被评论内容ID',
  `user_id`      bigint(20)  NOT NULL COMMENT '评论用户ID',
  `content`      varchar(1000) NOT NULL COMMENT '评论内容',
  `parent_id`    bigint(20)  DEFAULT 0 COMMENT '父评论ID，0表示一级评论',
  `status`       tinyint(1)  NOT NULL DEFAULT 1 COMMENT '状态：1正常 0屏蔽',
  `like_count`   int(11)     DEFAULT 0 COMMENT '点赞数',
  `create_time`  datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time`  datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`    bigint(20)  DEFAULT NULL,
  `update_by`    bigint(20)  DEFAULT NULL,
  `del_flag`     tinyint(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_comment_content` (`content_type`, `content_id`),
  KEY `idx_comment_user` (`user_id`),
  KEY `idx_comment_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';


/*========================
  4. 旅游线路与行程相关表
  ========================*/

-- 旅游线路主表
CREATE TABLE IF NOT EXISTS `travel_route` (
  `id`             bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `route_name`     varchar(255) NOT NULL COMMENT '线路名称',
  `city_id`        bigint(20)   NOT NULL COMMENT '主要城市ID',
  `days`           int(11)      NOT NULL COMMENT '天数',
  `suitable_people` varchar(255) DEFAULT NULL COMMENT '适合人群描述',
  `source_type`    varchar(32) NOT NULL DEFAULT 'template' COMMENT '来源：template/system/custom',
  `summary`        varchar(1000) DEFAULT NULL COMMENT '行程概要',
  `cover_image`    varchar(255)  DEFAULT NULL COMMENT '封面图',
  `view_count`     int(11)       DEFAULT 0 COMMENT '浏览数',
  `favorite_count` int(11)       DEFAULT 0 COMMENT '收藏数',
  `use_count`      int(11)       DEFAULT 0 COMMENT '被规划次数',
  `create_time`    datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`    datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`      bigint(20)    DEFAULT NULL,
  `update_by`      bigint(20)    DEFAULT NULL,
  `del_flag`       tinyint(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_route_city` (`city_id`),
  KEY `idx_route_source` (`source_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='旅游线路主表';

-- 线路日程表
CREATE TABLE IF NOT EXISTS `travel_route_day` (
  `id`         bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `route_id`   bigint(20) NOT NULL COMMENT '线路ID',
  `day_no`     int(11)    NOT NULL COMMENT '第几天',
  `title`      varchar(255) DEFAULT NULL COMMENT '当日标题',
  `intro`      varchar(1000) DEFAULT NULL COMMENT '当日简介',
  `create_time` datetime   DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`  bigint(20)  DEFAULT NULL,
  `update_by`  bigint(20)  DEFAULT NULL,
  `del_flag`   tinyint(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_route_day` (`route_id`, `day_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线路日程表';

-- 线路日程明细表
CREATE TABLE IF NOT EXISTS `travel_route_poi` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `route_day_id` bigint(20) NOT NULL COMMENT '线路日程ID',
  `poi_type`    varchar(32) NOT NULL COMMENT '类型：scenic/food',
  `poi_id`      bigint(20)  NOT NULL COMMENT '景点或美食ID',
  `sort`        int(11)     NOT NULL DEFAULT 0 COMMENT '顺序',
  `stay_time`   int(11)     DEFAULT NULL COMMENT '预估停留时间（分钟）',
  `note`        varchar(500) DEFAULT NULL COMMENT '特别说明',
  `create_time` datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`   bigint(20)  DEFAULT NULL,
  `update_by`   bigint(20)  DEFAULT NULL,
  `del_flag`    tinyint(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_route_poi_day` (`route_day_id`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线路日程明细表';

-- 用户收藏行程表
CREATE TABLE IF NOT EXISTS `user_route_favorite` (
  `id`         bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`    bigint(20) NOT NULL COMMENT '用户ID',
  `route_id`   bigint(20) NOT NULL COMMENT '线路ID',
  `create_time` datetime  DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`  bigint(20) DEFAULT NULL,
  `update_by`  bigint(20) DEFAULT NULL,
  `del_flag`   tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_route` (`user_id`, `route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏行程表';


/*========================
  5. 打卡与行为记录
  ========================*/

-- 打卡记录表
CREATE TABLE IF NOT EXISTS `checkin_record` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`     bigint(20) NOT NULL COMMENT '用户ID',
  `target_type` varchar(32) NOT NULL COMMENT '目标类型：scenic/food',
  `target_id`   bigint(20)  NOT NULL COMMENT '目标ID',
  `photo_url`   varchar(255) DEFAULT NULL COMMENT '照片地址',
  `content`     varchar(1000) DEFAULT NULL COMMENT '文字描述',
  `latitude`    decimal(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude`   decimal(10,6) DEFAULT NULL COMMENT '经度',
  `checkin_time` datetime    DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间',
  `create_time`  datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time`  datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`    bigint(20)  DEFAULT NULL,
  `update_by`    bigint(20)  DEFAULT NULL,
  `del_flag`     tinyint(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_checkin_user` (`user_id`),
  KEY `idx_checkin_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打卡记录表';

-- 用户行为记录表
CREATE TABLE IF NOT EXISTS `user_behavior` (
  `id`            bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`       bigint(20) NOT NULL COMMENT '用户ID',
  `behavior_type` varchar(32) NOT NULL COMMENT '行为类型：view/like/favorite/checkin 等',
  `content_type`  varchar(32) NOT NULL COMMENT '内容类型：note/scenic/food/route',
  `content_id`    bigint(20)  NOT NULL COMMENT '内容ID',
  `score`         int(11)     DEFAULT 0 COMMENT '行为权重分值',
  `behavior_time` datetime    DEFAULT CURRENT_TIMESTAMP COMMENT '行为时间',
  `create_time`   datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time`   datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by`     bigint(20)  DEFAULT NULL,
  `update_by`     bigint(20)  DEFAULT NULL,
  `del_flag`      tinyint(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_behavior_user` (`user_id`),
  KEY `idx_behavior_content` (`content_type`, `content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户行为记录表';

-- 预留：推荐结果缓存表、统计快照表等，可根据需要后续追加

ALTER TABLE `scenic_spot`
    ADD COLUMN `province` varchar(50) NOT NULL DEFAULT '' COMMENT '省份',
  ADD COLUMN `city`     varchar(50) NOT NULL DEFAULT '' COMMENT '城市';



-- 打卡点配置表
CREATE TABLE IF NOT EXISTS `checkin_point` (
    `id`          bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`        varchar(128) NOT NULL COMMENT '打卡点名称',
    `target_type` varchar(32) NOT NULL COMMENT '目标类型：scenic/food',
    `target_id`   bigint(20) NOT NULL COMMENT '目标ID（景点ID或美食ID）',
    `target_name` varchar(128) DEFAULT NULL COMMENT '目标名称（冗余字段，方便查询）',
    `image_url`   varchar(255) DEFAULT NULL COMMENT '封面图片',
    `location`    varchar(255) DEFAULT NULL COMMENT '地点',
    `checkin_count` int(11) DEFAULT 0 COMMENT '打卡次数（统计字段）',
    `is_active`   tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用：1启用 0禁用',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `create_by`   bigint(20) DEFAULT NULL,
    `update_by`   bigint(20) DEFAULT NULL,
    `del_flag`    tinyint(1) NOT NULL DEFAULT 0 COMMENT '删除标记：0正常 1删除',
    PRIMARY KEY (`id`),
    KEY `idx_target` (`target_type`, `target_id`),
    KEY `idx_active` (`is_active`, `del_flag`),
    KEY `idx_name` (`name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打卡点配置表';



-- 活动表
CREATE TABLE IF NOT EXISTS `activity` (
                                          `id`                bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
                                          `name`              varchar(200) NOT NULL COMMENT '活动名称',
                                          `highlight`         varchar(500) DEFAULT NULL COMMENT '活动亮点',
                                          `description`       text COMMENT '活动介绍',
                                          `rules`             text COMMENT '活动规则',
                                          `image_url`         varchar(500) DEFAULT NULL COMMENT '封面图片',
                                          `start_time`        datetime DEFAULT NULL COMMENT '开始时间',
                                          `end_time`          datetime DEFAULT NULL COMMENT '结束时间',
                                          `status`            varchar(32) NOT NULL DEFAULT 'online' COMMENT '状态：online上线 offline下线 upcoming即将开始 ended已结束',
                                          `link_url`          varchar(500) DEFAULT NULL COMMENT '跳转链接（可选）',
                                          `related_route_ids` text COMMENT '关联路线ID列表（JSON数组）',
                                          `related_scenic_ids` text COMMENT '关联景点ID列表（JSON数组）',
                                          `related_food_ids`  text COMMENT '关联美食ID列表（JSON数组）',
                                          `related_note_ids`  text COMMENT '关联游记ID列表（JSON数组）',
                                          `create_time`       datetime DEFAULT CURRENT_TIMESTAMP,
                                          `update_time`       datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                          `create_by`         bigint(20) DEFAULT NULL,
                                          `update_by`         bigint(20) DEFAULT NULL,
                                          `del_flag`          tinyint(1) NOT NULL DEFAULT 0 COMMENT '删除标记：0正常 1删除',
                                          PRIMARY KEY (`id`),
                                          KEY `idx_activity_status` (`status`, `del_flag`),
                                          KEY `idx_activity_time` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动表';

-- 活动报名表
CREATE TABLE IF NOT EXISTS `activity_registration` (
  `id`                bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `activity_id`       bigint(20) NOT NULL COMMENT '活动ID',
  `user_id`           bigint(20) NOT NULL COMMENT '用户ID',
  `registration_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
  `create_time`       datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time`       datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag`          tinyint(1) NOT NULL DEFAULT 0 COMMENT '删除标记：0正常 1删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_activity_user` (`activity_id`, `user_id`, `del_flag`),
  KEY `idx_activity_id` (`activity_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名表';


CREATE TABLE IF NOT EXISTS `user_level` (
                                            `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
                                            `level` INT NOT NULL COMMENT '等级数字',
                                            `level_name` VARCHAR(50) NOT NULL COMMENT '等级名称（如：新手、达人、专家）',
    `min_experience` INT NOT NULL DEFAULT 0 COMMENT '最低经验值',
    `max_experience` INT NULL COMMENT '最高经验值（NULL表示无上限）',
    `medal_name` VARCHAR(50) NOT NULL COMMENT '勋章名称',
    `medal_icon` VARCHAR(20) NOT NULL COMMENT '勋章图标（emoji）',
    `description` VARCHAR(255) NULL COMMENT '等级描述',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `del_flag` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_level` (`level`, `del_flag`),
    KEY `idx_status` (`status`, `del_flag`),
    KEY `idx_experience` (`min_experience`, `max_experience`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户等级配置表';



-- 用户关注关系表
CREATE TABLE IF NOT EXISTS `user_follow` (
    `id`          bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     bigint(20) NOT NULL COMMENT '关注者ID',
    `followed_user_id` bigint(20) NOT NULL COMMENT '被关注者ID',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `del_flag`    tinyint(1) NOT NULL DEFAULT 0 COMMENT '删除标记：0正常 1删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_user_follow` (`user_id`, `followed_user_id`, `del_flag`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_followed_user_id` (`followed_user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注关系表';

-- 用户签到记录表
CREATE TABLE IF NOT EXISTS `user_checkin` (
    `id`          bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     bigint(20) NOT NULL COMMENT '用户ID',
    `checkin_date` date NOT NULL COMMENT '签到日期',
    `experience_gained` int(11) DEFAULT 10 COMMENT '获得经验值',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '签到时间',
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_user_date` (`user_id`, `checkin_date`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_checkin_date` (`checkin_date`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户签到记录表';






