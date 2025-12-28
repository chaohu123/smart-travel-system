package com.smarttravel.recommend.service.impl;

import com.smarttravel.common.redis.RedisService;
import com.smarttravel.content.domain.Food;
import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.domain.ContentTag;
import com.smarttravel.content.domain.Tag;
import com.smarttravel.content.mapper.ContentTagMapper;
import com.smarttravel.content.mapper.FoodMapper;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.mapper.TagMapper;
import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.recommend.service.RecommendService;
import com.smarttravel.recommend.service.UserInterestService;
import com.smarttravel.route.domain.TravelRoute;
import com.smarttravel.route.mapper.TravelRouteMapper;
import com.smarttravel.travel.domain.TravelNote;
import com.smarttravel.travel.mapper.TravelNoteMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 推荐服务实现
 */
@Service
public class RecommendServiceImpl implements RecommendService {

    @Resource
    private TravelRouteMapper travelRouteMapper;

    @Resource
    private TravelNoteMapper travelNoteMapper;

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private FoodMapper foodMapper;

    @Resource
    private UserInterestService userInterestService;

    @Resource
    private UserBehaviorMapper userBehaviorMapper;

    @Resource
    private RedisService redisService;

    @Resource
    private ContentTagMapper contentTagMapper;

    @Resource
    private TagMapper tagMapper;

    // 缓存key
    private static final String HOT_ROUTES_KEY = "recommend:hot:routes";
    private static final String HOT_NOTES_KEY = "recommend:hot:notes";
    private static final String HOT_SCENIC_KEY_PREFIX = "recommend:hot:scenic:";
    private static final String HOT_FOOD_KEY_PREFIX = "recommend:hot:food:";
    private static final long CACHE_EXPIRE_SECONDS = 1800; // 30分钟

    @Override
    public List<Map<String, Object>> recommendRoutes(Long userId, Integer limit) {
        List<Map<String, Object>> result = new ArrayList<>();

        // 查询热门线路（按收藏数+浏览数排序）
        TravelRoute query = new TravelRoute();
        query.setDelFlag(0);
        List<TravelRoute> allRoutes = travelRouteMapper.selectList(query);

        // 按热度排序：收藏数*2 + 浏览数 + 使用次数*3
        allRoutes.sort((a, b) -> {
            long scoreA = (a.getFavoriteCount() != null ? a.getFavoriteCount() : 0) * 2
                    + (a.getViewCount() != null ? a.getViewCount() : 0)
                    + (a.getUseCount() != null ? a.getUseCount() : 0) * 3;
            long scoreB = (b.getFavoriteCount() != null ? b.getFavoriteCount() : 0) * 2
                    + (b.getViewCount() != null ? b.getViewCount() : 0)
                    + (b.getUseCount() != null ? b.getUseCount() : 0) * 3;
            return Long.compare(scoreB, scoreA);
        });

        // 取前limit条
        List<TravelRoute> topRoutes = allRoutes.stream()
                .limit(limit)
                .collect(Collectors.toList());

        // 转换为返回格式
        for (TravelRoute route : topRoutes) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", route.getId());
            item.put("routeName", route.getRouteName());
            item.put("cityId", route.getCityId());
            item.put("days", route.getDays());
            item.put("summary", route.getSummary());
            item.put("coverImage", route.getCoverImage());
            item.put("viewCount", route.getViewCount());
            item.put("favoriteCount", route.getFavoriteCount());
            result.add(item);
        }

        return result;
    }

    @Override
    public List<Map<String, Object>> recommendTravelNotes(Long userId, Integer limit) {
        // 先从缓存获取热门游记
        String cacheKey = HOT_NOTES_KEY;
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cached = redisService.get(cacheKey);
        if (cached != null && cached.size() >= limit) {
            return cached.stream().limit(limit).collect(Collectors.toList());
        }

        // 查询已通过的游记
        TravelNote query = new TravelNote();
        query.setStatus("pass");
        query.setDelFlag(0);
        List<TravelNote> allNotes = travelNoteMapper.selectList(query);

        // 按热度排序：点赞数*2 + 收藏数*3 + 浏览数 + 评论数*2
        Map<Long, Integer> tagWeights = userId != null ? userInterestService.getUserTagWeights(userId) : Collections.emptyMap();
        Map<Long, List<Long>> noteTags = buildContentTagMap("note", allNotes.stream().map(TravelNote::getId).collect(Collectors.toList()));

        allNotes.sort((a, b) -> {
            long scoreA = hotScore(a) + preferenceScore(noteTags.get(a.getId()), tagWeights);
            long scoreB = hotScore(b) + preferenceScore(noteTags.get(b.getId()), tagWeights);
            return Long.compare(scoreB, scoreA);
        });

        // 转换为返回格式
        List<Map<String, Object>> result = new ArrayList<>();
        for (TravelNote note : allNotes.stream().limit(limit).collect(Collectors.toList())) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", note.getId());
            item.put("title", note.getTitle());
            item.put("cityId", note.getCityId());
            item.put("cityName", note.getCityName());
            item.put("viewCount", note.getViewCount());
            item.put("likeCount", note.getLikeCount());
            item.put("favoriteCount", note.getFavoriteCount());
            item.put("isFeatured", note.getIsFeatured());
            result.add(item);
        }

        // 缓存结果
        redisService.set(cacheKey, result, Duration.ofSeconds(CACHE_EXPIRE_SECONDS));

        return result;
    }

    @Override
    public List<Map<String, Object>> recommendScenicSpots(Long userId, Long cityId, Integer limit) {
        return recommendScenicSpots(userId, cityId, null, limit);
    }

    @Override
    public List<Map<String, Object>> recommendScenicSpots(Long userId, Long cityId, String province, Integer limit) {
        // 暂时禁用缓存，确保获取最新数据（包含price字段）
        // 如果需要重新启用缓存，取消下面的注释并注释掉缓存设置部分
        // String cacheKey = HOT_SCENIC_KEY_PREFIX + cityId;
        // @SuppressWarnings("unchecked")
        // List<Map<String, Object>> cached = redisService.get(cacheKey);
        // if (cached != null && cached.size() >= limit) {
        //     return cached.stream().limit(limit).collect(Collectors.toList());
        // }

        List<ScenicSpot> spots;

        // 如果指定了省份，按省份查询前3名；否则查询总得分前3名
        if (province != null && !province.isEmpty()) {
            // 按省份查询热门景点，固定返回前3名
            spots = scenicSpotMapper.selectHotByProvince(province, 3);
        } else {
            // 查询总得分前3名（hot_score * 2 + score）
            spots = scenicSpotMapper.selectTopByTotalScore(3);
        }

        // 如果有用户ID，可以根据用户偏好进一步筛选（但保持前3名的限制）
        Map<Long, Integer> tagWeights = userId != null ? userInterestService.getUserTagWeights(userId) : Collections.emptyMap();
        Map<Long, List<Long>> scenicTags = buildContentTagMap("scenic", spots.stream().map(ScenicSpot::getId).collect(Collectors.toList()));
        spots.sort((a, b) -> {
            long scoreA = hotScore(a) + preferenceScore(scenicTags.get(a.getId()), tagWeights);
            long scoreB = hotScore(b) + preferenceScore(scenicTags.get(b.getId()), tagWeights);
            return Long.compare(scoreB, scoreA);
        });

        // 转换为返回格式
        List<Map<String, Object>> result = new ArrayList<>();
        List<ScenicSpot> limitedSpots = spots.stream().limit(3).collect(Collectors.toList());

        // 批量获取标签名称
        Map<Long, List<String>> tagNamesMap = buildTagNamesMap("scenic",
            limitedSpots.stream().map(ScenicSpot::getId).collect(Collectors.toList()));

        // 获取用户标签（用于判断是否符合用户路线）
        Map<Long, Integer> userTagWeights = userId != null ? userInterestService.getUserTagWeights(userId) : Collections.emptyMap();

        for (ScenicSpot spot : limitedSpots) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", spot.getId());
            item.put("name", spot.getName());
            item.put("cityId", spot.getCityId());
            item.put("city", spot.getCity());
            item.put("province", spot.getProvince());
            item.put("address", spot.getAddress());
            item.put("score", spot.getScore() != null ? spot.getScore().doubleValue() : null);
            item.put("hotScore", spot.getHotScore());
            item.put("intro", spot.getIntro());
            item.put("openTime", spot.getOpenTime());
            item.put("suggestedVisitTime", spot.getSuggestedVisitTime());
            item.put("imageUrl", spot.getImageUrl());
            item.put("isWorldHeritage", spot.getIsWorldHeritage() != null && spot.getIsWorldHeritage() == 1);

            // 处理价格：优先使用price字段，如果为null则从ticket_info中解析
            Double priceValue = null;
            if (spot.getPrice() != null) {
                priceValue = spot.getPrice().doubleValue();
            } else if (spot.getTicketInfo() != null && !spot.getTicketInfo().isEmpty()) {
                // 从ticket_info中提取价格
                priceValue = parsePriceFromTicketInfo(spot.getTicketInfo());
            }
            item.put("price", priceValue);
            item.put("imageUrl", spot.getImageUrl());
            item.put("isWorldHeritage", spot.getIsWorldHeritage() != null && spot.getIsWorldHeritage() == 1);
            item.put("suggestedVisitTime", spot.getSuggestedVisitTime());

            // 获取标签列表
            List<String> tagNames = tagNamesMap.getOrDefault(spot.getId(), Collections.emptyList());
            item.put("tags", tagNames);

            // 判断是否符合用户路线（如果景点标签与用户标签有交集，则认为符合）
            List<Long> spotTagIds = scenicTags.getOrDefault(spot.getId(), Collections.emptyList());
            boolean isMatch = false;
            if (userId != null && !spotTagIds.isEmpty() && !userTagWeights.isEmpty()) {
                for (Long tagId : spotTagIds) {
                    if (userTagWeights.containsKey(tagId) && userTagWeights.get(tagId) > 0) {
                        isMatch = true;
                        break;
                    }
                }
            }
            item.put("isMatchUserRoute", isMatch);

            result.add(item);
        }

        // 暂时禁用缓存，确保获取最新数据（包含price字段）
        // 如果需要重新启用缓存，取消下面的注释
        // redisService.set(cacheKey, result, Duration.ofSeconds(CACHE_EXPIRE_SECONDS));

        return result;
    }

    @Override
    public List<Map<String, Object>> recommendFoods(Long userId, Long cityId, Integer limit) {
        return recommendFoods(userId, cityId, null, limit);
    }

    @Override
    public List<Map<String, Object>> recommendFoods(Long userId, Long cityId, String province, Integer limit) {
        // 如果指定了省份，使用省份查询；否则使用城市查询
        List<Food> foods;
        if (province != null && !province.isEmpty()) {
            // 按省份查询热门美食，固定返回前limit名
            foods = foodMapper.selectHotByProvince(province, limit * 2);
        } else {
            // 先从缓存获取（仅当使用cityId时）
            String cacheKey = HOT_FOOD_KEY_PREFIX + cityId;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> cached = redisService.get(cacheKey);
            if (cached != null && cached.size() >= limit) {
                return cached.stream().limit(limit).collect(Collectors.toList());
            }

            // 查询城市下的热门美食
            foods = foodMapper.selectHotByCityId(cityId, limit * 2);
        }

        // 如果有用户ID，可以根据用户偏好进一步筛选
        Map<Long, Integer> tagWeights = userId != null ? userInterestService.getUserTagWeights(userId) : Collections.emptyMap();
        Map<Long, List<Long>> foodTags = buildContentTagMap("food", foods.stream().map(Food::getId).collect(Collectors.toList()));
        foods.sort((a, b) -> {
            long scoreA = hotScore(a) + preferenceScore(foodTags.get(a.getId()), tagWeights);
            long scoreB = hotScore(b) + preferenceScore(foodTags.get(b.getId()), tagWeights);
            return Long.compare(scoreB, scoreA);
        });

        // 转换为返回格式
        List<Map<String, Object>> result = new ArrayList<>();
        for (Food food : foods.stream().limit(limit).collect(Collectors.toList())) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", food.getId());
            item.put("name", food.getName());
            item.put("cityId", food.getCityId());
            item.put("address", food.getAddress());
            item.put("foodType", food.getFoodType());
            item.put("avgPrice", food.getAvgPrice());
            item.put("imageUrl", food.getImageUrl());
            item.put("score", food.getScore());
            item.put("hotScore", food.getHotScore());
            result.add(item);
        }

        // 缓存结果（仅当使用cityId时）
        if (province == null || province.isEmpty()) {
            String cacheKey = HOT_FOOD_KEY_PREFIX + cityId;
            redisService.set(cacheKey, result, Duration.ofSeconds(CACHE_EXPIRE_SECONDS));
        }

        return result;
    }

    /**
     * 计算游记的热度分数
     */
    private long hotScore(TravelNote note) {
        return (note.getLikeCount() != null ? note.getLikeCount() : 0) * 2
                + (note.getFavoriteCount() != null ? note.getFavoriteCount() : 0) * 3
                + (note.getViewCount() != null ? note.getViewCount() : 0)
                + (note.getCommentCount() != null ? note.getCommentCount() : 0) * 2;
    }

    /**
     * 计算景点热度
     */
    private long hotScore(ScenicSpot spot) {
        long base = (long) (spot.getHotScore() != null ? spot.getHotScore() : 0) * 2;
        double scorePart = spot.getScore() != null ? spot.getScore().doubleValue() : 0d;
        return base + Math.round(scorePart);
    }

    /**
     * 计算美食热度
     */
    private long hotScore(Food food) {
        long base = (long) (food.getHotScore() != null ? food.getHotScore() : 0) * 2;
        double scorePart = food.getScore() != null ? food.getScore().doubleValue() : 0d;
        return base + Math.round(scorePart);
    }

    /**
     * 标签偏好得分
     */
    private long preferenceScore(List<Long> tagIds, Map<Long, Integer> weights) {
        if (tagIds == null || tagIds.isEmpty() || weights == null || weights.isEmpty()) {
            return 0;
        }
        long score = 0;
        for (Long tagId : tagIds) {
            score += weights.getOrDefault(tagId, 0);
        }
        return score;
    }

    private Map<Long, List<Long>> buildContentTagMap(String contentType, List<Long> contentIds) {
        if (contentIds == null || contentIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ContentTag> relations = contentTagMapper.selectByContentIds(contentType, contentIds);
        Map<Long, List<Long>> map = new HashMap<>();
        for (ContentTag ct : relations) {
            map.computeIfAbsent(ct.getContentId(), k -> new ArrayList<>()).add(ct.getTagId());
        }
        return map;
    }

    /**
     * 构建标签名称映射
     */
    private Map<Long, List<String>> buildTagNamesMap(String contentType, List<Long> contentIds) {
        if (contentIds == null || contentIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, List<Long>> contentTagMap = buildContentTagMap(contentType, contentIds);
        Set<Long> tagIds = new HashSet<>();
        for (List<Long> tagIdList : contentTagMap.values()) {
            tagIds.addAll(tagIdList);
        }
        if (tagIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Tag> tags = tagMapper.selectByIds(new ArrayList<>(tagIds));
        Map<Long, String> tagIdToNameMap = new HashMap<>();
        for (Tag tag : tags) {
            tagIdToNameMap.put(tag.getId(), tag.getTagName());
        }
        Map<Long, List<String>> result = new HashMap<>();
        for (Map.Entry<Long, List<Long>> entry : contentTagMap.entrySet()) {
            List<String> tagNames = new ArrayList<>();
            for (Long tagId : entry.getValue()) {
                String tagName = tagIdToNameMap.get(tagId);
                if (tagName != null) {
                    tagNames.add(tagName);
                }
            }
            result.put(entry.getKey(), tagNames);
        }
        return result;
    }

    /**
     * 从ticket_info字符串中解析价格
     * 例如："58元/人" -> 58.0, "免费" -> 0.0, "120元/人" -> 120.0
     */
    private Double parsePriceFromTicketInfo(String ticketInfo) {
        if (ticketInfo == null || ticketInfo.isEmpty()) {
            return null;
        }

        // 如果包含"免费"，返回0
        if (ticketInfo.contains("免费")) {
            return 0.0;
        }

        // 使用正则表达式提取数字
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("([0-9]+\\.?[0-9]*)");
        java.util.regex.Matcher matcher = pattern.matcher(ticketInfo);

        if (matcher.find()) {
            try {
                return Double.parseDouble(matcher.group(1));
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }
}
