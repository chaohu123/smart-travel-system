package com.smarttravel.content.controller;

import com.smarttravel.content.service.CheckinService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * 打卡接口
 */
@RestController
@RequestMapping("/api/v1/checkin")
@CrossOrigin
public class CheckinController {

    @Resource
    private CheckinService checkinService;

    /**
     * 新增打卡接口
     * POST /api/v1/checkin/add
     */
    @PostMapping("/add")
    public Map<String, Object> addCheckin(@RequestBody Map<String, Object> params) {
        Map<String, Object> response = new HashMap<>();

        try {
            Long userId = Long.valueOf(params.get("userId").toString());
            String targetType = params.get("targetType").toString(); // scenic/food
            Long targetId = Long.valueOf(params.get("targetId").toString());
            String photoUrl = params.get("photoUrl") != null ? params.get("photoUrl").toString() : null;
            String content = params.get("content") != null ? params.get("content").toString() : null;
            BigDecimal latitude = params.get("latitude") != null ?
                new BigDecimal(params.get("latitude").toString()) : null;
            BigDecimal longitude = params.get("longitude") != null ?
                new BigDecimal(params.get("longitude").toString()) : null;

            Long checkinId = checkinService.addCheckin(userId, targetType, targetId,
                photoUrl, content, latitude, longitude);

            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", checkinId);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "打卡失败：" + e.getMessage());
        }

        return response;
    }

    /**
     * 我的打卡列表查询
     * GET /api/v1/checkin/my?userId=1&pageNum=1&pageSize=10
     */
    @GetMapping("/my")
    public Map<String, Object> getMyCheckins(@RequestParam Long userId,
                                              @RequestParam(defaultValue = "1") Integer pageNum,
                                              @RequestParam(defaultValue = "10") Integer pageSize) {
        Map<String, Object> response = new HashMap<>();

        try {
            Map<String, Object> data = checkinService.getMyCheckins(userId, pageNum, pageSize);
            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", data);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "查询失败：" + e.getMessage());
        }

        return response;
    }

    /**
     * 某景点/美食的打卡展示接口
     * GET /api/v1/checkin/target?targetType=scenic&targetId=1&pageNum=1&pageSize=10
     */
    @GetMapping("/target")
    public Map<String, Object> getCheckinsByTarget(@RequestParam String targetType,
                                                     @RequestParam Long targetId,
                                                     @RequestParam(defaultValue = "1") Integer pageNum,
                                                     @RequestParam(defaultValue = "10") Integer pageSize) {
        Map<String, Object> response = new HashMap<>();

        try {
            Map<String, Object> data = checkinService.getCheckinsByTarget(targetType, targetId, pageNum, pageSize);
            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", data);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "查询失败：" + e.getMessage());
        }

        return response;
    }

    /**
     * 单条打卡详情
     * GET /api/v1/checkin/detail/{id}
     */
    @GetMapping("/detail/{id}")
    public Map<String, Object> getDetail(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> data = checkinService.getCheckinDetail(id);
            response.put("code", 200);
            response.put("msg", data == null ? "not found" : "success");
            response.put("data", data);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "查询失败：" + e.getMessage());
        }
        return response;
    }
}





