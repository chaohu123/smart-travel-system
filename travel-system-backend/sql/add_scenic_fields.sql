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

-- 1. 故宫博物院
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('故宫博物院', '北京市', '北京市', 110000, '北京市东城区景山前街4号', 39.916345, 116.397155, '故宫是中国明清两代的皇家宫殿，旧称紫禁城，位于北京中轴线的中心。北京故宫以三大殿为中心，占地面积约72万平方米，建筑面积约15万平方米，有大小宫殿七十多座，房屋九千余间。', '4月1日-10月31日 周二至周日 08:30-17:00(停止售票16:00) 11月1日-3月31日 周二至周日 08:30-16:30(停止售票15:30)', '旺季60元/人，淡季40元/人', 60.00, 'https://example.com/gugong.jpg', 1, '3-4小时', 4.8, 9800, 1, NULL);

-- 2. 天安门广场
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('天安门广场', '北京市', '北京市', 110000, '北京市东城区东长安街', 39.903555, 116.397554, '天安门广场位于北京市中心，南北长880米，东西宽500米，面积达44万平方米，可容纳100万人举行盛大集会，是世界上最大的城市广场。', '全天开放', '免费开放', 0.00, 'https://example.com/tiananmen.jpg', 0, '1-2小时', 4.7, 9200, 1, '广场需安检进入');

-- 3. 天坛公园
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('天坛公园', '北京市', '北京市', 110000, '北京市东城区天坛路甲1号', 39.882078, 116.406605, '天坛公园是明清两代皇帝祭天祈谷的场所，是世界上现存规模最大、保存最完整的古代祭天建筑群。', '旺季(4月1日-10月31日) 06:00-22:00 淡季(11月1日-3月31日) 06:00-21:00', '联票34元/人，门票15元/人', 34.00, 'https://example.com/tiantan.jpg', 1, '2-3小时', 4.7, 8600, 1, NULL);

-- 4. 颐和园
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('颐和园', '北京市', '北京市', 110000, '北京市海淀区新建宫门路19号', 40.002426, 116.271522, '颐和园是中国清朝时期皇家园林，前身为清漪园，坐落在北京西郊，距城区十五公里，占地约二百九十公顷，与圆明园毗邻。', '旺季(4月1日-10月31日) 06:30-18:00 淡季(11月1日-3月31日) 07:00-17:00', '旺季30元/人，淡季20元/人', 30.00, 'https://example.com/summer_palace.jpg', 1, '4-5小时', 4.8, 9400, 1, NULL);

-- 5. 八达岭长城
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('八达岭长城', '北京市', '北京市', 110000, '北京市延庆区八达岭镇', 40.359316, 116.020011, '八达岭长城位于北京市延庆区军都山关沟古道北口，是中国古代伟大的防御工程万里长城的重要组成部分，是明长城的一个隘口。', '旺季(4月1日-10月31日) 06:30-19:00 淡季(11月1日-3月31日) 07:00-18:00', '旺季40元/人，淡季35元/人', 40.00, 'https://example.com/badaling.jpg', 1, '3-4小时', 4.6, 8900, 1, NULL);

-- 6. 圆明园遗址公园
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('圆明园遗址公园', '北京市', '北京市', 110000, '北京市海淀区清华西路28号', 40.010213, 116.296272, '圆明园又称圆明三园，是清代大型皇家园林，由圆明园、长春园和绮春园组成，也叫圆明三园，有"万园之园"之称。', '1月1日-3月15日、10月16日-12月31日 07:00-19:30 3月16日-4月30日、9月1日-10月15日 07:00-20:00 5月1日-8月31日 07:00-21:00', '大门票10元/人，遗址区15元/人', 25.00, 'https://example.com/yuanmingyuan.jpg', 0, '3-4小时', 4.5, 7800, 1, NULL);

-- 7. 北海公园
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('北海公园', '北京市', '北京市', 110000, '北京市西城区文津街1号', 39.924888, 116.388228, '北海公园是中国现存历史上建园最早、保存最完整、文化积淀最深厚的古典皇家园林，以琼华岛为中心。', '4月1日-10月31日 06:30-21:00 11月1日-3月31日 06:30-20:00', '旺季10元/人，淡季5元/人', 10.00, 'https://example.com/beihai.jpg', 0, '2-3小时', 4.6, 7500, 0, NULL);

-- 8. 恭王府
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('恭王府', '北京市', '北京市', 110000, '北京市西城区前海西街17号', 39.938175, 116.381972, '恭王府是清代规模最大的一座王府，曾先后作为和珅、永璘的宅邸，后恭亲王奕訢成为宅子的主人，恭王府的名称也因此得来。', '4月1日-10月31日 周二至周日 08:00-17:00 11月1日-3月31日 周二至周日 09:00-16:00', '40元/人', 40.00, 'https://example.com/gongwangfu.jpg', 0, '2-3小时', 4.6, 7200, 1, NULL);

-- 9. 雍和宫
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('雍和宫', '北京市', '北京市', 110000, '北京市东城区雍和宫大街12号', 39.949610, 116.417374, '雍和宫是北京地区规模最大、保存最完好的藏传佛教寺院之一，曾是雍正皇帝即位前的府邸。', '4月1日-10月31日 09:00-16:30 11月1日-3月31日 09:00-16:00', '25元/人', 25.00, 'https://example.com/yonghegong.jpg', 0, '1.5-2小时', 4.5, 6900, 0, NULL);

-- 10. 明十三陵
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('明十三陵', '北京市', '北京市', 110000, '北京市昌平区十三陵镇', 40.251545, 116.213662, '明十三陵是明朝迁都北京后13位皇帝陵寝的皇家陵寝的总称，是全国重点文物保护单位，世界文化遗产。', '旺季(4月1日-10月31日) 08:00-17:30 淡季(11月1日-3月31日) 08:30-16:30', '定陵60元/人，长陵45元/人，昭陵30元/人', 60.00, 'https://example.com/mingtombs.jpg', 1, '3-4小时', 4.4, 6800, 0, NULL);

-- 11. 慕田峪长城
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('慕田峪长城', '北京市', '北京市', 110000, '北京市怀柔区慕田峪村', 40.431900, 116.568400, '慕田峪长城是明长城的精华所在，其构筑有着独特的风格，这里敌楼密集，关隘险要，城两侧均有垛口。', '旺季(3月16日-11月15日) 07:00-18:00 淡季(11月16日-3月15日) 07:30-17:30', '40元/人，缆车单程100元/人，往返120元/人', 40.00, 'https://example.com/mutianyu.jpg', 1, '3-4小时', 4.7, 8100, 1, NULL);

-- 12. 鸟巢(国家体育场)
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('鸟巢(国家体育场)', '北京市', '北京市', 110000, '北京市朝阳区国家体育场南路1号', 39.992876, 116.396431, '国家体育场(鸟巢)是2008年北京奥运会的主体育场，举行了奥运会、残奥会开闭幕式、田径比赛及足球比赛决赛。', '旺季(4月-10月) 09:00-19:00 淡季(11月-3月) 09:00-17:30', '50元/人', 50.00, 'https://example.com/birdnest.jpg', 0, '1-2小时', 4.5, 7600, 1, NULL);

-- 13. 水立方(国家游泳中心)
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('水立方(国家游泳中心)', '北京市', '北京市', 110000, '北京市朝阳区天辰东路11号', 39.991272, 116.386615, '国家游泳中心(水立方)是2008年北京奥运会的标志性场馆之一，承担了游泳、跳水、花样游泳等水上比赛项目。', '旺季(5月-10月) 09:00-20:00 淡季(11月-4月) 09:00-18:00', '30元/人', 30.00, 'https://example.com/watercube.jpg', 0, '1-2小时', 4.4, 7300, 0, NULL);

-- 14. 什刹海
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('什刹海', '北京市', '北京市', 110000, '北京市西城区地安门西大街', 39.940895, 116.380981, '什刹海是北京城内面积最大、风貌保存最完整的一片历史街区，包括前海、后海和西海三个水域及邻近地区。', '全天开放', '免费开放', 0.00, 'https://example.com/shichahai.jpg', 0, '2-3小时', 4.6, 7700, 1, '免费开放区域');

-- 15. 南锣鼓巷
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('南锣鼓巷', '北京市', '北京市', 110000, '北京市东城区南锣鼓巷', 39.941260, 116.402550, '南锣鼓巷是北京最古老的街区之一，已有740多年的历史，是我国唯一完整保存着元代胡同院落肌理的棋盘式传统民居区。', '全天开放', '免费开放', 0.00, 'https://example.com/nanluoguxiang.jpg', 0, '1.5-2小时', 4.5, 8200, 1, '商业街区免费游览');

-- 16. 北京动物园
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('北京动物园', '北京市', '北京市', 110000, '北京市西城区西直门外大街137号', 39.941260, 116.338120, '北京动物园是中国开放最早、饲养动物种类最多的动物园，已有逾百年的历史，饲养展览动物500余种5000多只。', '旺季(4月1日-10月31日) 07:30-18:00 淡季(11月1日-3月31日) 07:30-17:00', '旺季15元/人，淡季10元/人', 15.00, 'https://example.com/beijingzoo.jpg', 0, '3-4小时', 4.4, 7100, 0, NULL);

-- 17. 香山公园
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('香山公园', '北京市', '北京市', 110000, '北京市海淀区买卖街40号', 39.994592, 116.195358, '香山公园是一座具有山林特色的皇家园林，公园内主峰香炉峰俗称"鬼见愁"，海拔575米，秋季红叶最为著名。', '4月1日-11月15日 06:00-18:30 11月16日-3月31日 06:00-18:00', '旺季10元/人，淡季5元/人', 10.00, 'https://example.com/xiangshan.jpg', 0, '3-4小时', 4.5, 7400, 0, NULL);

-- 18. 景山公园
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('景山公园', '北京市', '北京市', 110000, '北京市西城区景山前街44号', 39.924888, 116.395279, '景山公园坐落在明清北京城的中轴线上，西临北海，南与故宫神武门隔街相望，是明、清两代的御苑。', '4月1日-10月31日 06:00-21:00 11月1日-3月31日 06:30-20:00', '2元/人', 2.00, 'https://example.com/jingshan.jpg', 0, '1-2小时', 4.6, 6900, 0, NULL);

-- 19. 北京环球度假区
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('北京环球度假区', '北京市', '北京市', 110000, '北京市通州区北京环球度假区', 39.850000, 116.680000, '北京环球度假区是亚洲第三座、全球第五座环球影城主题乐园，包含七大主题景区、37处骑乘娱乐设施及地标景点。', '10:00-20:00(具体以当日公布时间为准)', '标准票528元/人，儿童票395元/人', 528.00, 'https://example.com/universal.jpg', 0, '全天', 4.7, 9500, 1, NULL);

-- 20. 中国国家博物馆
INSERT INTO `scenic_spot` (`name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`, `score`, `hot_score`, `is_recommend`, `free_notice`) VALUES
    ('中国国家博物馆', '北京市', '北京市', 110000, '北京市东城区东长安街16号', 39.904030, 116.403275, '中国国家博物馆是代表国家收藏、研究、展示、阐释中华文化代表性物证的最高历史文化艺术殿堂。', '周二至周日 09:00-17:00(16:00停止入馆)', '免费不免票，需提前预约', 0.00, 'https://example.com/nationalmuseum.jpg', 0, '3-4小时', 4.8, 8600, 1, '需提前1-7天预约，凭身份证入馆');


ALTER TABLE `city`
    MODIFY `id` BIGINT(20) NOT NULL COMMENT '主键';
