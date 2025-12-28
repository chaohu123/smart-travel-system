-- 更新现有景点的价格字段
-- 根据ticket_info字段提取价格信息

-- 故宫博物院 - 60元
UPDATE `scenic_spot` SET `price` = 60.00 WHERE `name` = '故宫博物院' AND (`price` IS NULL OR `price` = 0);

-- 天安门广场 - 免费
UPDATE `scenic_spot` SET `price` = 0.00 WHERE `name` = '天安门广场' AND (`price` IS NULL OR `price` = 0);

-- 西湖 - 免费
UPDATE `scenic_spot` SET `price` = 0.00 WHERE `name` = '西湖' AND (`price` IS NULL OR `price` = 0);

-- 兵马俑 - 120元
UPDATE `scenic_spot` SET `price` = 120.00 WHERE `name` LIKE '%兵马俑%' AND (`price` IS NULL OR `price` = 0);

-- 鼓浪屿 - 上岛免费，部分景点收费（设置为0表示免费）
UPDATE `scenic_spot` SET `price` = 0.00 WHERE `name` LIKE '%鼓浪屿%' AND (`price` IS NULL OR `price` = 0);

-- 大熊猫繁育研究基地 - 58元
UPDATE `scenic_spot` SET `price` = 58.00 WHERE `name` LIKE '%大熊猫%' AND (`price` IS NULL OR `price` = 0);

-- 回民街 - 免费
UPDATE `scenic_spot` SET `price` = 0.00 WHERE `name` LIKE '%回民街%' AND (`price` IS NULL OR `price` = 0);

-- 宽窄巷子 - 免费
UPDATE `scenic_spot` SET `price` = 0.00 WHERE `name` LIKE '%宽窄巷子%' AND (`price` IS NULL OR `price` = 0);

-- 锦里古街 - 免费
UPDATE `scenic_spot` SET `price` = 0.00 WHERE `name` LIKE '%锦里%' AND (`price` IS NULL OR `price` = 0);

-- 大雁塔 - 50元
UPDATE `scenic_spot` SET `price` = 50.00 WHERE `name` LIKE '%大雁塔%' AND (`price` IS NULL OR `price` = 0);

-- 通用更新：如果ticket_info包含"免费"，设置price为0
UPDATE `scenic_spot`
SET `price` = 0.00
WHERE (`ticket_info` LIKE '%免费%' OR `ticket_info` LIKE '%免费%')
  AND (`price` IS NULL OR `price` = 0);

-- 通用更新：从ticket_info中提取数字作为价格（如果包含"元"）
-- 注意：这个更新需要根据实际情况调整
UPDATE `scenic_spot`
SET `price` = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(`ticket_info`, '元', 1), ' ', -1) AS DECIMAL(10,2))
WHERE `ticket_info` LIKE '%元%'
  AND `ticket_info` NOT LIKE '%免费%'
  AND (`price` IS NULL OR `price` = 0)
  AND SUBSTRING_INDEX(SUBSTRING_INDEX(`ticket_info`, '元', 1), ' ', -1) REGEXP '^[0-9]+\.?[0-9]*$';













