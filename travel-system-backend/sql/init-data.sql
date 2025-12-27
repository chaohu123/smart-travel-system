-- 智能旅游系统初始化数据脚本
-- 使用前请确保已执行 smart_travel_schema.sql 创建表结构

SET NAMES utf8mb4;
USE smart_travel;

-- ========================
-- 1. 城市数据
-- ========================
INSERT IGNORE INTO `city` (`id`, `city_name`, `province`, `country`, `latitude`, `longitude`, `status`, `create_time`, `update_time`, `del_flag`) VALUES
(1, '成都', '四川省', '中国', 30.662420, 104.063320, 1, NOW(), NOW(), 0),
(2, '西安', '陕西省', '中国', 34.341270, 108.939840, 1, NOW(), NOW(), 0),
(3, '北京', '北京市', '中国', 39.904200, 116.407396, 1, NOW(), NOW(), 0),
(4, '上海', '上海市', '中国', 31.230416, 121.473701, 1, NOW(), NOW(), 0),
(5, '杭州', '浙江省', '中国', 30.274084, 120.155070, 1, NOW(), NOW(), 0),
(6, '厦门', '福建省', '中国', 24.479834, 118.081871, 1, NOW(), NOW(), 0),
(7, '重庆', '重庆市', '中国', 29.563009, 106.551556, 1, NOW(), NOW(), 0),
(8, '广州', '广东省', '中国', 23.129112, 113.264385, 1, NOW(), NOW(), 0);

-- ========================
-- 2. 用户数据
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
-- 4. 景点数据
-- ========================
INSERT IGNORE INTO `scenic_spot` (`id`, `name`, `city_id`, `address`, `latitude`, `longitude`, `intro`, `open_time`, `ticket_info`, `score`, `hot_score`, `is_recommend`, `create_time`, `update_time`, `del_flag`) VALUES
(1, '宽窄巷子', 1, '四川省成都市青羊区宽窄巷子', 30.670000, 104.050000, '宽窄巷子是成都历史文化保护区，由宽巷子、窄巷子和井巷子三条平行排列的城市老式街道及其之间的四合院群落组成。', '全天开放', '免费', 4.8, 9500, 1, NOW(), NOW(), 0),
(2, '大熊猫繁育研究基地', 1, '四川省成都市成华区熊猫大道1375号', 30.740000, 104.150000, '成都大熊猫繁育研究基地，是中国政府实施大熊猫等濒危野生动物迁地保护工程的主要研究基地之一。', '07:30-18:00', '58元/人', 4.9, 12000, 1, NOW(), NOW(), 0),
(3, '锦里古街', 1, '四川省成都市武侯区武侯祠大街231号', 30.650000, 104.040000, '锦里古街是成都知名的商业步行街，由一大片清末建筑风格的仿古建筑组成，拥有数量众多的酒吧、餐饮名店。', '全天开放', '免费', 4.7, 8800, 1, NOW(), NOW(), 0),
(4, '兵马俑', 2, '陕西省西安市临潼区秦始皇帝陵博物院', 34.380000, 109.280000, '兵马俑，即秦始皇兵马俑，亦简称秦兵马俑或秦俑，第一批全国重点文物保护单位，第一批中国世界遗产。', '08:30-17:00', '120元/人', 4.9, 15000, 1, NOW(), NOW(), 0),
(5, '大雁塔', 2, '陕西省西安市雁塔区雁塔路', 34.220000, 108.960000, '大雁塔位于唐长安城晋昌坊（今陕西省西安市南）的大慈恩寺内，又名"慈恩寺塔"。', '08:00-17:30', '50元/人', 4.6, 7500, 1, NOW(), NOW(), 0),
(6, '回民街', 2, '陕西省西安市莲湖区北院门', 34.260000, 108.940000, '西安回民街是西安著名的美食文化街区，是西安小吃街区。', '全天开放', '免费', 4.8, 11000, 1, NOW(), NOW(), 0),
(7, '天安门广场', 3, '北京市东城区东长安街', 39.900000, 116.390000, '天安门广场，位于北京市中心，地处北京市东城区东长安街，北起天安门，南至正阳门，东起中国国家博物馆，西至人民大会堂。', '全天开放', '免费', 4.9, 18000, 1, NOW(), NOW(), 0),
(8, '故宫博物院', 3, '北京市东城区景山前街4号', 39.920000, 116.400000, '北京故宫是中国明清两代的皇家宫殿，旧称紫禁城，位于北京中轴线的中心。', '08:30-17:00', '60元/人', 4.9, 20000, 1, NOW(), NOW(), 0),
(9, '西湖', 5, '浙江省杭州市西湖区', 30.250000, 120.130000, '西湖，位于浙江省杭州市西湖区龙井路1号，杭州市区西部，是中国主要的观赏性淡水湖泊，也是中国首批国家重点风景名胜区。', '全天开放', '免费', 4.9, 16000, 1, NOW(), NOW(), 0),
(10, '鼓浪屿', 6, '福建省厦门市思明区', 24.450000, 118.070000, '鼓浪屿，原名"圆沙洲"，别名"圆洲仔"，南宋时期名"五龙屿"，明朝改称"鼓浪屿"。', '全天开放', '上岛免费，部分景点收费', 4.8, 14000, 1, NOW(), NOW(), 0);

-- ========================
-- 5. 美食数据
-- ========================
INSERT IGNORE INTO `food` (`id`, `name`, `city_id`, `address`, `latitude`, `longitude`, `food_type`, `avg_price`, `intro`, `score`, `hot_score`, `is_recommend`, `create_time`, `update_time`, `del_flag`) VALUES
(1, '龙抄手总店', 1, '四川省成都市锦江区春熙路', 30.660000, 104.080000, '川菜', 35.00, '成都著名小吃店，以抄手（馄饨）闻名，是成都老字号。', 4.7, 8500, 1, NOW(), NOW(), 0),
(2, '陈麻婆豆腐', 1, '四川省成都市青羊区西玉龙街', 30.670000, 104.060000, '川菜', 60.00, '麻婆豆腐的创始店，百年老字号，正宗川菜代表。', 4.8, 9200, 1, NOW(), NOW(), 0),
(3, '老孙家羊肉泡馍', 2, '陕西省西安市莲湖区东关正街', 34.260000, 108.950000, '陕西菜', 45.00, '西安著名羊肉泡馍店，百年老字号，味道正宗。', 4.7, 7800, 1, NOW(), NOW(), 0),
(4, '德发长饺子馆', 2, '陕西省西安市碑林区钟楼', 34.260000, 108.940000, '陕西菜', 50.00, '西安老字号饺子馆，以各种馅料的饺子闻名。', 4.6, 6500, 1, NOW(), NOW(), 0),
(5, '全聚德烤鸭店', 3, '北京市东城区前门大街', 39.900000, 116.390000, '北京菜', 200.00, '北京著名烤鸭店，中华老字号，以北京烤鸭闻名。', 4.8, 15000, 1, NOW(), NOW(), 0),
(6, '东来顺', 3, '北京市东城区王府井大街', 39.910000, 116.420000, '北京菜', 180.00, '北京著名涮羊肉店，百年老字号，以涮羊肉闻名。', 4.7, 12000, 1, NOW(), NOW(), 0),
(7, '楼外楼', 5, '浙江省杭州市西湖区孤山路30号', 30.250000, 120.130000, '杭帮菜', 150.00, '杭州著名餐厅，以西湖醋鱼、东坡肉等杭帮菜闻名。', 4.8, 11000, 1, NOW(), NOW(), 0),
(8, '张三疯奶茶店', 6, '福建省厦门市思明区鼓浪屿', 24.450000, 118.070000, '饮品', 25.00, '鼓浪屿网红奶茶店，以特色奶茶和欧式装修风格闻名。', 4.5, 6800, 1, NOW(), NOW(), 0);

-- ========================
-- 6. 游记数据
-- ========================
INSERT IGNORE INTO `travel_note` (`id`, `user_id`, `title`, `content`, `city_id`, `city_name`, `status`, `view_count`, `like_count`, `favorite_count`, `comment_count`, `is_featured`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, '成都三日游：慢生活，品美食', '成都，一座来了就不想离开的城市。这次三天两夜的成都之旅，让我深深爱上了这座城市的慢节奏和美食文化。

第一天，我来到了宽窄巷子。这里保留了老成都的韵味，青砖黛瓦，古色古香。漫步在巷子里，品尝着各种小吃，感受着成都的悠闲生活。

第二天，我去了大熊猫繁育研究基地。看到那些可爱的国宝，心情瞬间被治愈了。它们憨态可掬的样子，让人忍不住想多拍几张照片。

第三天，我来到了锦里古街。这里不仅有各种美食，还有传统的手工艺品。我买了一些纪念品，也品尝了正宗的川菜。

成都的美食真的太多了，火锅、串串、担担面、龙抄手...每一道都让人回味无穷。这次旅行让我真正体验到了成都的慢生活，也让我更加热爱这座城市。', 1, '成都', 'pass', 1250, 89, 45, 12, 1, NOW(), NOW(), 0),
(2, 2, '西安美食之旅：探寻千年古都的味道', '西安，这座有着三千年历史的古都，不仅有着深厚的历史文化底蕴，更有着让人垂涎欲滴的美食。

回民街是西安美食的集中地，这里汇集了各种陕西特色小吃。羊肉泡馍、肉夹馍、凉皮、胡辣汤...每一种都让我流连忘返。

除了美食，我还参观了兵马俑和大雁塔。站在兵马俑面前，仿佛穿越回了秦朝，感受到了古代工匠的精湛技艺。

大雁塔的夜景特别美，灯光映照下的古塔，显得格外庄严肃穆。在这里，我感受到了西安这座城市的厚重历史。

西安的美食文化源远流长，每一道菜都有着深厚的历史背景。这次旅行不仅满足了我的味蕾，更让我对西安的历史文化有了更深的了解。', 2, '西安', 'pass', 980, 76, 38, 9, 1, NOW(), NOW(), 0),
(3, 3, '北京初印象：古都新韵', '第一次来北京，就被这座城市的魅力深深吸引。作为中国的首都，北京既有深厚的历史底蕴，又有现代化的都市风貌。

天安门广场是每个来北京的人必去的地方。站在广场上，看着庄严的天安门城楼，心中涌起一股自豪感。

故宫博物院更是让我震撼。走进紫禁城，仿佛穿越回了明清时代。每一座宫殿，每一件文物，都诉说着历史的沧桑。

除了历史古迹，北京的美食也让我印象深刻。全聚德的烤鸭、东来顺的涮羊肉，都是不可错过的美味。

北京的胡同文化也很有特色。骑着共享单车穿梭在胡同里，感受着老北京的生活气息，别有一番风味。

这次北京之行让我对这座城市有了更深的了解，也让我更加热爱我们的首都。', 3, '北京', 'pass', 1560, 112, 58, 15, 1, NOW(), NOW(), 0),
(4, 4, '杭州西湖：诗画江南', '上有天堂，下有苏杭。这次来到杭州，真正体会到了这句话的含义。

西湖的美，是那种温婉的美，是那种诗意的美。漫步在苏堤上，看着湖光山色，心情格外宁静。

断桥残雪、三潭印月、雷峰夕照...每一个景点都有着美丽的传说，让人流连忘返。

除了西湖，我还品尝了正宗的杭帮菜。楼外楼的西湖醋鱼、东坡肉，每一道都让我回味无穷。

杭州的茶文化也很浓厚。在龙井村品茶，感受着茶香，看着茶园的美景，是一种难得的享受。

这次杭州之行让我真正感受到了江南的韵味，也让我更加热爱这座美丽的城市。', 5, '杭州', 'pass', 890, 65, 32, 8, 0, NOW(), NOW(), 0),
(5, 5, '厦门鼓浪屿：文艺小岛之旅', '鼓浪屿，这座充满文艺气息的小岛，是我一直向往的地方。

岛上的建筑风格多样，有欧式、日式、中式，每一座建筑都有着独特的故事。漫步在小巷里，仿佛置身于一个童话世界。

岛上的美食也很有特色。张三疯奶茶店的奶茶、各种海鲜小吃，都让我印象深刻。

最让我难忘的是岛上的音乐文化。鼓浪屿被称为"钢琴之岛"，到处都能听到悠扬的钢琴声。

在岛上住了两晚，每天清晨被海浪声唤醒，晚上听着音乐入睡，这种生活真的很惬意。

鼓浪屿的美，是那种慢节奏的美，是那种文艺的美。这次旅行让我真正体验到了小岛生活的悠闲与美好。', 6, '厦门', 'pass', 720, 54, 28, 6, 0, NOW(), NOW(), 0);

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
-- 14. 旅游线路数据（示例）
-- ========================
INSERT IGNORE INTO `travel_route` (`id`, `route_name`, `city_id`, `days`, `suitable_people`, `source_type`, `summary`, `cover_image`, `view_count`, `favorite_count`, `use_count`, `create_time`, `update_time`, `del_flag`) VALUES
(1, '成都三日游经典路线', 1, 3, '适合所有人群', 'template', '宽窄巷子-大熊猫基地-锦里古街，体验成都慢生活', 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', 320, 45, 12, NOW(), NOW(), 0),
(2, '西安历史文化之旅', 2, 2, '适合历史爱好者', 'template', '兵马俑-大雁塔-回民街，感受千年古都魅力', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800', 280, 38, 8, NOW(), NOW(), 0);

-- ========================
-- 15. 线路日程数据
-- ========================
INSERT IGNORE INTO `travel_route_day` (`id`, `route_id`, `day_no`, `title`, `intro`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 1, '第一天：宽窄巷子', '上午游览宽窄巷子，下午品尝成都美食', NOW(), NOW(), 0),
(2, 1, 2, '第二天：大熊猫基地', '全天游览大熊猫繁育研究基地', NOW(), NOW(), 0),
(3, 1, 3, '第三天：锦里古街', '上午游览锦里古街，下午自由活动', NOW(), NOW(), 0),
(4, 2, 1, '第一天：兵马俑', '上午参观兵马俑，下午返回市区', NOW(), NOW(), 0),
(5, 2, 2, '第二天：大雁塔和回民街', '上午游览大雁塔，下午在回民街品尝美食', NOW(), NOW(), 0);

-- ========================
-- 16. 线路日程明细数据
-- ========================
INSERT IGNORE INTO `travel_route_poi` (`id`, `route_day_id`, `poi_type`, `poi_id`, `sort`, `stay_time`, `note`, `create_time`, `update_time`, `del_flag`) VALUES
(1, 1, 'scenic', 1, 1, 180, '宽窄巷子游览，建议游玩3小时', NOW(), NOW(), 0),
(2, 1, 'food', 1, 2, 60, '龙抄手总店用餐', NOW(), NOW(), 0),
(3, 2, 'scenic', 2, 1, 240, '大熊猫基地，建议游玩4小时', NOW(), NOW(), 0),
(4, 3, 'scenic', 3, 1, 120, '锦里古街游览，建议游玩2小时', NOW(), NOW(), 0),
(5, 4, 'scenic', 4, 1, 240, '兵马俑参观，建议游玩4小时', NOW(), NOW(), 0),
(6, 5, 'scenic', 5, 1, 120, '大雁塔游览，建议游玩2小时', NOW(), NOW(), 0),
(7, 5, 'food', 3, 2, 90, '回民街品尝美食', NOW(), NOW(), 0);

-- 数据插入完成
SELECT '初始化数据插入完成！' AS message;

