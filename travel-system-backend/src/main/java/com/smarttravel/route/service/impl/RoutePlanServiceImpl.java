package com.smarttravel.route.service.impl;

import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.domain.Food;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.mapper.FoodMapper;
import com.smarttravel.route.domain.TravelRoute;
import com.smarttravel.route.domain.TravelRouteDay;
import com.smarttravel.route.domain.TravelRoutePoi;
import com.smarttravel.route.mapper.TravelRouteMapper;
import com.smarttravel.route.mapper.TravelRouteDayMapper;
import com.smarttravel.route.mapper.TravelRoutePoiMapper;
import com.smarttravel.route.mapper.UserRouteFavoriteMapper;
import com.smarttravel.route.service.AiService;
import com.smarttravel.route.service.RoutePlanService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 线路规划服务实现
 */
@Service
public class RoutePlanServiceImpl implements RoutePlanService {

    @Resource
    private TravelRouteMapper routeMapper;

    @Resource
    private TravelRouteDayMapper routeDayMapper;

    @Resource
    private TravelRoutePoiMapper routePoiMapper;

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private FoodMapper foodMapper;

    @Resource
    private AiService aiService;

    @Resource
    private UserRouteFavoriteMapper userRouteFavoriteMapper;

    @Override
    @Transactional
    public Long generateRoute(Long cityId, Integer days, List<Long> tagIds,
                              String budget, String suitablePeople, Boolean useAi) {
        // 1. 创建线路主记录
        TravelRoute route = new TravelRoute();
        route.setRouteName("智能规划行程-" + days + "天");
        route.setCityId(cityId);
        route.setDays(days);
        route.setSuitablePeople(suitablePeople);
        route.setSourceType("system");
        route.setViewCount(0L);
        route.setFavoriteCount(0L);
        route.setUseCount(0L);
        route.setCreateTime(LocalDateTime.now());
        route.setDelFlag(0);

        routeMapper.insert(route);
        Long routeId = route.getId();

        // 2. 根据标签筛选景点和美食候选集
        ScenicSpot scenicQuery = new ScenicSpot();
        scenicQuery.setCityId(cityId);
        List<ScenicSpot> scenicCandidates = scenicSpotMapper.selectList(scenicQuery);

        Food foodQuery = new Food();
        foodQuery.setCityId(cityId);
        List<Food> foodCandidates = foodMapper.selectList(foodQuery);

        // 3. 按热度/评分排序
        scenicCandidates.sort((a, b) -> {
            int hotCompare = Integer.compare(b.getHotScore(), a.getHotScore());
            if (hotCompare != 0) return hotCompare;
            return b.getScore().compareTo(a.getScore());
        });

        foodCandidates.sort((a, b) -> {
            int hotCompare = Integer.compare(b.getHotScore(), a.getHotScore());
            if (hotCompare != 0) return hotCompare;
            return b.getScore().compareTo(a.getScore());
        });

        // 4. 按天数分配景点和美食
        int scenicPerDay = Math.max(2, scenicCandidates.size() / days);
        int foodPerDay = Math.max(1, foodCandidates.size() / days);

        int scenicIndex = 0;
        int foodIndex = 0;

        for (int day = 1; day <= days; day++) {
            // 创建日程
            TravelRouteDay routeDay = new TravelRouteDay();
            routeDay.setRouteId(routeId);
            routeDay.setDayNo(day);
            routeDay.setTitle("第" + day + "天");
            routeDay.setCreateTime(LocalDateTime.now());
            routeDay.setDelFlag(0);
            routeDayMapper.insert(routeDay);
            Long routeDayId = routeDay.getId();

            // 添加景点
            int scenicCount = 0;
            int sort = 1;
            while (scenicIndex < scenicCandidates.size() && scenicCount < scenicPerDay) {
                ScenicSpot spot = scenicCandidates.get(scenicIndex++);
                TravelRoutePoi poi = new TravelRoutePoi();
                poi.setRouteDayId(routeDayId);
                poi.setPoiType("scenic");
                poi.setPoiId(spot.getId());
                poi.setSort(sort++);
                poi.setStayTime(120); // 默认2小时
                poi.setCreateTime(LocalDateTime.now());
                poi.setDelFlag(0);
                routePoiMapper.insert(poi);
                scenicCount++;
            }

            // 添加美食（午餐或晚餐）
            if (foodIndex < foodCandidates.size()) {
                Food food = foodCandidates.get(foodIndex++);
                TravelRoutePoi poi = new TravelRoutePoi();
                poi.setRouteDayId(routeDayId);
                poi.setPoiType("food");
                poi.setPoiId(food.getId());
                poi.setSort(sort++);
                poi.setStayTime(60); // 默认1小时
                poi.setCreateTime(LocalDateTime.now());
                poi.setDelFlag(0);
                routePoiMapper.insert(poi);
            }
        }

        // 5. 使用AI生成文案（如果启用）
        if (useAi && aiService.isAvailable()) {
            try {
                String routeSummary = buildRouteSummary(routeId);
                String userPreference = buildUserPreference(tagIds, budget, suitablePeople);
                Map<String, String> aiText = aiService.generateRouteText(routeSummary, userPreference);

                route.setSummary(aiText.get("summary"));
                routeMapper.update(route);

                // 更新每日简介
                List<TravelRouteDay> daysList = routeDayMapper.selectByRouteId(routeId);
                for (int i = 0; i < daysList.size(); i++) {
                    TravelRouteDay day = daysList.get(i);
                    String dayText = aiText.get("day" + (i + 1));
                    if (dayText != null) {
                        day.setIntro(dayText);
                        routeDayMapper.update(day);
                    }
                }
            } catch (Exception e) {
                // AI失败时使用规则生成的简要说明
                route.setSummary("为您精心规划的" + days + "天行程，包含热门景点和美食推荐");
                routeMapper.update(route);
            }
        } else {
            route.setSummary("为您精心规划的" + days + "天行程，包含热门景点和美食推荐");
            routeMapper.update(route);
        }

        return routeId;
    }

    @Override
    public Map<String, Object> getRouteDetail(Long routeId) {
        TravelRoute route = routeMapper.selectById(routeId);
        if (route == null) {
            return null;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("route", route);

        List<TravelRouteDay> days = routeDayMapper.selectByRouteId(routeId);
        List<Map<String, Object>> dayDetails = new ArrayList<>();

        for (TravelRouteDay day : days) {
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("day", day);

            List<TravelRoutePoi> pois = routePoiMapper.selectByRouteDayId(day.getId());
            List<Map<String, Object>> poiDetails = new ArrayList<>();

            for (TravelRoutePoi poi : pois) {
                Map<String, Object> poiMap = new HashMap<>();
                poiMap.put("poi", poi);

                if ("scenic".equals(poi.getPoiType())) {
                    ScenicSpot spot = scenicSpotMapper.selectById(poi.getPoiId());
                    poiMap.put("detail", spot);
                } else if ("food".equals(poi.getPoiType())) {
                    Food food = foodMapper.selectById(poi.getPoiId());
                    poiMap.put("detail", food);
                }

                poiDetails.add(poiMap);
            }

            dayMap.put("pois", poiDetails);
            dayDetails.add(dayMap);
        }

        result.put("days", dayDetails);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> toggleFavorite(Long userId, Long routeId) {
        Map<String, Object> result = new HashMap<>();

        int exists = userRouteFavoriteMapper.checkExists(userId, routeId);

        if (exists > 0) {
            // 取消收藏
            userRouteFavoriteMapper.delete(userId, routeId);
            routeMapper.decrementFavoriteCount(routeId);
            result.put("isFavorite", false);
            result.put("action", "unfavorite");
        } else {
            // 收藏
            userRouteFavoriteMapper.insert(userId, routeId);
            routeMapper.incrementFavoriteCount(routeId);
            result.put("isFavorite", true);
            result.put("action", "favorite");
        }

        result.put("favoriteCount", routeMapper.selectById(routeId).getFavoriteCount());

        return result;
    }

    @Override
    public List<Map<String, Object>> listMyRoutes(Long userId) {
        return userRouteFavoriteMapper.selectByUserId(userId);
    }

    private String buildRouteSummary(Long routeId) {
        // 构建行程摘要JSON字符串
        return "{\"routeId\":" + routeId + "}";
    }

    private String buildUserPreference(List<Long> tagIds, String budget, String suitablePeople) {
        return "标签:" + tagIds + ",预算:" + budget + ",人群:" + suitablePeople;
    }
}

