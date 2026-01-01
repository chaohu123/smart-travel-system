package com.smarttravel.content.controller;

import com.smarttravel.content.domain.Activity;
import com.smarttravel.content.mapper.ActivityMapper;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.mapper.FoodMapper;
import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.domain.Food;
import com.smarttravel.route.mapper.TravelRouteMapper;
import com.smarttravel.route.domain.TravelRoute;
import com.smarttravel.travel.mapper.TravelNoteMapper;
import com.smarttravel.travel.domain.TravelNote;
import com.smarttravel.content.mapper.TravelNoteImageMapper;
import com.smarttravel.content.domain.TravelNoteImage;
import com.smarttravel.user.mapper.UserMapper;
import com.smarttravel.user.domain.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.*;

/**
 * 活动接口（用户端）
 */
@RestController
@RequestMapping("/api/v1/activity")
@CrossOrigin
public class ActivityController {

    @Resource
    private ActivityMapper activityMapper;

    @Resource
    private TravelRouteMapper routeMapper;

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private FoodMapper foodMapper;

    @Resource
    private TravelNoteMapper travelNoteMapper;

    @Resource
    private TravelNoteImageMapper travelNoteImageMapper;

    @Resource
    private UserMapper userMapper;

    @Resource
    private ObjectMapper objectMapper;

    /**
     * 获取活动列表
     * GET /api/v1/activity/list?status=online&pageNum=1&pageSize=10
     */
    @GetMapping("/list")
    public Map<String, Object> list(@RequestParam(required = false) String status,
                                   @RequestParam(defaultValue = "1") Integer pageNum,
                                   @RequestParam(defaultValue = "10") Integer pageSize) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Activity query = new Activity();
            query.setDelFlag(0);
            if (status != null && !status.isEmpty()) {
                query.setStatus(status);
            }

            Integer offset = (pageNum - 1) * pageSize;
            int total = activityMapper.countList(query);
            List<Activity> list = activityMapper.selectListWithPage(query, offset, pageSize);

            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", new HashMap<String, Object>() {{
                put("rows", list);
                put("total", total);
            }});
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "查询失败：" + e.getMessage());
        }

        return result;
    }

    /**
     * 获取活动详情
     * GET /api/v1/activity/{id}
     */
    @GetMapping("/{id}")
    public Map<String, Object> getDetail(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Activity activity = activityMapper.selectById(id);
            if (activity == null || activity.getDelFlag() != 0) {
                result.put("code", 404);
                result.put("msg", "活动不存在");
                return result;
            }

            // 构建详情对象，包含关联内容
            Map<String, Object> detail = new HashMap<>();
            detail.put("id", activity.getId());
            detail.put("name", activity.getName());
            detail.put("highlight", activity.getHighlight());
            detail.put("description", activity.getDescription());
            detail.put("rules", activity.getRules());
            detail.put("imageUrl", activity.getImageUrl());
            detail.put("startTime", activity.getStartTime());
            detail.put("endTime", activity.getEndTime());
            detail.put("status", activity.getStatus());

            // 加载关联路线
            List<Map<String, Object>> relatedRoutes = new ArrayList<>();
            if (activity.getRelatedRouteIds() != null && !activity.getRelatedRouteIds().isEmpty()) {
                try {
                    List<Long> routeIds = objectMapper.readValue(activity.getRelatedRouteIds(), new TypeReference<List<Long>>() {});
                    if (routeIds != null) {
                        for (Long routeId : routeIds) {
                        TravelRoute route = routeMapper.selectById(routeId);
                        if (route != null && route.getDelFlag() == 0) {
                            Map<String, Object> routeMap = new HashMap<>();
                            routeMap.put("id", route.getId());
                            routeMap.put("routeName", route.getRouteName());
                            routeMap.put("coverImage", route.getCoverImage());
                            routeMap.put("days", route.getDays());
                            routeMap.put("favoriteCount", route.getFavoriteCount());
                            relatedRoutes.add(routeMap);
                        }
                    }
                    }
                } catch (Exception e) {
                    // 忽略JSON解析错误
                }
            }
            detail.put("relatedRoutes", relatedRoutes);

            // 加载关联景点
            List<Map<String, Object>> relatedScenics = new ArrayList<>();
            if (activity.getRelatedScenicIds() != null && !activity.getRelatedScenicIds().isEmpty()) {
                try {
                    List<Long> scenicIds = objectMapper.readValue(activity.getRelatedScenicIds(), new TypeReference<List<Long>>() {});
                    if (scenicIds != null) {
                        for (Long scenicId : scenicIds) {
                        ScenicSpot scenic = scenicSpotMapper.selectById(scenicId);
                        if (scenic != null && scenic.getDelFlag() == 0) {
                            Map<String, Object> scenicMap = new HashMap<>();
                            scenicMap.put("id", scenic.getId());
                            scenicMap.put("name", scenic.getName());
                            scenicMap.put("imageUrl", scenic.getImageUrl());
                            scenicMap.put("score", scenic.getScore());
                            scenicMap.put("city", scenic.getCity());
                            relatedScenics.add(scenicMap);
                        }
                    }
                    }
                } catch (Exception e) {
                    // 忽略JSON解析错误
                }
            }
            detail.put("relatedScenics", relatedScenics);

            // 加载关联美食
            List<Map<String, Object>> relatedFoods = new ArrayList<>();
            if (activity.getRelatedFoodIds() != null && !activity.getRelatedFoodIds().isEmpty()) {
                try {
                    List<Long> foodIds = objectMapper.readValue(activity.getRelatedFoodIds(), new TypeReference<List<Long>>() {});
                    if (foodIds != null) {
                        for (Long foodId : foodIds) {
                        Food food = foodMapper.selectById(foodId);
                        if (food != null && food.getDelFlag() == 0) {
                            Map<String, Object> foodMap = new HashMap<>();
                            foodMap.put("id", food.getId());
                            foodMap.put("name", food.getName());
                            foodMap.put("imageUrl", food.getImageUrl());
                            foodMap.put("foodType", food.getFoodType());
                            foodMap.put("avgPrice", food.getAvgPrice());
                            relatedFoods.add(foodMap);
                        }
                    }
                    }
                } catch (Exception e) {
                    // 忽略JSON解析错误
                }
            }
            detail.put("relatedFoods", relatedFoods);

            // 加载关联游记
            List<Map<String, Object>> relatedNotes = new ArrayList<>();
            if (activity.getRelatedNoteIds() != null && !activity.getRelatedNoteIds().isEmpty()) {
                try {
                    List<Long> noteIds = objectMapper.readValue(activity.getRelatedNoteIds(), new TypeReference<List<Long>>() {});
                    if (noteIds != null) {
                        for (Long noteId : noteIds) {
                        TravelNote note = travelNoteMapper.selectById(noteId);
                        if (note != null && note.getDelFlag() == 0) {
                            Map<String, Object> noteMap = new HashMap<>();
                            noteMap.put("id", note.getId());
                            noteMap.put("title", note.getTitle());
                            
                            // 获取封面图（第一张图片）
                            List<TravelNoteImage> images = travelNoteImageMapper.selectByNoteId(noteId);
                            if (images != null && !images.isEmpty()) {
                                noteMap.put("coverImage", images.get(0).getUrl());
                            } else {
                                noteMap.put("coverImage", null);
                            }
                            
                            // 获取作者信息
                            if (note.getUserId() != null) {
                                User author = userMapper.selectById(note.getUserId());
                                if (author != null) {
                                    noteMap.put("authorName", author.getNickname());
                                } else {
                                    noteMap.put("authorName", "匿名用户");
                                }
                            } else {
                                noteMap.put("authorName", "匿名用户");
                            }
                            
                            noteMap.put("viewCount", note.getViewCount() != null ? note.getViewCount() : 0);
                            relatedNotes.add(noteMap);
                        }
                    }
                    }
                } catch (Exception e) {
                    // 忽略JSON解析错误
                }
            }
            detail.put("relatedNotes", relatedNotes);

            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", detail);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "查询失败：" + e.getMessage());
        }

        return result;
    }
}

