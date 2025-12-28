package com.smarttravel.route.service.impl;

import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.domain.Food;
import com.smarttravel.content.domain.City;
import com.smarttravel.content.domain.Tag;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.mapper.FoodMapper;
import com.smarttravel.content.mapper.CityMapper;
import com.smarttravel.content.mapper.TagMapper;
import com.smarttravel.content.mapper.ContentTagMapper;
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
    private CityMapper cityMapper;

    @Resource
    private TagMapper tagMapper;

    @Resource
    private ContentTagMapper contentTagMapper;

    @Resource
    private AiService aiService;

    @Resource
    private UserRouteFavoriteMapper userRouteFavoriteMapper;

    @Override
    @Transactional
    public Long generateRoute(Long cityId, Integer days, List<Long> tagIds,
                              String budget, String suitablePeople, Boolean useAi,
                              List<Long> selectedScenicIds, List<Long> selectedFoodIds) {
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

        // 2. 处理用户选择的必选POI
        List<ScenicSpot> selectedScenics = new ArrayList<>();
        List<Food> selectedFoods = new ArrayList<>();

        if (selectedScenicIds != null && !selectedScenicIds.isEmpty()) {
            for (Long scenicId : selectedScenicIds) {
                ScenicSpot spot = scenicSpotMapper.selectById(scenicId);
                if (spot != null && spot.getCityId().equals(cityId)) {
                    selectedScenics.add(spot);
                }
            }
            System.out.println("用户选择的必选景点数: " + selectedScenics.size());
        }

        if (selectedFoodIds != null && !selectedFoodIds.isEmpty()) {
            for (Long foodId : selectedFoodIds) {
                Food food = foodMapper.selectById(foodId);
                if (food != null && food.getCityId().equals(cityId)) {
                    selectedFoods.add(food);
                }
            }
            System.out.println("用户选择的必选美食数: " + selectedFoods.size());
        }

        // 3. 根据标签筛选景点和美食候选集
        List<ScenicSpot> scenicCandidates;
        List<Food> foodCandidates;

        if (tagIds != null && !tagIds.isEmpty()) {
            // 如果用户选择了标签，根据标签筛选
            System.out.println("========== 根据标签筛选POI ==========");
            System.out.println("用户选择的标签ID: " + tagIds);

            List<Long> scenicIdsByTags = contentTagMapper.selectContentIdsByTagIds("scenic", tagIds);
            List<Long> foodIdsByTags = contentTagMapper.selectContentIdsByTagIds("food", tagIds);

            System.out.println("匹配标签的景点ID数量: " + (scenicIdsByTags != null ? scenicIdsByTags.size() : 0));
            System.out.println("匹配标签的美食ID数量: " + (foodIdsByTags != null ? foodIdsByTags.size() : 0));

            // 获取该城市的景点和美食
            ScenicSpot scenicQuery = new ScenicSpot();
            scenicQuery.setCityId(cityId);
            List<ScenicSpot> allScenic = scenicSpotMapper.selectList(scenicQuery);

            Food foodQuery = new Food();
            foodQuery.setCityId(cityId);
            List<Food> allFood = foodMapper.selectList(foodQuery);

            System.out.println("该城市总景点数: " + allScenic.size());
            System.out.println("该城市总美食数: " + allFood.size());

            // 筛选出匹配标签的POI
            if (scenicIdsByTags != null && !scenicIdsByTags.isEmpty()) {
                scenicCandidates = allScenic.stream()
                    .filter(spot -> scenicIdsByTags.contains(spot.getId()))
                    .collect(Collectors.toList());
                System.out.println("筛选后景点数: " + scenicCandidates.size());

                // 如果筛选后景点数量为0，使用所有景点作为兜底
                if (scenicCandidates.isEmpty()) {
                    scenicCandidates = allScenic;
                    System.out.println("筛选后景点数为0，使用所有景点作为兜底");
                }
            } else {
                // 如果没有匹配的景点，使用所有景点
                scenicCandidates = allScenic;
                System.out.println("未找到匹配标签的景点，使用所有景点");
            }

            // 对于美食的处理逻辑：
            // 1. 如果美食也匹配了用户选择的标签，使用匹配的美食
            // 2. 如果美食不匹配标签，使用所有美食（因为美食通常不应该被景点类标签筛选）
            // 3. 这样可以确保路线中既有符合标签的景点，也有合适的美食搭配
            if (foodIdsByTags != null && !foodIdsByTags.isEmpty()) {
                foodCandidates = allFood.stream()
                    .filter(food -> foodIdsByTags.contains(food.getId()))
                    .collect(Collectors.toList());
                System.out.println("筛选后美食数: " + foodCandidates.size());

                // 如果筛选后美食数量为0，使用所有美食作为兜底
                if (foodCandidates.isEmpty()) {
                    foodCandidates = allFood;
                    System.out.println("筛选后美食数为0，使用所有美食作为兜底");
                } else {
                    System.out.println("使用匹配标签的美食");
                }
            } else {
                // 如果没有匹配的美食，使用所有美食
                // 这是正常情况，因为用户选择"历史"、"自然"等标签时，美食通常不匹配这些标签
                foodCandidates = allFood;
                System.out.println("未找到匹配标签的美食，使用所有美食（这是正常的，美食通常不匹配景点类标签）");
            }
            System.out.println("=====================================");
        } else {
            // 如果用户没有选择标签，使用所有POI
            System.out.println("用户未选择标签，使用所有POI");
        ScenicSpot scenicQuery = new ScenicSpot();
        scenicQuery.setCityId(cityId);
            scenicCandidates = scenicSpotMapper.selectList(scenicQuery);

        Food foodQuery = new Food();
        foodQuery.setCityId(cityId);
            foodCandidates = foodMapper.selectList(foodQuery);
        }

        // 4. 将用户选择的必选POI添加到候选集中（如果还没有）
        // 确保用户选择的POI不会被过滤掉
        for (ScenicSpot selectedScenic : selectedScenics) {
            boolean exists = scenicCandidates.stream()
                .anyMatch(s -> s.getId().equals(selectedScenic.getId()));
            if (!exists) {
                scenicCandidates.add(0, selectedScenic); // 添加到前面，优先使用
            }
        }

        for (Food selectedFood : selectedFoods) {
            boolean exists = foodCandidates.stream()
                .anyMatch(f -> f.getId().equals(selectedFood.getId()));
            if (!exists) {
                foodCandidates.add(0, selectedFood); // 添加到前面，优先使用
            }
        }

        // 5. 按热度/评分排序（但用户选择的POI保持优先）
        // 将用户选择的POI放在最前面
        List<ScenicSpot> sortedScenic = new ArrayList<>();
        List<Long> selectedScenicIdsList = selectedScenics.stream()
            .map(ScenicSpot::getId)
            .collect(Collectors.toList());

        // 先添加用户选择的景点
        for (ScenicSpot scenic : scenicCandidates) {
            if (selectedScenicIdsList.contains(scenic.getId())) {
                sortedScenic.add(scenic);
            }
        }
        // 再添加其他景点并排序
        List<ScenicSpot> otherScenic = scenicCandidates.stream()
            .filter(s -> !selectedScenicIdsList.contains(s.getId()))
            .sorted((a, b) -> {
            int hotCompare = Integer.compare(b.getHotScore(), a.getHotScore());
            if (hotCompare != 0) return hotCompare;
            return b.getScore().compareTo(a.getScore());
            })
            .collect(Collectors.toList());
        sortedScenic.addAll(otherScenic);
        scenicCandidates = sortedScenic;

        List<Food> sortedFood = new ArrayList<>();
        List<Long> selectedFoodIdsList = selectedFoods.stream()
            .map(Food::getId)
            .collect(Collectors.toList());

        // 先添加用户选择的美食
        for (Food food : foodCandidates) {
            if (selectedFoodIdsList.contains(food.getId())) {
                sortedFood.add(food);
            }
        }
        // 再添加其他美食并排序
        List<Food> otherFood = foodCandidates.stream()
            .filter(f -> !selectedFoodIdsList.contains(f.getId()))
            .sorted((a, b) -> {
            int hotCompare = Integer.compare(b.getHotScore(), a.getHotScore());
            if (hotCompare != 0) return hotCompare;
            return b.getScore().compareTo(a.getScore());
            })
            .collect(Collectors.toList());
        sortedFood.addAll(otherFood);
        foodCandidates = sortedFood;

        // 6. 按天数分配景点和美食
        // 确保至少每天有1个景点，如果景点数量不足，则平均分配
        int scenicPerDay = scenicCandidates.isEmpty() ? 0 : Math.max(1, scenicCandidates.size() / days);
        int foodPerDay = foodCandidates.isEmpty() ? 0 : Math.max(1, foodCandidates.size() / days);

        System.out.println("========== POI分配信息 ==========");
        System.out.println("景点候选数: " + scenicCandidates.size() + ", 每天分配: " + scenicPerDay);
        System.out.println("美食候选数: " + foodCandidates.size() + ", 每天分配: " + foodPerDay);

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

            int sort = 1;
            int dayScenicCount = 0;
            int dayFoodCount = 0;

            // 添加景点（优先保证每天至少有一个景点）
            while (scenicIndex < scenicCandidates.size() && dayScenicCount < scenicPerDay) {
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
                dayScenicCount++;
            }

            // 如果景点数量不足，确保最后几天也有景点（循环分配）
            if (dayScenicCount == 0 && !scenicCandidates.isEmpty()) {
                // 如果当前天没有分配到景点，从候选列表中取一个
                ScenicSpot spot = scenicCandidates.get(scenicIndex % scenicCandidates.size());
                scenicIndex++;
                TravelRoutePoi poi = new TravelRoutePoi();
                poi.setRouteDayId(routeDayId);
                poi.setPoiType("scenic");
                poi.setPoiId(spot.getId());
                poi.setSort(sort++);
                poi.setStayTime(120);
                poi.setCreateTime(LocalDateTime.now());
                poi.setDelFlag(0);
                routePoiMapper.insert(poi);
                dayScenicCount++;
            }

            // 添加美食（每天至少一个美食）
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
                dayFoodCount++;
            }

            System.out.println("第" + day + "天: 景点" + dayScenicCount + "个, 美食" + dayFoodCount + "个");
        }
        System.out.println("=====================================");

        // 7. 使用AI生成文案（如果启用）
        if (useAi && aiService.isAvailable()) {
            try {
                String routeSummary = buildRouteSummary(routeId, tagIds, selectedScenicIds, selectedFoodIds);
                String userPreference = buildUserPreference(tagIds, budget, suitablePeople);
                Map<String, String> aiText = aiService.generateRouteText(routeSummary, userPreference);

                route.setSummary(aiText.get("summary"));
                routeMapper.update(route);

                // 更新每日简介
                List<TravelRouteDay> daysList = routeDayMapper.selectByRouteId(routeId);
                for (int i = 0; i < daysList.size(); i++) {
                    TravelRouteDay day = daysList.get(i);
                    String dayText = aiText.get("day" + (i + 1));
                    if (dayText != null && !dayText.isEmpty()) {
                        day.setIntro(dayText);
                        routeDayMapper.update(day);
                    } else {
                        // 如果没有AI生成的描述，使用默认描述
                        day.setIntro("第" + (i + 1) + "天将带您探索城市的核心景点，体验当地特色美食。");
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

    private String buildRouteSummary(Long routeId, List<Long> tagIds,
                                     List<Long> selectedScenicIds, List<Long> selectedFoodIds) {
        TravelRoute route = routeMapper.selectById(routeId);
        if (route == null) {
            return "行程ID: " + routeId;
        }

        StringBuilder summary = new StringBuilder();
        summary.append("行程天数: ").append(route.getDays()).append("天\n");

        // 获取城市信息
        if (route.getCityId() != null) {
            City city = cityMapper.selectById(route.getCityId());
            if (city != null) {
                summary.append("目的地: ").append(city.getCityName());
                if (city.getProvince() != null && !city.getProvince().isEmpty()) {
                    summary.append(" (").append(city.getProvince()).append(")");
                }
                summary.append("\n");
            }
        }

        // 添加用户选择的必选POI
        if (selectedScenicIds != null && !selectedScenicIds.isEmpty()) {
            summary.append("\n必选景点（用户指定）:\n");
            for (Long scenicId : selectedScenicIds) {
                ScenicSpot spot = scenicSpotMapper.selectById(scenicId);
                if (spot != null) {
                    summary.append("- 景点: ").append(spot.getName());
                    if (spot.getAddress() != null && !spot.getAddress().isEmpty()) {
                        summary.append(" (").append(spot.getAddress()).append(")");
                    }
                    summary.append("\n");
                }
            }
        }

        if (selectedFoodIds != null && !selectedFoodIds.isEmpty()) {
            summary.append("\n必选美食（用户指定）:\n");
            for (Long foodId : selectedFoodIds) {
                Food food = foodMapper.selectById(foodId);
                if (food != null) {
                    summary.append("- 美食: ").append(food.getName());
                    if (food.getAddress() != null && !food.getAddress().isEmpty()) {
                        summary.append(" (").append(food.getAddress()).append(")");
                    }
                    summary.append("\n");
                }
            }
        }

        // 添加标签关联的辅助POI
        if (tagIds != null && !tagIds.isEmpty()) {
            List<Long> scenicIdsByTags = contentTagMapper.selectContentIdsByTagIds("scenic", tagIds);
            List<Long> foodIdsByTags = contentTagMapper.selectContentIdsByTagIds("food", tagIds);

            if (scenicIdsByTags != null && !scenicIdsByTags.isEmpty()) {
                summary.append("\n辅助景点（根据标签推荐）:\n");
                int count = 0;
                for (Long scenicId : scenicIdsByTags) {
                    // 排除用户已选择的景点
                    if (selectedScenicIds != null && selectedScenicIds.contains(scenicId)) {
                        continue;
                    }
                    ScenicSpot spot = scenicSpotMapper.selectById(scenicId);
                    if (spot != null && spot.getCityId().equals(route.getCityId())) {
                        summary.append("- 景点: ").append(spot.getName()).append("\n");
                        count++;
                        if (count >= 10) break; // 最多显示10个辅助景点
                    }
                }
            }

            if (foodIdsByTags != null && !foodIdsByTags.isEmpty()) {
                summary.append("\n辅助美食（根据标签推荐）:\n");
                int count = 0;
                for (Long foodId : foodIdsByTags) {
                    // 排除用户已选择的美食
                    if (selectedFoodIds != null && selectedFoodIds.contains(foodId)) {
                        continue;
                    }
                    Food food = foodMapper.selectById(foodId);
                    if (food != null && food.getCityId().equals(route.getCityId())) {
                        summary.append("- 美食: ").append(food.getName()).append("\n");
                        count++;
                        if (count >= 10) break; // 最多显示10个辅助美食
                    }
                }
            }
        }

        // 获取每日行程详情
        List<TravelRouteDay> days = routeDayMapper.selectByRouteId(routeId);
        summary.append("\n每日行程安排:\n");
        for (TravelRouteDay day : days) {
            summary.append("第").append(day.getDayNo()).append("天: ");

            List<TravelRoutePoi> pois = routePoiMapper.selectByRouteDayId(day.getId());
            List<String> poiNames = new ArrayList<>();
            for (TravelRoutePoi poi : pois) {
                if ("scenic".equals(poi.getPoiType())) {
                    ScenicSpot spot = scenicSpotMapper.selectById(poi.getPoiId());
                    if (spot != null) {
                        poiNames.add("景点-" + spot.getName());
                    }
                } else if ("food".equals(poi.getPoiType())) {
                    Food food = foodMapper.selectById(poi.getPoiId());
                    if (food != null) {
                        poiNames.add("美食-" + food.getName());
                    }
                }
            }
            summary.append(String.join("、", poiNames)).append("\n");
        }

        return summary.toString();
    }

    private String buildUserPreference(List<Long> tagIds, String budget, String suitablePeople) {
        StringBuilder preference = new StringBuilder();

        // 获取标签名称
        if (tagIds != null && !tagIds.isEmpty()) {
            List<Tag> tags = tagMapper.selectByIds(tagIds);
            if (tags != null && !tags.isEmpty()) {
                List<String> tagNames = tags.stream()
                    .map(Tag::getTagName)
                    .collect(Collectors.toList());
                preference.append("旅行偏好: ").append(String.join("、", tagNames)).append("\n");
            }
        }

        if (suitablePeople != null && !suitablePeople.isEmpty()) {
            preference.append("同行人: ").append(suitablePeople).append("\n");
        }

        if (budget != null && !budget.isEmpty()) {
            preference.append("预算: ").append(budget);
        }

        return preference.toString();
    }
}

