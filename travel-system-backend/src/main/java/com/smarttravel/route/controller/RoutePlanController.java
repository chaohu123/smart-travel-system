package com.smarttravel.route.controller;

import com.smarttravel.route.service.RoutePlanService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 线路规划接口
 */
@RestController
@RequestMapping("/api/v1/route")
@CrossOrigin
public class RoutePlanController {

    @Resource
    private RoutePlanService routePlanService;

    /**
     * 生成旅游线路
     */
    @PostMapping("/generate")
    public Map<String, Object> generateRoute(@RequestBody Map<String, Object> request) {
        Long cityId = Long.valueOf(request.get("cityId").toString());
        Integer days = Integer.valueOf(request.get("days").toString());
        List<Long> tagIds = null;
        Object tagObj = request.get("tagIds");
        if (tagObj instanceof List) {
            tagIds = new java.util.ArrayList<>();
            for (Object o : (List<?>) tagObj) {
                if (o != null) {
                    tagIds.add(Long.valueOf(o.toString()));
                }
            }
        }
        String budget = request.get("budget") != null ? request.get("budget").toString() : null;
        String suitablePeople = request.get("suitablePeople") != null ?
            request.get("suitablePeople").toString() : null;
        Boolean useAi = request.get("useAi") != null ?
            Boolean.valueOf(request.get("useAi").toString()) : true;

        Long routeId = routePlanService.generateRoute(cityId, days, tagIds, budget, suitablePeople, useAi);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", Collections.singletonMap("routeId", routeId));
        return response;
    }

    /**
     * 查询线路详情
     */
    @GetMapping("/{id}")
    public Map<String, Object> getRouteDetail(@PathVariable Long id) {
        Map<String, Object> result = routePlanService.getRouteDetail(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 收藏/取消收藏线路
     */
    @PostMapping("/favorite")
    public Map<String, Object> toggleFavorite(@RequestParam Long userId, @RequestParam Long routeId) {
        Map<String, Object> result = routePlanService.toggleFavorite(userId, routeId);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 查询我的行程列表
     */
    @GetMapping("/my")
    public Map<String, Object> listMyRoutes(@RequestParam Long userId) {
        List<Map<String, Object>> list = routePlanService.listMyRoutes(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", list);
        return response;
    }
}


