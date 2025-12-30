package com.smarttravel.content.controller;

import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.service.ScenicSpotService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 景点管理接口
 */
@RestController
@RequestMapping("/api/v1/scenic")
@CrossOrigin
public class ScenicSpotController {

    @Resource
    private ScenicSpotService scenicSpotService;

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    /**
     * 查询景点列表
     */
    @GetMapping("/list")
    public Map<String, Object> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) String tagName,
            @RequestParam(defaultValue = "hot") String sortBy) {
        Map<String, Object> result = scenicSpotService.listSpots(pageNum, pageSize, cityId, tagName, sortBy);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 查询景点详情
     */
    @GetMapping("/{id}")
    public Map<String, Object> getDetail(@PathVariable Long id) {
        Map<String, Object> result = scenicSpotService.getSpotDetail(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 查询热门景点（用于首页）
     */
    @GetMapping("/hot")
    public Map<String, Object> getHotSpots(
            @RequestParam(required = false) Long cityId,
            @RequestParam(defaultValue = "10") Integer limit) {
        List result = scenicSpotService.getHotSpots(cityId, limit);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 增加景点热度
     * POST /api/v1/scenic/{id}/increment-hot
     */
    @PostMapping("/{id}/increment-hot")
    public Map<String, Object> incrementHotScore(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            int result = scenicSpotMapper.incrementHotScore(id, 10);
            if (result > 0) {
                response.put("code", 200);
                response.put("msg", "success");
            } else {
                response.put("code", 404);
                response.put("msg", "景点不存在");
            }
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "操作失败：" + e.getMessage());
        }
        return response;
    }

    /**
     * 获取用户收藏的景点列表
     */
    @GetMapping("/my/favorites")
    public Map<String, Object> getMyFavorites(@RequestParam Long userId) {
        Map<String, Object> result = scenicSpotService.getMyFavorites(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }
}















