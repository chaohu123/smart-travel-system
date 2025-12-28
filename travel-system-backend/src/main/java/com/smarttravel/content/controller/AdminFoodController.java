package com.smarttravel.content.controller;

import com.smarttravel.content.domain.City;
import com.smarttravel.content.domain.Food;
import com.smarttravel.content.mapper.CityMapper;
import com.smarttravel.content.mapper.FoodMapper;
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
            // 记录查找参数，便于调试
            System.out.println("[创建美食] 查找城市: cityName=" + cityName + ", province=" + province);
            City city = cityMapper.selectByCityNameAndProvince(cityName, province);
            if (city != null && city.getId() != null) {
                System.out.println("[创建美食] 找到城市: id=" + city.getId() + ", cityName=" + city.getCityName() + ", province=" + city.getProvince());
                food.setCityId(city.getId());
            } else {
                // 如果找不到对应的城市，返回错误
                System.out.println("[创建美食] 未找到城市: cityName=" + cityName + ", province=" + province);
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("msg", "未找到对应的城市，请先在城市管理中创建该城市。查找参数：城市=" + cityName + "，省份=" + province);
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
            // 记录查找参数，便于调试
            System.out.println("[更新美食] 查找城市: cityName=" + cityName + ", province=" + province);
            City city = cityMapper.selectByCityNameAndProvince(cityName, province);
            if (city != null && city.getId() != null) {
                System.out.println("[更新美食] 找到城市: id=" + city.getId() + ", cityName=" + city.getCityName() + ", province=" + city.getProvince());
                food.setCityId(city.getId());
            } else {
                // 如果找不到对应的城市，返回错误
                System.out.println("[更新美食] 未找到城市: cityName=" + cityName + ", province=" + province);
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("msg", "未找到对应的城市，请先在城市管理中创建该城市。查找参数：城市=" + cityName + "，省份=" + province);
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
    public Map<String, Object> delete(@PathVariable Long id) {
        Food food = new Food();
        food.setId(id);
        food.setDelFlag(1);
        foodMapper.update(food);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }
}















