package com.smarttravel.common.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/stat")
@CrossOrigin
public class AdminStatController {

    @Resource
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/user/summary")
    public Map<String, Object> userSummary() {
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user WHERE del_flag = 0", Long.class);
        Long today = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user WHERE del_flag = 0 AND DATE(create_time) = CURDATE()", Long.class);
        // 昨日新增用户
        Long yesterday = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user WHERE del_flag = 0 AND DATE(create_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)", Long.class);
        // 上周同期（7天前）
        Long lastWeek = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user WHERE del_flag = 0 AND DATE(create_time) = DATE_SUB(CURDATE(), INTERVAL 7 DAY)", Long.class);
        
        Map<String, Object> data = new HashMap<>();
        data.put("total", total);
        data.put("today", today);
        data.put("yesterday", yesterday != null ? yesterday : 0L);
        data.put("lastWeek", lastWeek != null ? lastWeek : 0L);
        return success(data);
    }

    @GetMapping("/travelNote/trend")
    public Map<String, Object> travelNoteTrend(@org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "14") Integer days) {
        int limit = days != null && days > 0 ? days : 14;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT DATE(create_time) AS day, COUNT(*) AS count FROM travel_note WHERE del_flag = 0 GROUP BY DATE(create_time) ORDER BY day DESC LIMIT " + limit);
        
        // 计算昨日对比
        Long todayCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM travel_note WHERE del_flag = 0 AND DATE(create_time) = CURDATE()", Long.class);
        Long yesterdayCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM travel_note WHERE del_flag = 0 AND DATE(create_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)", Long.class);
        
        Map<String, Object> result = new HashMap<>();
        result.put("trend", rows);
        result.put("todayCount", todayCount != null ? todayCount : 0L);
        result.put("yesterdayCount", yesterdayCount != null ? yesterdayCount : 0L);
        return success(result);
    }

    @GetMapping("/checkin/trend")
    public Map<String, Object> checkinTrend(@org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "14") Integer days) {
        int limit = days != null && days > 0 ? days : 14;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT DATE(create_time) AS day, COUNT(*) AS count FROM checkin_record WHERE del_flag = 0 GROUP BY DATE(create_time) ORDER BY day DESC LIMIT " + limit);
        
        // 计算昨日对比
        Long todayCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM checkin_record WHERE del_flag = 0 AND DATE(create_time) = CURDATE()", Long.class);
        Long yesterdayCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM checkin_record WHERE del_flag = 0 AND DATE(create_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)", Long.class);
        
        Map<String, Object> result = new HashMap<>();
        result.put("trend", rows);
        result.put("todayCount", todayCount != null ? todayCount : 0L);
        result.put("yesterdayCount", yesterdayCount != null ? yesterdayCount : 0L);
        return success(result);
    }

    @GetMapping("/city/top")
    public Map<String, Object> cityTop() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT city_name AS city, COUNT(*) AS count FROM travel_note WHERE del_flag = 0 AND city_name IS NOT NULL GROUP BY city_name ORDER BY count DESC LIMIT 10");
        return success(rows);
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", data);
        return result;
    }
}











