package com.smarttravel.recommend.controller;

import com.smarttravel.recommend.service.RecommendService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 推荐接口
 */
@RestController
@RequestMapping("/api/v1/recommend")
@CrossOrigin
public class RecommendController {

    @Resource
    private RecommendService recommendService;

    /**
     * 首页推荐旅游线路接口
     * GET /api/v1/recommend/routes?userId=1&limit=10
     */
    @GetMapping("/routes")
    public Map<String, Object> recommendRoutes(@RequestParam(required = false) Long userId,
                                                @RequestParam(defaultValue = "10") Integer limit) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<Map<String, Object>> data = recommendService.recommendRoutes(userId, limit);
            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", data);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "推荐失败：" + e.getMessage());
        }

        return response;
    }

    /**
     * 首页推荐游记接口
     * GET /api/v1/recommend/travel-notes?userId=1&limit=10
     */
    @GetMapping("/travel-notes")
    public Map<String, Object> recommendTravelNotes(@RequestParam(required = false) Long userId,
                                                     @RequestParam(defaultValue = "10") Integer limit) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<Map<String, Object>> data = recommendService.recommendTravelNotes(userId, limit);
            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", data);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "推荐失败：" + e.getMessage());
        }

        return response;
    }

    /**
     * 推荐景点接口
     * GET /api/v1/recommend/scenic-spots?userId=1&cityId=1&province=浙江&limit=3
     */
    @GetMapping("/scenic-spots")
    public Map<String, Object> recommendScenicSpots(@RequestParam(required = false) Long userId,
                                                      @RequestParam(required = false) Long cityId,
                                                      @RequestParam(required = false) String province,
                                                      @RequestParam(defaultValue = "3") Integer limit) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<Map<String, Object>> data = recommendService.recommendScenicSpots(userId, cityId, province, limit);
            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", data);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "推荐失败：" + e.getMessage());
        }

        return response;
    }

    /**
     * 推荐美食接口
     * GET /api/v1/recommend/foods?userId=1&cityId=1&province=北京&limit=10
     */
    @GetMapping("/foods")
    public Map<String, Object> recommendFoods(@RequestParam(required = false) Long userId,
                                               @RequestParam(required = false) Long cityId,
                                               @RequestParam(required = false) String province,
                                               @RequestParam(defaultValue = "10") Integer limit) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 记录请求参数
            System.out.println("[推荐美食API] 请求参数: userId=" + userId + ", cityId=" + cityId + ", province=" + province + ", limit=" + limit);
            List<Map<String, Object>> data = recommendService.recommendFoods(userId, cityId, province, limit);
            System.out.println("[推荐美食API] 返回数据数量: " + (data != null ? data.size() : 0));
            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", data);
        } catch (Exception e) {
            System.err.println("[推荐美食API] 异常: " + e.getMessage());
            e.printStackTrace();
            response.put("code", 500);
            response.put("msg", "推荐失败：" + e.getMessage());
        }

        return response;
    }
}

