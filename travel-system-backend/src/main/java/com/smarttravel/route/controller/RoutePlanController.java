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

        // 获取用户选择的景点ID列表
        List<Long> selectedScenicIds = null;
        Object scenicObj = request.get("selectedScenicIds");
        if (scenicObj instanceof List) {
            selectedScenicIds = new java.util.ArrayList<>();
            for (Object o : (List<?>) scenicObj) {
                if (o != null) {
                    selectedScenicIds.add(Long.valueOf(o.toString()));
                }
            }
        }

        // 获取用户选择的美食ID列表
        List<Long> selectedFoodIds = null;
        Object foodObj = request.get("selectedFoodIds");
        if (foodObj instanceof List) {
            selectedFoodIds = new java.util.ArrayList<>();
            for (Object o : (List<?>) foodObj) {
                if (o != null) {
                    selectedFoodIds.add(Long.valueOf(o.toString()));
                }
            }
        }

        // 获取每天的选择数据
        List<Map<String, Object>> dailySelections = null;
        Object dailySelectionsObj = request.get("dailySelections");
        if (dailySelectionsObj instanceof List) {
            dailySelections = new java.util.ArrayList<>();
            for (Object o : (List<?>) dailySelectionsObj) {
                if (o instanceof Map) {
                    // 将原始 Map 复制为 Map<String, Object>（避免未检查强转告警）
                    Map<String, Object> copied = new java.util.HashMap<>();
                    Map<?, ?> raw = (Map<?, ?>) o;
                    for (Map.Entry<?, ?> entry : raw.entrySet()) {
                        Object k = entry.getKey();
                        if (k != null) {
                            copied.put(k.toString(), entry.getValue());
                        }
                    }
                    dailySelections.add(copied);
                }
            }
        }

        // 获取开始日期和结束日期
        String startDate = request.get("startDate") != null ? request.get("startDate").toString() : null;
        String endDate = request.get("endDate") != null ? request.get("endDate").toString() : null;

        Long routeId = routePlanService.generateRoute(cityId, days, tagIds, budget, suitablePeople, useAi,
            selectedScenicIds, selectedFoodIds, dailySelections, startDate, endDate);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        Map<String, Object> data = new HashMap<>();
        data.put("routeId", routeId);
        // 方便测试：返回 AI 可用性与本次是否使用（以落库字段为准）
        data.put("aiAvailable", useAi && routePlanService != null); // 仅标识请求希望使用AI
        try {
            Map<String, Object> detail = routePlanService.getRouteDetail(routeId);
            Object routeObj = detail != null ? detail.get("route") : null;
            if (routeObj instanceof com.smarttravel.route.domain.TravelRoute) {
                com.smarttravel.route.domain.TravelRoute r = (com.smarttravel.route.domain.TravelRoute) routeObj;
                data.put("aiUsed", r.getAiUsed() != null && r.getAiUsed() == 1);
            }
        } catch (Exception ignored) {
        }
        response.put("data", data);
        return response;
    }

    /**
     * 记录路线浏览（浏览量 +1），无需登录
     */
    @PostMapping("/{id}/view")
    public Map<String, Object> recordRouteView(@PathVariable Long id) {
        boolean ok = routePlanService.incrementRouteViewCount(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", ok ? 200 : 404);
        response.put("msg", ok ? "success" : "route not found");
        response.put("data", Collections.singletonMap("ok", ok));
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

    /**
     * 更新路线名称（用于“保存时命名/历史编辑”）
     */
    @PutMapping("/{id}/name")
    public Map<String, Object> updateRouteName(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String routeName = body != null && body.get("routeName") != null ? body.get("routeName").toString() : null;
        boolean ok = routePlanService.updateRouteName(id, routeName);
        Map<String, Object> response = new HashMap<>();
        response.put("code", ok ? 200 : 400);
        response.put("msg", ok ? "success" : "invalid routeName");
        response.put("data", ok ? Collections.singletonMap("updated", true) : Collections.emptyMap());
        return response;
    }

    /**
     * 弃用/删除路线（用于“返回后弃用/历史删除”）
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> discardRoute(@PathVariable Long id) {
        boolean ok = routePlanService.discardRoute(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", ok ? 200 : 400);
        response.put("msg", ok ? "success" : "discard failed");
        response.put("data", ok ? Collections.singletonMap("discarded", true) : Collections.emptyMap());
        return response;
    }
}


