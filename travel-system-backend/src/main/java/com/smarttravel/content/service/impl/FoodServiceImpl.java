package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.City;
import com.smarttravel.content.domain.Food;
import com.smarttravel.content.enums.BehaviorType;
import com.smarttravel.content.mapper.CityMapper;
import com.smarttravel.content.mapper.FoodMapper;
import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.content.service.FoodService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 美食服务实现
 */
@Service
public class FoodServiceImpl implements FoodService {

    @Resource
    private FoodMapper foodMapper;

    @Resource
    private CityMapper cityMapper;

    @Resource
    private UserBehaviorMapper userBehaviorMapper;

    @Override
    public Map<String, Object> listFoods(Integer pageNum, Integer pageSize, Long cityId,
                                         String tagName, String sortBy) {
        Food query = new Food();
        query.setCityId(cityId);
        query.setDelFlag(0);

        List<Food> list = foodMapper.selectList(query);

        // 简化分页处理
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, list.size());
        List<Food> pageList = list.subList(start, end);

        Map<String, Object> result = new HashMap<>();
        result.put("list", pageList);
        result.put("total", list.size());
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    @Override
    public Map<String, Object> getFoodDetail(Long id) {
        Food food = foodMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();

        if (food != null) {
            // 根据cityId查询城市信息，添加cityName字段
            if (food.getCityId() != null) {
                City city = cityMapper.selectById(food.getCityId());
                if (city != null) {
                    // 创建一个包含cityName的Map
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
                    foodMap.put("cityName", city.getCityName());
                    foodMap.put("province", city.getProvince());
                    result.put("food", foodMap);
                } else {
                    result.put("food", food);
                }
            } else {
                result.put("food", food);
            }
        } else {
            result.put("food", null);
        }

        return result;
    }

    @Override
    public List<Food> getHotFoods(Long cityId, Integer limit) {
        return foodMapper.selectHotByCityId(cityId, limit);
    }

    @Override
    public Map<String, Object> getMyFavorites(Long userId) {
        return getMyFavorites(userId, 1, 1000);
    }

    /**
     * 获取用户收藏的美食列表（支持分页）
     */
    public Map<String, Object> getMyFavorites(Long userId, Integer pageNum, Integer pageSize) {
        int offset = (pageNum - 1) * pageSize;
        // 获取用户收藏的美食ID列表
        List<Long> favoriteIds = userBehaviorMapper.selectContentIds(
            userId,
            BehaviorType.FAVORITE.getCode(),
            "food",
            offset,
            pageSize
        );
        int total = userBehaviorMapper.countByUserAndBehavior(userId, BehaviorType.FAVORITE.getCode(), "food");

        // 根据ID列表查询美食详情
        List<Food> favorites = new ArrayList<>();
        if (favoriteIds != null && !favoriteIds.isEmpty()) {
            for (Long id : favoriteIds) {
                Food food = foodMapper.selectById(id);
                if (food != null && food.getDelFlag() == 0) {
                    favorites.add(food);
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", favorites);
        result.put("total", total);
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }
}

