-- ============================================
-- 智能旅游系统 - 示例数据插入脚本（整合版）
-- 说明：
-- 1. 请先执行建表脚本 smart_travel_schema.sql，再执行本脚本
-- 2. 包含基础城市/用户/标签/景点/美食/游记/行为/行程/活动等示例数据
-- ============================================

SET NAMES utf8mb4;
USE smart_travel;

-- ========================
-- 1. 城市数据
-- ========================
INSERT IGNORE INTO `city` (`id`, `city_name`, `province`, `country`, `image_url`, `latitude`, `longitude`, `status`, `create_time`, `update_time`, `del_flag`) VALUES
(1, '成都', '四川省', '中国', 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', 30.662420, 104.063320, 1, NOW(), NOW(), 0),
(2, '西安', '陕西省', '中国', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800', 34.341270, 108.939840, 1, NOW(), NOW(), 0),
(3, '北京', '北京市', '中国', 'https://img95.699pic.com/photo/50175/1909.jpg_wh860.jpg', 39.904200, 116.407396, 1, NOW(), NOW(), 0),
(4, '上海', '上海市', '中国', 'https://images.pexels.com/photos/19885/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', 31.230416, 121.473701, 1, NOW(), NOW(), 0),
(5, '杭州', '浙江省', '中国', 'https://images.pexels.com/photos/399610/pexels-photo-399610.jpeg?auto=compress&cs=tinysrgb&w=800', 30.274084, 120.155070, 1, NOW(), NOW(), 0),
(6, '厦门', '福建省', '中国', 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800', 24.479834, 118.081871, 1, NOW(), NOW(), 0),
(7, '重庆', '重庆市', '中国', 'https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&w=800', 29.563009, 106.551556, 1, NOW(), NOW(), 0),
(8, '广州', '广东省', '中国', 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800', 23.129112, 113.264385, 1, NOW(), NOW(), 0);

-- ========================
-- 2. 用户数据（user.email 可为空）
-- ========================
INSERT IGNORE INTO `user` (`id`, `openid`, `nickname`, `avatar`, `gender`, `city`, `signature`, `status`, `note_count`, `favorite_count`, `checkin_count`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 'wx_openid_001', '旅行达人小王', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200', 1, '成都', '用脚步丈量世界，用镜头记录美好', 1, 5, 12, 8, NOW(), NOW(), 0),
(2, 'wx_openid_002', '美食探索者', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200', 2, '西安', '寻找城市里的每一道美味', 1, 3, 8, 15, NOW(), NOW(), 0),
(3, 'wx_openid_003', '城市漫游者', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', 1, '北京', '慢下来，发现身边的美好', 1, 4, 6, 10, NOW(), NOW(), 0),
(4, 'wx_openid_004', '摄影爱好者', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200', 2, '杭州', '用镜头捕捉每一个精彩瞬间', 1, 6, 10, 12, NOW(), NOW(), 0),
(5, 'wx_openid_005', '背包客', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200', 1, '厦门', '背上行囊，说走就走', 1, 2, 5, 6, NOW(), NOW(), 0);

-- ========================
-- 3. 标签数据
-- ========================
INSERT IGNORE INTO `tag` (`id`, `tag_name`, `tag_type`, `status`, `create_time`, `update_time`, `del_flag`) VALUES
(1, '美食', 'content', 1, NOW(), NOW(), 0),
(2, '历史', 'content', 1, NOW(), NOW(), 0),
(3, '自然', 'content', 1, NOW(), NOW(), 0),
(4, '亲子', 'content', 1, NOW(), NOW(), 0),
(5, '购物', 'content', 1, NOW(), NOW(), 0),
(6, '文化', 'content', 1, NOW(), NOW(), 0),
(7, '摄影', 'content', 1, NOW(), NOW(), 0),
(8, '休闲', 'content', 1, NOW(), NOW(), 0),
(9, '城市漫步', 'user', 1, NOW(), NOW(), 0),
(10, '美食探索', 'user', 1, NOW(), NOW(), 0);

-- ========================
-- 4. 景点示例数据
-- （与表结构兼容，未赋值的列将使用默认值）
-- ========================
INSERT IGNORE INTO `scenic_spot` (
  `id`, `name`, `province`, `city`, `city_id`, `address`, `latitude`, `longitude`, `intro`,
  `open_time`, `ticket_info`, `price`, `image_url`, `is_world_heritage`, `suggested_visit_time`,
  `score`, `hot_score`, `is_recommend`, `free_notice`, `create_time`, `update_time`, `del_flag`
) VALUES
(1, '宽窄巷子', '四川省', '成都', 1, '四川省成都市青羊区宽窄巷子', 30.670000, 104.050000, '宽窄巷子是成都历史文化保护区，由宽巷子、窄巷子和井巷子三条平行排列的城市老式街道及其之间的四合院群落组成。', '全天开放', '免费', 0.00, 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', 0, '2-3小时', 4.8, 9500, 1, NULL, NOW(), NOW(), 0),
(2, '大熊猫繁育研究基地', '四川省', '成都', 1, '四川省成都市成华区熊猫大道1375号', 30.740000, 104.150000, '成都大熊猫繁育研究基地，是中国政府实施大熊猫等濒危野生动物迁地保护工程的主要研究基地之一。', '07:30-18:00', '58元/人', 58.00, 'https://images.pexels.com/photos/3608263/pexels-photo-3608263.jpeg?auto=compress&cs=tinysrgb&w=800', 0, '3-4小时', 4.9, 12000, 1, NULL, NOW(), NOW(), 0),
(3, '锦里古街', '四川省', '成都', 1, '四川省成都市武侯区武侯祠大街231号', 30.650000, 104.040000, '锦里古街是成都知名的商业步行街，由一大片清末建筑风格的仿古建筑组成，拥有数量众多的酒吧、餐饮名店。', '全天开放', '免费', 0.00, 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800', 0, '1-2小时', 4.7, 8800, 1, NULL, NOW(), NOW(), 0),
(4, '兵马俑', '陕西省', '西安', 2, '陕西省西安市临潼区秦始皇帝陵博物院', 34.380000, 109.280000, '兵马俑即秦始皇兵马俑，是第一批全国重点文物保护单位和世界文化遗产。', '08:30-17:00', '120元/人', 120.00, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800', 1, '3-4小时', 4.9, 15000, 1, NULL, NOW(), NOW(), 0),
(5, '大雁塔', '陕西省', '西安', 2, '陕西省西安市雁塔区雁塔路', 34.220000, 108.960000, '大雁塔位于唐长安城晋昌坊的大慈恩寺内，是西安标志性历史建筑。', '08:00-17:30', '50元/人', 50.00, 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800', 1, '2-3小时', 4.6, 7500, 1, NULL, NOW(), NOW(), 0),
(6, '回民街', '陕西省', '西安', 2, '陕西省西安市莲湖区北院门', 34.260000, 108.940000, '西安回民街是西安著名的美食文化街区，也是体验古城烟火气的热门地点。', '全天开放', '免费', 0.00, 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800', 0, '1-2小时', 4.8, 11000, 1, NULL, NOW(), NOW(), 0),
(7, '天安门广场', '北京', '东城区', 3, '北京市东城区东长安街', 39.900000, 116.390000, '天安门广场位于北京市中心，北起天安门，南至正阳门，是北京最具代表性的城市广场。', '全天开放', '免费', 0.00, 'https://img95.699pic.com/photo/50175/1909.jpg_wh860.jpg', 0, '4-6小时', 4.9, 18130, 1, '需要预约', NOW(), NOW(), 0),
(8, '故宫博物院', '北京', '北京', 3, '北京市东城区景山前街4号', 39.920000, 116.400000, '北京故宫是中国明清两代的皇家宫殿，旧称紫禁城，位于北京中轴线的中心。', '08:30-17:00', '50元/人', 50.00, 'https://ts1.tc.mm.bing.net/th/id/R-C.862a99973d1eb2f58e149fbc87adbc1b?rik=T+rDw6T5q95Tcg&riu=http://img95.699pic.com/photo/50136/6765.jpg_wh860.jpg&ehk=ac1WolUyxiShxET4nmsBaUlRWZ9DDGzDE8eNMueOCZg=&risl=&pid=ImgRaw&r=0', 0, '3-4小时', 4.9, 20570, 1, NULL, NOW(), NOW(), 0),
(9, '西湖', '浙江省', '杭州', 5, '浙江省杭州市西湖区龙井路1号', 30.250000, 120.130000, '西湖位于杭州市区西部，是中国首批国家重点风景名胜区。', '全天开放', '免费', 0.00, 'https://images.pexels.com/photos/399610/pexels-photo-399610.jpeg?auto=compress&cs=tinysrgb&w=800', 1, '半天', 4.9, 16000, 1, NULL, NOW(), NOW(), 0),
(10, '鼓浪屿', '福建省', '厦门', 6, '福建省厦门市思明区鼓浪屿', 24.450000, 118.070000, '鼓浪屿是厦门著名小岛，以历史建筑、音乐文化和海岛风光闻名。', '全天开放', '上岛免费，部分景点收费', 0.00, 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800', 1, '半天', 4.8, 14000, 1, NULL, NOW(), NOW(), 0);

-- ========================
-- 5. 美食数据
-- ========================
INSERT IGNORE INTO `food` (
  `id`, `name`, `city_id`, `address`, `latitude`, `longitude`,
  `food_type`, `avg_price`, `intro`, `image_url`, `score`, `hot_score`, `is_recommend`,
  `create_time`, `update_time`, `del_flag`
) VALUES
(1, '龙抄手总店', 1, '四川省成都市锦江区春熙路', 30.660000, 104.080000, '川菜', 35.00, '成都著名小吃店，以抄手闻名，是成都老字号。', 'https://images.pexels.com/photos/5409010/pexels-photo-5409010.jpeg?auto=compress&cs=tinysrgb&w=800', 4.7, 8500, 1, NOW(), NOW(), 0),
(2, '陈麻婆豆腐', 1, '四川省成都市青羊区西玉龙街', 30.670000, 104.060000, '川菜', 60.00, '麻婆豆腐的创始店，百年老字号，正宗川菜代表。', 'https://images.pexels.com/photos/5409009/pexels-photo-5409009.jpeg?auto=compress&cs=tinysrgb&w=800', 4.8, 9200, 1, NOW(), NOW(), 0),
(3, '老孙家羊肉泡馍', 2, '陕西省西安市莲湖区东关正街', 34.260000, 108.950000, '陕西菜', 45.00, '西安著名羊肉泡馍店，百年老字号，味道正宗。', 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800', 4.7, 7800, 1, NOW(), NOW(), 0),
(4, '德发长饺子馆', 2, '陕西省西安市碑林区钟楼', 34.260000, 108.940000, '陕西菜', 50.00, '西安老字号饺子馆，以多种馅料的饺子闻名。', 'https://images.pexels.com/photos/5409015/pexels-photo-5409015.jpeg?auto=compress&cs=tinysrgb&w=800', 4.6, 6500, 1, NOW(), NOW(), 0),
(5, '全聚德烤鸭店', 3, '北京市东城区前门大街', 39.900000, 116.390000, '北京菜', 200.00, '北京著名烤鸭店，中华老字号，以北京烤鸭闻名。', 'https://images.pexels.com/photos/11113182/pexels-photo-11113182.jpeg?auto=compress&cs=tinysrgb&w=800', 4.8, 15000, 1, NOW(), NOW(), 0),
(6, '东来顺', 3, '北京市东城区王府井大街', 39.910000, 116.420000, '北京菜', 180.00, '北京著名涮羊肉店，百年老字号，以涮羊肉闻名。', 'https://images.pexels.com/photos/5773965/pexels-photo-5773965.jpeg?auto=compress&cs=tinysrgb&w=800', 4.7, 12000, 1, NOW(), NOW(), 0),
(7, '楼外楼', 5, '浙江省杭州市西湖区孤山路30号', 30.250000, 120.130000, '杭帮菜', 150.00, '杭州著名餐厅，以西湖醋鱼、东坡肉等杭帮菜闻名。', 'https://images.pexels.com/photos/5409022/pexels-photo-5409022.jpeg?auto=compress&cs=tinysrgb&w=800', 4.8, 11000, 1, NOW(), NOW(), 0),
(8, '张三疯奶茶店', 6, '福建省厦门市思明区鼓浪屿', 24.450000, 118.070000, '饮品', 25.00, '鼓浪屿网红奶茶店，以特色奶茶和欧式装修风格闻名。', 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800', 4.5, 6800, 1, NOW(), NOW(), 0);

-- ========================
-- 6. 游记数据（节选内容，实际项目可保留完整长文）
-- ========================
INSERT IGNORE INTO `travel_note` (`id`, `user_id`, `title`, `content`, `city_id`, `city_name`, `status`, `view_count`, `like_count`, `favorite_count`, `comment_count`, `is_featured`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, '成都三日游：慢生活，品美食', '成都，一座来了就不想离开的城市。这次三天两夜的成都之旅，让我深深爱上了这座城市的慢节奏和美食文化。...', 1, '成都', 'pass', 1250, 89, 45, 12, 1, NOW(), NOW(), 0),
(2, 2, '西安美食之旅：探寻千年古都的味道', '西安，这座有着三千年历史的古都，不仅有着深厚的历史文化底蕴，更有着让人垂涎欲滴的美食。...', 2, '西安', 'pass', 980, 76, 38, 9, 1, NOW(), NOW(), 0),
(3, 3, '北京初印象：古都新韵', '第一次来北京，就被这座城市的魅力深深吸引。作为中国的首都，北京既有深厚的历史底蕴，又有现代化的都市风貌。...', 3, '北京', 'pass', 1560, 112, 58, 15, 1, NOW(), NOW(), 0),
(4, 4, '杭州西湖：诗画江南', '上有天堂，下有苏杭。这次来到杭州，真正体会到了这句话的含义。...', 5, '杭州', 'pass', 890, 65, 32, 8, 0, NOW(), NOW(), 0),
(5, 5, '厦门鼓浪屿：文艺小岛之旅', '鼓浪屿，这座充满文艺气息的小岛，是我一直向往的地方。...', 6, '厦门', 'pass', 720, 54, 28, 6, 0, NOW(), NOW(), 0);

-- ========================
-- 7. 游记图片数据
-- ========================
INSERT IGNORE INTO `travel_note_image` (`id`, `note_id`, `url`, `sort`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', 1, NOW(), NOW(), 0),
(2, 1, 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800', 2, NOW(), NOW(), 0),
(3, 1, 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800', 3, NOW(), NOW(), 0),
(4, 2, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800', 1, NOW(), NOW(), 0),
(5, 2, 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800', 2, NOW(), NOW(), 0),
(6, 3, 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800', 1, NOW(), NOW(), 0),
(7, 3, 'https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&w=800', 2, NOW(), NOW(), 0),
(8, 4, 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', 1, NOW(), NOW(), 0),
(9, 5, 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800', 1, NOW(), NOW(), 0);

-- ========================
-- 8. 游记-景点关联数据
-- ========================
INSERT IGNORE INTO `note_scenic_ref` (`id`, `note_id`, `scenic_id`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 1, NOW(), NOW(), 0),
(2, 1, 2, NOW(), NOW(), 0),
(3, 1, 3, NOW(), NOW(), 0),
(4, 2, 4, NOW(), NOW(), 0),
(5, 2, 5, NOW(), NOW(), 0),
(6, 2, 6, NOW(), NOW(), 0),
(7, 3, 7, NOW(), NOW(), 0),
(8, 3, 8, NOW(), NOW(), 0),
(9, 4, 9, NOW(), NOW(), 0),
(10, 5, 10, NOW(), NOW(), 0);

-- ========================
-- 9. 内容标签关联数据
-- ========================
INSERT IGNORE INTO `content_tag` (`id`, `content_type`, `content_id`, `tag_id`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 'note', 1, 1, NOW(), NOW(), 0),
(2, 'note', 1, 6, NOW(), NOW(), 0),
(3, 'note', 2, 1, NOW(), NOW(), 0),
(4, 'note', 2, 2, NOW(), NOW(), 0),
(5, 'note', 3, 2, NOW(), NOW(), 0),
(6, 'note', 3, 6, NOW(), NOW(), 0),
(7, 'note', 4, 3, NOW(), NOW(), 0),
(8, 'note', 4, 7, NOW(), NOW(), 0),
(9, 'note', 5, 3, NOW(), NOW(), 0),
(10, 'note', 5, 7, NOW(), NOW(), 0),
(11, 'scenic', 1, 6, NOW(), NOW(), 0),
(12, 'scenic', 2, 3, NOW(), NOW(), 0),
(13, 'scenic', 4, 2, NOW(), NOW(), 0),
(14, 'food', 1, 1, NOW(), NOW(), 0),
(15, 'food', 2, 1, NOW(), NOW(), 0);

-- ========================
-- 10. 评论数据
-- ========================
INSERT IGNORE INTO `comment` (`id`, `content_type`, `content_id`, `user_id`, `content`, `parent_id`, `status`, `like_count`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 'note', 1, 2, '成都的美食真的太多了，我也想去！', 0, 1, 5, NOW(), NOW(), 0),
(2, 'note', 1, 3, '宽窄巷子确实很有特色，值得一去。', 0, 1, 3, NOW(), NOW(), 0),
(3, 'note', 2, 1, '西安的羊肉泡馍我也吃过，味道确实不错！', 0, 1, 4, NOW(), NOW(), 0),
(4, 'note', 3, 4, '故宫真的很震撼，我也想去看看。', 0, 1, 6, NOW(), NOW(), 0),
(5, 'note', 4, 5, '西湖的美景确实让人流连忘返。', 0, 1, 2, NOW(), NOW(), 0);

-- ========================
-- 11. 用户行为记录数据
-- ========================
INSERT IGNORE INTO `user_behavior` (`id`, `user_id`, `behavior_type`, `content_type`, `content_id`, `score`, `behavior_time`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 'view', 'note', 2, 1, NOW(), NOW(), NOW(), 0),
(2, 1, 'like', 'note', 2, 3, NOW(), NOW(), NOW(), 0),
(3, 2, 'view', 'note', 1, 1, NOW(), NOW(), NOW(), 0),
(4, 2, 'favorite', 'note', 1, 5, NOW(), NOW(), NOW(), 0),
(5, 3, 'view', 'scenic', 1, 1, NOW(), NOW(), NOW(), 0),
(6, 3, 'view', 'scenic', 2, 1, NOW(), NOW(), NOW(), 0),
(7, 4, 'view', 'food', 1, 1, NOW(), NOW(), NOW(), 0),
(8, 4, 'checkin', 'scenic', 9, 10, NOW(), NOW(), NOW(), 0);

-- ========================
-- 12. 打卡记录数据
-- ========================
INSERT IGNORE INTO `checkin_record` (`id`, `user_id`, `target_type`, `target_id`, `photo_url`, `content`, `latitude`, `longitude`, `checkin_time`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 'scenic', 1, 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', '宽窄巷子打卡！', 30.670000, 104.050000, NOW(), NOW(), NOW(), 0),
(2, 1, 'scenic', 2, 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800', '大熊猫基地，太可爱了！', 30.740000, 104.150000, NOW(), NOW(), NOW(), 0),
(3, 2, 'food', 3, 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800', '老孙家羊肉泡馍，味道正宗！', 34.260000, 108.950000, NOW(), NOW(), NOW(), 0),
(4, 3, 'scenic', 7, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800', '天安门广场，庄严神圣！', 39.900000, 116.390000, NOW(), NOW(), NOW(), 0),
(5, 4, 'scenic', 9, 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800', '西湖美景，诗画江南！', 30.250000, 120.130000, NOW(), NOW(), NOW(), 0);

-- ========================
-- 13. 用户兴趣标签关联数据
-- ========================
INSERT IGNORE INTO `user_tag` (`id`, `user_id`, `tag_id`, `weight`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 1, 10, NOW(), NOW(), 0),
(2, 1, 6, 8, NOW(), NOW(), 0),
(3, 2, 1, 10, NOW(), NOW(), 0),
(4, 2, 2, 7, NOW(), NOW(), 0),
(5, 3, 9, 9, NOW(), NOW(), 0),
(6, 4, 7, 10, NOW(), NOW(), 0),
(7, 4, 3, 8, NOW(), NOW(), 0),
(8, 5, 3, 9, NOW(), NOW(), 0);

-- ========================
-- 14. 旅游线路与日程数据
-- ========================
INSERT IGNORE INTO `travel_route` (`id`, `route_name`, `city_id`, `days`, `suitable_people`, `source_type`, `summary`, `cover_image`, `view_count`, `favorite_count`, `use_count`, `ai_used`, `create_time`, `update_time`, `del_flag`) VALUES
(1, '成都三日游经典路线', 1, 3, '适合所有人群', 'template', '宽窄巷子-大熊猫基地-锦里古街，体验成都慢生活', 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', 320, 45, 12, 0, NOW(), NOW(), 0),
(2, '西安历史文化之旅', 2, 2, '适合历史爱好者', 'template', '兵马俑-大雁塔-回民街，感受千年古都魅力', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800', 280, 38, 8, 0, NOW(), NOW(), 0);

INSERT IGNORE INTO `travel_route_day` (`id`, `route_id`, `day_no`, `title`, `intro`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 1, '第一天：宽窄巷子', '上午游览宽窄巷子，下午品尝成都美食', NOW(), NOW(), 0),
(2, 1, 2, '第二天：大熊猫基地', '全天游览大熊猫繁育研究基地', NOW(), NOW(), 0),
(3, 1, 3, '第三天：锦里古街', '上午游览锦里古街，下午自由活动', NOW(), NOW(), 0),
(4, 2, 1, '第一天：兵马俑', '上午参观兵马俑，下午返回市区', NOW(), NOW(), 0),
(5, 2, 2, '第二天：大雁塔和回民街', '上午游览大雁塔，下午在回民街品尝美食', NOW(), NOW(), 0);

INSERT IGNORE INTO `travel_route_poi` (`id`, `route_day_id`, `poi_type`, `poi_id`, `sort`, `stay_time`, `note`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 'scenic', 1, 1, 180, '宽窄巷子游览，建议游玩3小时', NOW(), NOW(), 0),
(2, 1, 'food', 1, 2, 60, '龙抄手总店用餐', NOW(), NOW(), 0),
(3, 2, 'scenic', 2, 1, 240, '大熊猫基地，建议游玩4小时', NOW(), NOW(), 0),
(4, 3, 'scenic', 3, 1, 120, '锦里古街游览，建议游玩2小时', NOW(), NOW(), 0),
(5, 4, 'scenic', 4, 1, 240, '兵马俑参观，建议游玩4小时', NOW(), NOW(), 0),
(6, 5, 'scenic', 5, 1, 120, '大雁塔游览，建议游玩2小时', NOW(), NOW(), 0),
(7, 5, 'food', 3, 2, 90, '回民街品尝美食', NOW(), NOW(), 0);

-- ========================
-- 15. 活动专题示例数据（节选）
-- ========================
INSERT INTO `activity` (
  `name`, `highlight`, `description`, `rules`, `image_url`,
  `start_time`, `end_time`, `status`,
  `related_route_ids`, `related_scenic_ids`, `related_food_ids`, `related_note_ids`,
  `del_flag`
) VALUES
('国庆长假 · 城市周边游',
 '精选3条周边线路，带你探索城市周边的美丽风景',
 '国庆长假即将到来，你是否已经计划好了出行路线？我们精心挑选了3条城市周边游线路，涵盖自然风光、历史文化、美食体验等多种主题，让你在假期中充分放松身心，享受旅行的乐趣。每条线路都经过精心设计，适合不同兴趣的旅行者。',
 '1. 活动时间为2025年10月1日至10月7日\n2. 参与活动需要完成指定打卡点打卡\n3. 完成所有打卡任务可获得精美礼品\n4. 活动最终解释权归平台所有',
 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800',
 '2025-10-01 00:00:00', '2025-10-07 23:59:59', 'online',
 '[1, 2, 3]', '[1, 2, 3]', '[1, 2]', '[1, 2]', 0),
('本地周末 · 亲子特辑',
 '亲子标签线路+热门景点，适合全家出游',
 '周末不知道带孩子去哪里？我们为您准备了多条亲子友好线路，包含适合儿童的景点、互动体验项目和美食推荐。让您和孩子一起度过愉快的周末时光，在游玩中增进亲子关系。',
 '1. 活动长期有效\n2. 建议提前预约热门景点\n3. 部分景点有儿童优惠政策\n4. 注意安全，照顾好孩子',
 'https://images.pexels.com/photos/1591055/pexels-photo-1591055.jpeg?auto=compress&cs=tinysrgb&w=800',
 NULL, NULL, 'online',
 '[2, 4]', '[1, 2, 4]', '[2, 3]', '[3, 4]', 0);

-- ========================
-- 完成提示
-- ========================

-- ========================
-- 16. 用户等级配置数据
-- ========================
INSERT IGNORE INTO `user_level` (`id`, `level`, `level_name`, `min_experience`, `max_experience`, `medal_name`, `medal_icon`, `description`, `status`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, '旅行新手', 0, 99, '初来乍到', 'seedling', '完成注册，开启旅行记录。', 1, NOW(), NOW(), 0),
(2, 2, '城市探索者', 100, 299, '城市探索者', 'map-pin', '开始探索不同城市的景点与美食。', 1, NOW(), NOW(), 0),
(3, 3, '旅行达人', 300, 699, '旅行达人', 'compass', '拥有丰富的浏览、收藏与打卡记录。', 1, NOW(), NOW(), 0),
(4, 4, '资深玩家', 700, 1499, '资深玩家', 'medal', '持续分享路线与游记。', 1, NOW(), NOW(), 0),
(5, 5, '旅行专家', 1500, NULL, '旅行专家', 'crown', '平台中的高活跃旅行用户。', 1, NOW(), NOW(), 0);
SELECT '初始化示例数据插入完成！' AS message;
