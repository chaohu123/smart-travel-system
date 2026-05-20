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
        pageNum = normalizePageNum(pageNum);
        pageSize = normalizePageSize(pageSize);

        Food query = new Food();
        query.setCityId(cityId);
        query.setDelFlag(0);

        int offset = (pageNum - 1) * pageSize;
        List<Food> pageList = foodMapper.selectListWithPage(query, offset, pageSize);
        int total = foodMapper.countList(query);

        Map<String, Object> result = new HashMap<>();
        result.put("list", pageList != null ? pageList : new ArrayList<>());
        result.put("total", total);
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    @Override
    public Map<String, Object> getFoodDetail(Long id) {
        Food food = foodMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();

        if (food != null && food.getCityId() != null) {
            City city = cityMapper.selectById(food.getCityId());
            if (city != null) {
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
                return result;
            }
        }

        result.put("food", food);
        return result;
    }

    @Override
    public List<Food> getHotFoods(Long cityId, Integer limit) {
        limit = normalizeLimit(limit);
        return foodMapper.selectHotByCityId(cityId, limit);
    }

    @Override
    public Map<String, Object> getMyFavorites(Long userId) {
        return getMyFavorites(userId, 1, 1000);
    }

    public Map<String, Object> getMyFavorites(Long userId, Integer pageNum, Integer pageSize) {
        pageNum = normalizePageNum(pageNum);
        pageSize = normalizePageSize(pageSize);
        int offset = (pageNum - 1) * pageSize;

        List<Long> favoriteIds = userBehaviorMapper.selectContentIds(
            userId,
            BehaviorType.FAVORITE.getCode(),
            "food",
            offset,
            pageSize
        );
        int total = userBehaviorMapper.countByUserAndBehavior(userId, BehaviorType.FAVORITE.getCode(), "food");

        List<Food> favorites = new ArrayList<>();
        if (favoriteIds != null && !favoriteIds.isEmpty()) {
            for (Long id : favoriteIds) {
                Food food = foodMapper.selectById(id);
                if (food != null && (food.getDelFlag() == null || food.getDelFlag() == 0)) {
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

    private int normalizePageNum(Integer pageNum) {
        return pageNum == null || pageNum < 1 ? 1 : pageNum;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return 10;
        }
        return Math.min(pageSize, 50);
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return 10;
        }
        return Math.min(limit, 50);
    }
}
