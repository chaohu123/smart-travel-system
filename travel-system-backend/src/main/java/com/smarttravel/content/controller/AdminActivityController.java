package com.smarttravel.content.controller;

import com.smarttravel.content.domain.Activity;
import com.smarttravel.content.mapper.ActivityMapper;
import com.smarttravel.content.mapper.ActivityRegistrationMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * 活动管理接口（管理端）
 */
@RestController
@RequestMapping("/api/v1/admin/activity")
@CrossOrigin
public class AdminActivityController {

    @Resource
    private ActivityMapper activityMapper;

    @Resource
    private ActivityRegistrationMapper activityRegistrationMapper;

    @Resource
    private ObjectMapper objectMapper;

    @GetMapping("/list")
    public Map<String, Object> list(Activity query,
                                    @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                    @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (query == null) {
                query = new Activity();
            }
            query.setDelFlag(0);

            // 参数验证
            if (pageNum < 1) {
                pageNum = 1;
            }
            if (pageSize < 1 || pageSize > 100) {
                pageSize = 10;
            }

            Integer offset = (pageNum - 1) * pageSize;
            int total = activityMapper.countList(query);
            List<Activity> list = activityMapper.selectListWithPage(query, offset, pageSize);

            // 转换关联ID数组为前端需要的格式
            List<Map<String, Object>> resultList = new ArrayList<>();
            for (Activity activity : list) {
                Map<String, Object> activityMap = convertActivityToMap(activity);
                resultList.add(activityMap);
            }

            result.put("code", 200);
            result.put("msg", "success");
            result.put("rows", resultList);
            result.put("total", total);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "查询失败：" + e.getMessage());
        }
        
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (id == null || id <= 0) {
                result.put("code", 400);
                result.put("msg", "活动ID无效");
                return result;
            }
            
            Activity activity = activityMapper.selectById(id);
            if (activity == null) {
                result.put("code", 404);
                result.put("msg", "活动不存在");
                return result;
            }
            
            Map<String, Object> activityMap = convertActivityToMap(activity);
            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", activityMap);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "查询失败：" + e.getMessage());
        }
        
        return result;
    }

    @PostMapping
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> create(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 数据验证
            String name = (String) params.get("name");
            if (name == null || name.trim().isEmpty()) {
                result.put("code", 400);
                result.put("msg", "活动名称不能为空");
                return result;
            }
            if (name.length() > 200) {
                result.put("code", 400);
                result.put("msg", "活动名称长度不能超过200个字符");
                return result;
            }

            Activity activity = new Activity();
            activity.setName(name.trim());
            activity.setHighlight((String) params.get("highlight"));
            activity.setDescription((String) params.get("description"));
            activity.setRules((String) params.get("rules"));
            activity.setImageUrl((String) params.get("imageUrl"));
            
            // 处理时间
            String startTime = (String) params.get("startTime");
            String endTime = (String) params.get("endTime");
            if (startTime != null && !startTime.isEmpty()) {
                activity.setStartTime(validateAndFormatTime(startTime));
            }
            if (endTime != null && !endTime.isEmpty()) {
                activity.setEndTime(validateAndFormatTime(endTime));
            }
            
            // 验证时间逻辑
            if (activity.getStartTime() != null && activity.getEndTime() != null) {
                if (!validateTimeRange(activity.getStartTime(), activity.getEndTime())) {
                    result.put("code", 400);
                    result.put("msg", "结束时间不能早于开始时间");
                    return result;
                }
            }
            
            // 状态验证
            String status = (String) params.get("status");
            if (status != null && !status.isEmpty()) {
                if (!isValidStatus(status)) {
                    result.put("code", 400);
                    result.put("msg", "活动状态无效，可选值：online, offline, upcoming, ended");
                    return result;
                }
                activity.setStatus(status);
            } else {
                activity.setStatus("online"); // 默认上线
            }
            
            activity.setLinkUrl((String) params.get("linkUrl"));

            // 转换关联ID数组为JSON字符串
            activity.setRelatedRouteIds(convertIdsToJson(params.get("relatedRouteIds")));
            activity.setRelatedScenicIds(convertIdsToJson(params.get("relatedScenicIds")));
            activity.setRelatedFoodIds(convertIdsToJson(params.get("relatedFoodIds")));
            activity.setRelatedNoteIds(convertIdsToJson(params.get("relatedNoteIds")));

            activity.setDelFlag(0);

            activityMapper.insert(activity);
            result.put("code", 200);
            result.put("msg", "创建成功");
            result.put("data", activity.getId());
        } catch (IllegalArgumentException e) {
            result.put("code", 400);
            result.put("msg", e.getMessage());
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "创建失败：" + e.getMessage());
        }

        return result;
    }

    @PutMapping
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> update(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<>();

        try {
            Object idObj = params.get("id");
            if (idObj == null) {
                result.put("code", 400);
                result.put("msg", "ID不能为空");
                return result;
            }
            Long id = Long.valueOf(idObj.toString());

            Activity existing = activityMapper.selectById(id);
            if (existing == null) {
                result.put("code", 404);
                result.put("msg", "活动不存在");
                return result;
            }

            Activity activity = new Activity();
            activity.setId(id);
            
            // 更新名称
            if (params.get("name") != null) {
                String name = ((String) params.get("name")).trim();
                if (name.isEmpty()) {
                    result.put("code", 400);
                    result.put("msg", "活动名称不能为空");
                    return result;
                }
                if (name.length() > 200) {
                    result.put("code", 400);
                    result.put("msg", "活动名称长度不能超过200个字符");
                    return result;
                }
                activity.setName(name);
            }
            
            if (params.get("highlight") != null) {
                activity.setHighlight((String) params.get("highlight"));
            }
            if (params.get("description") != null) {
                activity.setDescription((String) params.get("description"));
            }
            if (params.get("rules") != null) {
                activity.setRules((String) params.get("rules"));
            }
            if (params.get("imageUrl") != null) {
                activity.setImageUrl((String) params.get("imageUrl"));
            }
            
            // 处理时间
            String startTime = (String) params.get("startTime");
            String endTime = (String) params.get("endTime");
            String finalStartTime = startTime != null && !startTime.isEmpty() 
                ? validateAndFormatTime(startTime) : existing.getStartTime();
            String finalEndTime = endTime != null && !endTime.isEmpty() 
                ? validateAndFormatTime(endTime) : existing.getEndTime();
            
            if (startTime != null) {
                activity.setStartTime(finalStartTime);
            }
            if (endTime != null) {
                activity.setEndTime(finalEndTime);
            }
            
            // 验证时间逻辑
            if (finalStartTime != null && finalEndTime != null) {
                if (!validateTimeRange(finalStartTime, finalEndTime)) {
                    result.put("code", 400);
                    result.put("msg", "结束时间不能早于开始时间");
                    return result;
                }
            }
            
            // 状态验证
            if (params.get("status") != null) {
                String status = (String) params.get("status");
                if (!isValidStatus(status)) {
                    result.put("code", 400);
                    result.put("msg", "活动状态无效，可选值：online, offline, upcoming, ended");
                    return result;
                }
                activity.setStatus(status);
            }
            
            if (params.get("linkUrl") != null) {
                activity.setLinkUrl((String) params.get("linkUrl"));
            }

            // 转换关联ID数组为JSON字符串（如果提供了新值）
            if (params.get("relatedRouteIds") != null) {
                activity.setRelatedRouteIds(convertIdsToJson(params.get("relatedRouteIds")));
            }
            if (params.get("relatedScenicIds") != null) {
                activity.setRelatedScenicIds(convertIdsToJson(params.get("relatedScenicIds")));
            }
            if (params.get("relatedFoodIds") != null) {
                activity.setRelatedFoodIds(convertIdsToJson(params.get("relatedFoodIds")));
            }
            if (params.get("relatedNoteIds") != null) {
                activity.setRelatedNoteIds(convertIdsToJson(params.get("relatedNoteIds")));
            }

            activityMapper.update(activity);
            result.put("code", 200);
            result.put("msg", "更新成功");
        } catch (IllegalArgumentException e) {
            result.put("code", 400);
            result.put("msg", e.getMessage());
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "更新失败：" + e.getMessage());
        }

        return result;
    }

    @DeleteMapping("/{id}")
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> delete(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();

        try {
            if (id == null || id <= 0) {
                result.put("code", 400);
                result.put("msg", "活动ID无效");
                return result;
            }
            
            Activity existing = activityMapper.selectByIdWithoutDelFlag(id);
            if (existing == null) {
                result.put("code", 404);
                result.put("msg", "活动不存在");
                return result;
            }

            int rows = activityMapper.deleteByIdPhysically(id);
            if (rows > 0) {
                result.put("code", 200);
                result.put("msg", "删除成功");
            } else {
                result.put("code", 500);
                result.put("msg", "删除失败");
            }
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "删除操作异常: " + e.getMessage());
        }

        return result;
    }

    /**
     * 批量删除活动
     * POST /api/v1/admin/activity/batch-delete
     * Body: { "ids": [1, 2, 3] }
     */
    @PostMapping("/batch-delete")
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> batchDelete(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<>();

        try {
            Object idsObj = params.get("ids");
            if (idsObj == null) {
                result.put("code", 400);
                result.put("msg", "请提供要删除的活动ID列表");
                return result;
            }

            List<Long> ids;
            if (idsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Object> idList = (List<Object>) idsObj;
                ids = new ArrayList<>();
                for (Object idObj : idList) {
                    if (idObj != null) {
                        ids.add(Long.valueOf(idObj.toString()));
                    }
                }
            } else if (idsObj instanceof String) {
                // 如果是JSON字符串，解析它
                try {
                    ids = objectMapper.readValue((String) idsObj, new TypeReference<List<Long>>() {});
                } catch (Exception e) {
                    result.put("code", 400);
                    result.put("msg", "活动ID列表格式不正确");
                    return result;
                }
            } else {
                result.put("code", 400);
                result.put("msg", "活动ID列表格式不正确");
                return result;
            }

            if (ids.isEmpty()) {
                result.put("code", 400);
                result.put("msg", "请至少选择一个活动");
                return result;
            }

            int successCount = 0;
            int failCount = 0;
            List<String> errors = new ArrayList<>();

            for (Long id : ids) {
                try {
                    Activity existing = activityMapper.selectByIdWithoutDelFlag(id);
                    if (existing == null) {
                        failCount++;
                        errors.add("活动ID " + id + " 不存在");
                        continue;
                    }

                    int rows = activityMapper.deleteByIdPhysically(id);
                    if (rows > 0) {
                        successCount++;
                    } else {
                        failCount++;
                        errors.add("活动ID " + id + " 删除失败");
                    }
                } catch (Exception e) {
                    failCount++;
                    errors.add("活动ID " + id + " 删除异常: " + e.getMessage());
                }
            }

            result.put("code", 200);
            result.put("msg", String.format("批量删除完成：成功 %d 个，失败 %d 个", successCount, failCount));
            result.put("successCount", successCount);
            result.put("failCount", failCount);
            if (!errors.isEmpty()) {
                result.put("errors", errors);
            }
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "批量删除操作异常: " + e.getMessage());
        }

        return result;
    }

    /**
     * 将Activity实体转换为Map，包含转换后的关联ID数组
     */
    private Map<String, Object> convertActivityToMap(Activity activity) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", activity.getId());
        map.put("name", activity.getName());
        map.put("highlight", activity.getHighlight());
        map.put("description", activity.getDescription());
        map.put("rules", activity.getRules());
        map.put("imageUrl", activity.getImageUrl());
        map.put("startTime", activity.getStartTime());
        map.put("endTime", activity.getEndTime());
        map.put("status", activity.getStatus());
        map.put("linkUrl", activity.getLinkUrl());
        map.put("createTime", activity.getCreateTime());
        map.put("updateTime", activity.getUpdateTime());
        
        // 转换关联ID JSON字符串为数组
        map.put("relatedRouteIds", parseJsonArray(activity.getRelatedRouteIds()));
        map.put("relatedScenicIds", parseJsonArray(activity.getRelatedScenicIds()));
        map.put("relatedFoodIds", parseJsonArray(activity.getRelatedFoodIds()));
        map.put("relatedNoteIds", parseJsonArray(activity.getRelatedNoteIds()));
        
        return map;
    }
    
    /**
     * 解析JSON数组字符串为List
     */
    private List<Long> parseJsonArray(String jsonStr) {
        if (jsonStr == null || jsonStr.isEmpty() || "null".equals(jsonStr)) {
            return new ArrayList<>();
        }
        try {
            List<Long> result = objectMapper.readValue(jsonStr, new TypeReference<List<Long>>() {});
            return result != null ? result : new ArrayList<>();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
    
    /**
     * 将ID数组转换为JSON字符串
     */
    private String convertIdsToJson(Object ids) {
        if (ids == null) {
            return null;
        }
        if (ids instanceof String) {
            String str = (String) ids;
            if (str.isEmpty() || "null".equals(str)) {
                return null;
            }
            // 如果已经是JSON字符串，直接返回
            if (str.trim().startsWith("[")) {
                return str;
            }
            return null;
        }
        // 如果是数组或列表，转换为JSON
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * 验证时间格式并格式化
     */
    private String validateAndFormatTime(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return null;
        }
        
        // 支持多种时间格式
        String[] formats = {
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm",
            "yyyy-MM-dd"
        };
        
        for (String format : formats) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(format);
                sdf.setLenient(false);
                sdf.parse(timeStr);
                // 统一格式化为标准格式
                SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                return outputFormat.format(sdf.parse(timeStr));
            } catch (ParseException e) {
                // 继续尝试下一个格式
            }
        }
        
        throw new IllegalArgumentException("时间格式不正确，支持格式：yyyy-MM-dd HH:mm:ss");
    }
    
    /**
     * 验证时间范围
     */
    private boolean validateTimeRange(String startTime, String endTime) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            Date start = sdf.parse(startTime);
            Date end = sdf.parse(endTime);
            return !end.before(start);
        } catch (ParseException e) {
            return false;
        }
    }
    
    /**
     * 验证状态值
     */
    private boolean isValidStatus(String status) {
        return "online".equals(status) || "offline".equals(status) 
            || "upcoming".equals(status) || "ended".equals(status);
    }

    /**
     * 获取活动报名人列表
     * GET /api/v1/admin/activity/{activityId}/participants?pageNum=1&pageSize=10
     */
    @GetMapping("/{activityId}/participants")
    public Map<String, Object> getParticipants(@PathVariable Long activityId,
                                              @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                              @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (activityId == null || activityId <= 0) {
                result.put("code", 400);
                result.put("msg", "活动ID无效");
                return result;
            }
            
            // 验证活动是否存在
            Activity activity = activityMapper.selectById(activityId);
            if (activity == null) {
                result.put("code", 404);
                result.put("msg", "活动不存在");
                return result;
            }
            
            // 参数验证
            if (pageNum < 1) {
                pageNum = 1;
            }
            if (pageSize < 1 || pageSize > 100) {
                pageSize = 10;
            }
            
            Integer offset = (pageNum - 1) * pageSize;
            int total = activityRegistrationMapper.countByActivityId(activityId);
            List<Map<String, Object>> participants = activityRegistrationMapper.selectParticipantsByActivityId(activityId, offset, pageSize);
            
            result.put("code", 200);
            result.put("msg", "success");
            result.put("rows", participants);
            result.put("total", total);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "查询失败：" + e.getMessage());
        }
        
        return result;
    }

}

