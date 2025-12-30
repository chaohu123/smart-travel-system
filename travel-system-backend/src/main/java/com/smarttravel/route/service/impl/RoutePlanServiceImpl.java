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
import java.util.Comparator;

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
                              List<Long> selectedScenicIds, List<Long> selectedFoodIds,
                              List<Map<String, Object>> dailySelections,
                              String startDate, String endDate) {
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

            // 优先使用用户每天选择的内容
            Map<String, Object> daySelection = null;
            if (dailySelections != null && !dailySelections.isEmpty()) {
                for (Map<String, Object> selection : dailySelections) {
                    Object dayObj = selection.get("day");
                    if (dayObj != null && dayObj.toString().equals(String.valueOf(day))) {
                        daySelection = selection;
                        break;
                    }
                }
            }

            // 添加用户选择的景点
            if (daySelection != null) {
                Object scenicIdsObj = daySelection.get("scenicIds");
                if (scenicIdsObj instanceof List) {
                    List<?> scenicIdsList = (List<?>) scenicIdsObj;
                    for (Object idObj : scenicIdsList) {
                        if (idObj != null) {
                            Long scenicId = Long.valueOf(idObj.toString());
                            ScenicSpot spot = scenicSpotMapper.selectById(scenicId);
                            if (spot != null && spot.getCityId().equals(cityId)) {
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
                        }
                    }
                }

                // 添加用户选择的美食
                Object foodIdsObj = daySelection.get("foodIds");
                if (foodIdsObj instanceof List) {
                    List<?> foodIdsList = (List<?>) foodIdsObj;
                    for (Object idObj : foodIdsList) {
                        if (idObj != null) {
                            Long foodId = Long.valueOf(idObj.toString());
                            Food food = foodMapper.selectById(foodId);
                            if (food != null && food.getCityId().equals(cityId)) {
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
                        }
                    }
                }
            }

            // 如果用户没有选择或选择不足，从候选集中补充
            // 添加景点（优先保证每天至少有一个景点）
            while (scenicIndex < scenicCandidates.size() && dayScenicCount < scenicPerDay) {
                ScenicSpot spot = scenicCandidates.get(scenicIndex++);
                // 检查是否已被用户选择
                boolean alreadySelected = false;
                if (daySelection != null) {
                    Object scenicIdsObj = daySelection.get("scenicIds");
                    if (scenicIdsObj instanceof List) {
                        List<?> scenicIdsList = (List<?>) scenicIdsObj;
                        for (Object idObj : scenicIdsList) {
                            if (idObj != null && Long.valueOf(idObj.toString()).equals(spot.getId())) {
                                alreadySelected = true;
                                break;
                            }
                        }
                    }
                }
                if (!alreadySelected) {
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

            // 添加美食（每天至少一个美食，如果用户没有选择）
            if (dayFoodCount == 0 && foodIndex < foodCandidates.size()) {
                Food food = foodCandidates.get(foodIndex++);
                // 检查是否已被用户选择
                boolean alreadySelected = false;
                if (daySelection != null) {
                    Object foodIdsObj = daySelection.get("foodIds");
                    if (foodIdsObj instanceof List) {
                        List<?> foodIdsList = (List<?>) foodIdsObj;
                        for (Object idObj : foodIdsList) {
                            if (idObj != null && Long.valueOf(idObj.toString()).equals(food.getId())) {
                                alreadySelected = true;
                                break;
                            }
                        }
                    }
                }
                if (!alreadySelected) {
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
            }

            System.out.println("第" + day + "天: 景点" + dayScenicCount + "个, 美食" + dayFoodCount + "个");

            // 计算并保存路线信息
            calculateAndSaveRouteInfo(routeDayId);
        }
        System.out.println("=====================================");

        // 7. 使用AI生成文案（如果启用）
        if (useAi && aiService.isAvailable()) {
            try {
                String routeSummary = buildRouteSummary(routeId, tagIds, selectedScenicIds, selectedFoodIds, dailySelections);
                String userPreference = buildUserPreference(tagIds, budget, suitablePeople);
                Map<String, String> aiText = aiService.generateRouteText(routeSummary, userPreference);

                route.setSummary(aiText.get("summary"));
                routeMapper.update(route);

                // 更新每日简介（包含早中晚计划）
                List<TravelRouteDay> daysList = routeDayMapper.selectByRouteId(routeId);
                for (int i = 0; i < daysList.size(); i++) {
                    TravelRouteDay day = daysList.get(i);
                    int dayNum = i + 1;

                    // 尝试获取早中晚计划
                    String morning = aiText.get("day" + dayNum + "_morning");
                    String afternoon = aiText.get("day" + dayNum + "_afternoon");
                    String evening = aiText.get("day" + dayNum + "_evening");

                    // 如果有早中晚计划，构建JSON格式存储
                    if (morning != null || afternoon != null || evening != null) {
                        StringBuilder introJson = new StringBuilder();
                        introJson.append("{");
                        introJson.append("\"morning\":\"").append(morning != null ? escapeJsonString(morning) : "").append("\",");
                        introJson.append("\"afternoon\":\"").append(afternoon != null ? escapeJsonString(afternoon) : "").append("\",");
                        introJson.append("\"evening\":\"").append(evening != null ? escapeJsonString(evening) : "").append("\"");
                        introJson.append("}");
                        day.setIntro(introJson.toString());
                    } else {
                        // 兼容旧格式
                        String dayText = aiText.get("day" + dayNum);
                        if (dayText != null && !dayText.isEmpty()) {
                            day.setIntro(dayText);
                        } else {
                            day.setIntro("第" + dayNum + "天将带您探索城市的核心景点，体验当地特色美食。");
                        }
                    }
                    routeDayMapper.update(day);
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
            // 按sort排序
            pois.sort(Comparator.comparing(TravelRoutePoi::getSort));

            List<Map<String, Object>> poiDetails = new ArrayList<>();

            for (int i = 0; i < pois.size(); i++) {
                TravelRoutePoi poi = pois.get(i);
                Map<String, Object> poiMap = new HashMap<>();
                poiMap.put("poi", poi);

                if ("scenic".equals(poi.getPoiType())) {
                    ScenicSpot spot = scenicSpotMapper.selectById(poi.getPoiId());
                    poiMap.put("detail", spot);
                } else if ("food".equals(poi.getPoiType())) {
                    Food food = foodMapper.selectById(poi.getPoiId());
                    poiMap.put("detail", food);
                }

                // 添加路线信息（从前一个POI到当前POI）
                if (i > 0) {
                    TravelRoutePoi prevPoi = pois.get(i - 1);
                    Map<String, Object> routeInfo = getRouteInfo(prevPoi, poi);
                    if (routeInfo != null) {
                        poiMap.put("route", routeInfo);
                    }
                }

                poiDetails.add(poiMap);
            }

            dayMap.put("pois", poiDetails);
            dayDetails.add(dayMap);
        }

        result.put("days", dayDetails);
        return result;
    }

    /**
     * 计算并保存路线信息到POI的note字段
     */
    private void calculateAndSaveRouteInfo(Long routeDayId) {
        List<TravelRoutePoi> pois = routePoiMapper.selectByRouteDayId(routeDayId);
        if (pois == null || pois.size() < 2) {
            return;
        }

        // 按sort排序
        pois.sort(Comparator.comparing(TravelRoutePoi::getSort));

        for (int i = 1; i < pois.size(); i++) {
            TravelRoutePoi currentPoi = pois.get(i);
            TravelRoutePoi prevPoi = pois.get(i - 1);

            // 计算路线信息
            Map<String, Object> routeInfo = calculateRouteInfo(prevPoi, currentPoi);

            if (routeInfo != null && !routeInfo.isEmpty()) {
                // 将路线信息保存到当前POI的note字段（JSON格式）
                try {
                    StringBuilder noteJson = new StringBuilder();
                    noteJson.append("{");
                    noteJson.append("\"from\":\"").append(routeInfo.get("from")).append("\",");
                    noteJson.append("\"to\":\"").append(routeInfo.get("to")).append("\",");
                    noteJson.append("\"suggestedRoute\":\"").append(routeInfo.get("suggestedRoute")).append("\",");
                    noteJson.append("\"transport\":\"").append(routeInfo.get("transport")).append("\",");
                    noteJson.append("\"distance\":\"").append(routeInfo.get("distance")).append("\"");
                    noteJson.append("}");

                    currentPoi.setNote(noteJson.toString());
                    routePoiMapper.update(currentPoi);
                } catch (Exception e) {
                    System.err.println("保存路线信息失败: " + e.getMessage());
                }
            }
        }
    }

    /**
     * 计算两个POI之间的路线信息
     */
    private Map<String, Object> calculateRouteInfo(TravelRoutePoi fromPoi, TravelRoutePoi toPoi) {
        Map<String, Object> routeInfo = new HashMap<>();

        // 获取起点和终点信息
        String fromName = getPoiName(fromPoi);
        String toName = getPoiName(toPoi);

        routeInfo.put("from", fromName);
        routeInfo.put("to", toName);

        // 获取坐标信息
        Double fromLat = null, fromLng = null, toLat = null, toLng = null;

        if ("scenic".equals(fromPoi.getPoiType())) {
            ScenicSpot spot = scenicSpotMapper.selectById(fromPoi.getPoiId());
            if (spot != null) {
                fromLat = spot.getLatitude() != null ? spot.getLatitude().doubleValue() : null;
                fromLng = spot.getLongitude() != null ? spot.getLongitude().doubleValue() : null;
            }
        } else if ("food".equals(fromPoi.getPoiType())) {
            Food food = foodMapper.selectById(fromPoi.getPoiId());
            if (food != null) {
                fromLat = food.getLatitude() != null ? food.getLatitude().doubleValue() : null;
                fromLng = food.getLongitude() != null ? food.getLongitude().doubleValue() : null;
            }
        }

        if ("scenic".equals(toPoi.getPoiType())) {
            ScenicSpot spot = scenicSpotMapper.selectById(toPoi.getPoiId());
            if (spot != null) {
                toLat = spot.getLatitude() != null ? spot.getLatitude().doubleValue() : null;
                toLng = spot.getLongitude() != null ? spot.getLongitude().doubleValue() : null;
            }
        } else if ("food".equals(toPoi.getPoiType())) {
            Food food = foodMapper.selectById(toPoi.getPoiId());
            if (food != null) {
                toLat = food.getLatitude() != null ? food.getLatitude().doubleValue() : null;
                toLng = food.getLongitude() != null ? food.getLongitude().doubleValue() : null;
            }
        }

        // 计算距离
        if (fromLat != null && fromLng != null && toLat != null && toLng != null) {
            double distance = calculateDistance(fromLat, fromLng, toLat, toLng);
            if (distance < 1.0) {
                routeInfo.put("distance", String.format("%.0f米", distance * 1000));
                routeInfo.put("transport", "步行");
                routeInfo.put("suggestedRoute", "建议步行前往，距离较近");
            } else if (distance < 5.0) {
                routeInfo.put("distance", String.format("%.1f公里", distance));
                routeInfo.put("transport", "步行/公交");
                routeInfo.put("suggestedRoute", "建议步行或乘坐公交前往");
            } else {
                routeInfo.put("distance", String.format("%.1f公里", distance));
                routeInfo.put("transport", "公交/地铁/打车");
                routeInfo.put("suggestedRoute", "建议乘坐公交、地铁或打车前往");
            }
        } else {
            // 如果没有坐标信息，使用默认值
            routeInfo.put("distance", "约1公里");
            routeInfo.put("transport", "步行/公交");
            routeInfo.put("suggestedRoute", "建议使用导航前往");
        }

        return routeInfo;
    }

    /**
     * 获取POI名称
     */
    private String getPoiName(TravelRoutePoi poi) {
        if ("scenic".equals(poi.getPoiType())) {
            ScenicSpot spot = scenicSpotMapper.selectById(poi.getPoiId());
            return spot != null ? spot.getName() : "未知景点";
        } else if ("food".equals(poi.getPoiType())) {
            Food food = foodMapper.selectById(poi.getPoiId());
            return food != null ? food.getName() : "未知美食";
        }
        return "未知地点";
    }

    /**
     * 计算两点之间的距离（公里）
     * 使用Haversine公式
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // 地球半径（公里）

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;

        return distance;
    }

    /**
     * 从POI的note字段解析路线信息
     */
    private Map<String, Object> getRouteInfo(TravelRoutePoi fromPoi, TravelRoutePoi toPoi) {
        // 优先从toPoi的note字段读取路线信息
        if (toPoi.getNote() != null && !toPoi.getNote().isEmpty()) {
            try {
                // 简单解析JSON（如果note字段是JSON格式）
                String note = toPoi.getNote();
                if (note.startsWith("{") && note.contains("from")) {
                    Map<String, Object> routeInfo = new HashMap<>();
                    // 简单解析JSON字符串
                    String from = extractJsonValue(note, "from");
                    String to = extractJsonValue(note, "to");
                    String suggestedRoute = extractJsonValue(note, "suggestedRoute");
                    String transport = extractJsonValue(note, "transport");
                    String distance = extractJsonValue(note, "distance");

                    routeInfo.put("from", from != null ? from : getPoiName(fromPoi));
                    routeInfo.put("to", to != null ? to : getPoiName(toPoi));
                    routeInfo.put("suggestedRoute", suggestedRoute != null ? suggestedRoute : "建议使用导航");
                    routeInfo.put("transport", transport != null ? transport : "步行/公交");
                    routeInfo.put("distance", distance != null ? distance : "约1公里");

                    return routeInfo;
                }
            } catch (Exception e) {
                // 解析失败，使用计算方式
            }
        }

        // 如果没有保存的路线信息，实时计算
        return calculateRouteInfo(fromPoi, toPoi);
    }

    /**
     * 从JSON字符串中提取值
     */
    private String extractJsonValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\"\\s*:\\s*\"([^\"]+)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            // 忽略解析错误
        }
        return null;
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
                                     List<Long> selectedScenicIds, List<Long> selectedFoodIds,
                                     List<Map<String, Object>> dailySelections) {
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

        // 添加每天的选择信息（如果用户有选择）
        if (dailySelections != null && !dailySelections.isEmpty()) {
            summary.append("\n用户每日选择安排:\n");
            for (Map<String, Object> daySelection : dailySelections) {
                Object dayObj = daySelection.get("day");
                if (dayObj != null) {
                    int day = Integer.parseInt(dayObj.toString());
                    summary.append("第").append(day).append("天用户选择:\n");

                    Object scenicIdsObj = daySelection.get("scenicIds");
                    if (scenicIdsObj instanceof List) {
                        List<?> scenicIdsList = (List<?>) scenicIdsObj;
                        if (!scenicIdsList.isEmpty()) {
                            summary.append("  景点: ");
                            List<String> scenicNames = new ArrayList<>();
                            for (Object idObj : scenicIdsList) {
                                if (idObj != null) {
                                    Long scenicId = Long.valueOf(idObj.toString());
                                    ScenicSpot spot = scenicSpotMapper.selectById(scenicId);
                                    if (spot != null) {
                                        scenicNames.add(spot.getName());
                                    }
                                }
                            }
                            summary.append(String.join("、", scenicNames)).append("\n");
                        }
                    }

                    Object foodIdsObj = daySelection.get("foodIds");
                    if (foodIdsObj instanceof List) {
                        List<?> foodIdsList = (List<?>) foodIdsObj;
                        if (!foodIdsList.isEmpty()) {
                            summary.append("  美食: ");
                            List<String> foodNames = new ArrayList<>();
                            for (Object idObj : foodIdsList) {
                                if (idObj != null) {
                                    Long foodId = Long.valueOf(idObj.toString());
                                    Food food = foodMapper.selectById(foodId);
                                    if (food != null) {
                                        foodNames.add(food.getName());
                                    }
                                }
                            }
                            summary.append(String.join("、", foodNames)).append("\n");
                        }
                    }
                }
            }
        }

        /*
         * 注意：
         * 这里原本会再次根据数据库中的实际行程（包括系统自动补充的景点 / 美食）
         * 生成一段“每日行程安排”。这样做会带来几个问题：
         * 1. 这段“每日行程安排”中会出现用户在表单中没有勾选的景点 / 美食（例如根据标签自动推荐的 POI）；
         * 2. 某些景点会在不同天被系统自动分配，从而看起来像是“重复的地点”；
         * 3. 日志 / Prompt 中展示的每日行程，与前端表单里“用户每日选择安排”的内容不一致，导致困惑。
         *
         * 对于大模型来说，我们真正想强调的是“用户每天一定要去的地点”，
         * 这些信息在上面的【用户每日选择安排】中已经完整表达，因此这里不再追加
         * 基于数据库实际行程的“每日行程安排”，避免把系统自动补充的 POI 混入“用户必选”描述中。
         */

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

    /**
     * 转义JSON字符串中的特殊字符
     * 转义：双引号、反斜杠、换行符、回车符、制表符等
     */
    private String escapeJsonString(String input) {
        if (input == null) {
            return "";
        }
        return input
            .replace("\\", "\\\\")  // 先转义反斜杠，避免后续转义被影响
            .replace("\"", "\\\"")  // 转义双引号
            .replace("\n", "\\n")   // 转义换行符
            .replace("\r", "\\r")   // 转义回车符
            .replace("\t", "\\t")   // 转义制表符
            .replace("\b", "\\b")   // 转义退格符
            .replace("\f", "\\f");  // 转义换页符
    }
}

