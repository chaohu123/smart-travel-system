package com.smarttravel.content.controller;

import com.smarttravel.content.domain.City;
import com.smarttravel.content.domain.Food;
import com.smarttravel.content.mapper.CityMapper;
import com.smarttravel.content.mapper.FoodMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 美食管理接口
 */
@RestController
@RequestMapping("/api/v1/admin/food")
@CrossOrigin
public class AdminFoodController {

    @Resource
    private FoodMapper foodMapper;

    @Resource
    private CityMapper cityMapper;

    @GetMapping("/list")
    public Map<String, Object> list(Food query,
                                     @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                     @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        if (query == null) {
            query = new Food();
        }
        query.setDelFlag(0);
        
        // 确保查询参数不为空字符串（Spring Boot 会自动绑定，但空字符串需要处理）
        if (query.getProvince() != null && query.getProvince().trim().isEmpty()) {
            query.setProvince(null);
        }
        if (query.getCity() != null && query.getCity().trim().isEmpty()) {
            query.setCity(null);
        }
        if (query.getFoodType() != null && query.getFoodType().trim().isEmpty()) {
            query.setFoodType(null);
        }
        if (query.getName() != null && query.getName().trim().isEmpty()) {
            query.setName(null);
        }
        
        // 调试日志
        System.out.println("[美食查询] 查询参数: name=" + query.getName() + ", province=" + query.getProvince() + 
                          ", city=" + query.getCity() + ", foodType=" + query.getFoodType() + 
                          ", pageNum=" + pageNum + ", pageSize=" + pageSize);

        // 计算offset
        Integer offset = (pageNum - 1) * pageSize;

        // 查询总数
        int total = foodMapper.countList(query);

        // 分页查询
        List<Food> list = foodMapper.selectListWithPage(query, offset, pageSize);

        // 为每个Food对象添加province和city信息
        List<Map<String, Object>> resultList = new java.util.ArrayList<>();
        for (Food food : list) {
            Map<String, Object> foodMap = new HashMap<>();
            foodMap.put("id", food.getId());
            foodMap.put("name", food.getName());
            foodMap.put("cityId", food.getCityId());
            foodMap.put("address", food.getAddress());
            foodMap.put("latitude", food.getLatitude());
            foodMap.put("longitude", food.getLongitude());
            foodMap.put("foodType", food.getFoodType());
            foodMap.put("avgPrice", food.getAvgPrice());
            foodMap.put("intro", food.getIntro());
            foodMap.put("imageUrl", food.getImageUrl());
            foodMap.put("score", food.getScore());
            foodMap.put("hotScore", food.getHotScore());
            foodMap.put("isRecommend", food.getIsRecommend());
            foodMap.put("createTime", food.getCreateTime());
            foodMap.put("updateTime", food.getUpdateTime());
            foodMap.put("delFlag", food.getDelFlag());

            // 根据cityId查询城市信息
            if (food.getCityId() != null) {
                City city = cityMapper.selectById(food.getCityId());
                if (city != null) {
                    foodMap.put("province", city.getProvince());
                    foodMap.put("city", city.getCityName());
                }
            }

            resultList.add(foodMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", resultList);
        result.put("total", total);
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        Food food = foodMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();

        if (food != null) {
            Map<String, Object> foodMap = new HashMap<>();
            foodMap.put("id", food.getId());
            foodMap.put("name", food.getName());
            foodMap.put("cityId", food.getCityId());
            foodMap.put("address", food.getAddress());
            foodMap.put("latitude", food.getLatitude());
            foodMap.put("longitude", food.getLongitude());
            foodMap.put("foodType", food.getFoodType());
            foodMap.put("avgPrice", food.getAvgPrice());
            foodMap.put("intro", food.getIntro());
            foodMap.put("imageUrl", food.getImageUrl());
            foodMap.put("score", food.getScore());
            foodMap.put("hotScore", food.getHotScore());
            foodMap.put("isRecommend", food.getIsRecommend());
            foodMap.put("createTime", food.getCreateTime());
            foodMap.put("updateTime", food.getUpdateTime());
            foodMap.put("delFlag", food.getDelFlag());

            // 根据cityId查询城市信息
            if (food.getCityId() != null) {
                City city = cityMapper.selectById(food.getCityId());
                if (city != null) {
                    foodMap.put("province", city.getProvince());
                    foodMap.put("city", city.getCityName());
                }
            }

            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", foodMap);
        } else {
            result.put("code", 404);
            result.put("msg", "美食不存在");
        }
        return result;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> foodData) {
        Food food = new Food();
        // 设置基本字段
        if (foodData.get("name") != null) food.setName((String) foodData.get("name"));
        if (foodData.get("address") != null) food.setAddress((String) foodData.get("address"));
        if (foodData.get("foodType") != null) food.setFoodType((String) foodData.get("foodType"));
        if (foodData.get("intro") != null) food.setIntro((String) foodData.get("intro"));
        if (foodData.get("imageUrl") != null) food.setImageUrl((String) foodData.get("imageUrl"));
        if (foodData.get("latitude") != null) food.setLatitude(new java.math.BigDecimal(foodData.get("latitude").toString()));
        if (foodData.get("longitude") != null) food.setLongitude(new java.math.BigDecimal(foodData.get("longitude").toString()));
        if (foodData.get("avgPrice") != null) food.setAvgPrice(new java.math.BigDecimal(foodData.get("avgPrice").toString()));
        if (foodData.get("score") != null) food.setScore(new java.math.BigDecimal(foodData.get("score").toString()));
        if (foodData.get("hotScore") != null) food.setHotScore(((Number) foodData.get("hotScore")).intValue());
        if (foodData.get("isRecommend") != null) food.setIsRecommend(((Number) foodData.get("isRecommend")).intValue());

        // 处理城市ID：如果city_id为空，尝试根据城市名称和省份查找city_id
        String cityName = (String) foodData.get("city");
        String province = (String) foodData.get("province");

        if (foodData.get("cityId") != null) {
            food.setCityId(((Number) foodData.get("cityId")).longValue());
        } else if (cityName != null && !cityName.isEmpty() && province != null && !province.isEmpty()) {
            City city = null;

            // 第一次尝试：使用原始城市名称和省份
            city = cityMapper.selectByCityNameAndProvince(cityName, province);

            // 第二次尝试：如果第一次失败，尝试标准化后的名称
            if (city == null) {
                String normalizedCityName = cityName.replaceAll("市|区|县|自治州", "");
                String normalizedProvince = province.replaceAll("省|市|自治区|特别行政区", "");
                if (!normalizedCityName.equals(cityName) || !normalizedProvince.equals(province)) {
                    city = cityMapper.selectByCityNameAndProvince(normalizedCityName, normalizedProvince);
                }
            }

            // 第三次尝试：只使用城市名称，不限制省份（用于处理直辖市等特殊情况）
            if (city == null) {
                city = cityMapper.selectByCityNameAndProvince(cityName, null);
            }

            // 第四次尝试：使用标准化后的城市名称，不限制省份
            if (city == null) {
                String normalizedCityName = cityName.replaceAll("市|区|县|自治州", "");
                if (!normalizedCityName.equals(cityName)) {
                    city = cityMapper.selectByCityNameAndProvince(normalizedCityName, null);
                }
            }

            // 如果找到了城市，设置cityId
            if (city != null && city.getId() != null) {
                System.out.println("[创建美食] 找到城市: id=" + city.getId() + ", cityName=" + city.getCityName() + ", province=" + city.getProvince());
                food.setCityId(city.getId());
            } else {
                // 如果找不到对应的城市，返回错误
                System.out.println("[创建美食] 未找到城市: cityName=" + cityName + ", province=" + province);
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("msg", String.format("未找到对应的城市（城市：%s，省份：%s），请先在城市管理中创建该城市", cityName, province));
                return result;
            }
        }

        // 如果仍然没有city_id，返回错误
        if (food.getCityId() == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 400);
            result.put("msg", "城市ID不能为空，请选择城市或先创建城市");
            return result;
        }

        food.setDelFlag(0);
        foodMapper.insert(food);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody Map<String, Object> foodData) {
        Food food = new Food();
        // 设置ID
        if (foodData.get("id") != null) {
            food.setId(((Number) foodData.get("id")).longValue());
        }

        // 设置基本字段
        if (foodData.get("name") != null) food.setName((String) foodData.get("name"));
        if (foodData.get("address") != null) food.setAddress((String) foodData.get("address"));
        if (foodData.get("foodType") != null) food.setFoodType((String) foodData.get("foodType"));
        if (foodData.get("intro") != null) food.setIntro((String) foodData.get("intro"));
        if (foodData.get("imageUrl") != null) food.setImageUrl((String) foodData.get("imageUrl"));
        if (foodData.get("latitude") != null) food.setLatitude(new java.math.BigDecimal(foodData.get("latitude").toString()));
        if (foodData.get("longitude") != null) food.setLongitude(new java.math.BigDecimal(foodData.get("longitude").toString()));
        if (foodData.get("avgPrice") != null) food.setAvgPrice(new java.math.BigDecimal(foodData.get("avgPrice").toString()));
        if (foodData.get("score") != null) food.setScore(new java.math.BigDecimal(foodData.get("score").toString()));
        if (foodData.get("hotScore") != null) food.setHotScore(((Number) foodData.get("hotScore")).intValue());
        if (foodData.get("isRecommend") != null) food.setIsRecommend(((Number) foodData.get("isRecommend")).intValue());

        // 处理城市ID：如果city_id为空，尝试根据城市名称和省份查找city_id
        String cityName = (String) foodData.get("city");
        String province = (String) foodData.get("province");

        if (foodData.get("cityId") != null) {
            food.setCityId(((Number) foodData.get("cityId")).longValue());
        } else if (cityName != null && !cityName.isEmpty() && province != null && !province.isEmpty()) {
            City city = null;

            // 第一次尝试：使用原始城市名称和省份
            city = cityMapper.selectByCityNameAndProvince(cityName, province);

            // 第二次尝试：如果第一次失败，尝试标准化后的名称
            if (city == null) {
                String normalizedCityName = cityName.replaceAll("市|区|县|自治州", "");
                String normalizedProvince = province.replaceAll("省|市|自治区|特别行政区", "");
                if (!normalizedCityName.equals(cityName) || !normalizedProvince.equals(province)) {
                    city = cityMapper.selectByCityNameAndProvince(normalizedCityName, normalizedProvince);
                }
            }

            // 第三次尝试：只使用城市名称，不限制省份（用于处理直辖市等特殊情况）
            if (city == null) {
                city = cityMapper.selectByCityNameAndProvince(cityName, null);
            }

            // 第四次尝试：使用标准化后的城市名称，不限制省份
            if (city == null) {
                String normalizedCityName = cityName.replaceAll("市|区|县|自治州", "");
                if (!normalizedCityName.equals(cityName)) {
                    city = cityMapper.selectByCityNameAndProvince(normalizedCityName, null);
                }
            }

            // 如果找到了城市，设置cityId
            if (city != null && city.getId() != null) {
                System.out.println("[更新美食] 找到城市: id=" + city.getId() + ", cityName=" + city.getCityName() + ", province=" + city.getProvince());
                food.setCityId(city.getId());
            } else {
                // 如果找不到对应的城市，返回错误
                System.out.println("[更新美食] 未找到城市: cityName=" + cityName + ", province=" + province);
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("msg", String.format("未找到对应的城市（城市：%s，省份：%s），请先在城市管理中创建该城市", cityName, province));
                return result;
            }
        }

        foodMapper.update(food);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @DeleteMapping("/{id}")
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> delete(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 先检查记录是否存在（包括已删除的记录）
            Food existingFood = foodMapper.selectByIdWithoutDelFlag(id);
            if (existingFood == null) {
                result.put("code", 404);
                result.put("msg", "美食不存在");
                return result;
            }

            // 执行物理删除（真正从数据库中删除记录）
            int rows = foodMapper.deleteByIdPhysically(id);

            if (rows > 0) {
                result.put("code", 200);
                result.put("msg", "删除成功");
            } else {
                result.put("code", 500);
                result.put("msg", "删除失败，记录可能不存在");
            }
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "删除操作异常: " + e.getMessage());
            throw e; // 重新抛出异常以触发事务回滚
        }

        return result;
    }
}















