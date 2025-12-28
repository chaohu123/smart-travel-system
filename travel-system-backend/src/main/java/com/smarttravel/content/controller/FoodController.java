package com.smarttravel.content.controller;

import com.smarttravel.content.service.FoodService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 美食管理接口
 */
@RestController
@RequestMapping("/api/v1/food")
@CrossOrigin
public class FoodController {

    @Resource
    private FoodService foodService;

    /**
     * 查询美食列表
     */
    @GetMapping("/list")
    public Map<String, Object> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) String tagName,
            @RequestParam(defaultValue = "hot") String sortBy) {
        Map<String, Object> result = foodService.listFoods(pageNum, pageSize, cityId, tagName, sortBy);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 查询美食详情
     */
    @GetMapping("/{id}")
    public Map<String, Object> getDetail(@PathVariable Long id) {
        Map<String, Object> result = foodService.getFoodDetail(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 查询热门美食（用于首页）
     */
    @GetMapping("/hot")
    public Map<String, Object> getHotFoods(
            @RequestParam(required = false) Long cityId,
            @RequestParam(defaultValue = "10") Integer limit) {
        List result = foodService.getHotFoods(cityId, limit);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }
}




























