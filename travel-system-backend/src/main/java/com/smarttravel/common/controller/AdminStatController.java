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
        Map<String, Object> data = new HashMap<>();
        data.put("total", total);
        data.put("today", today);
        return success(data);
    }

    @GetMapping("/travelNote/trend")
    public Map<String, Object> travelNoteTrend() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT DATE(create_time) AS day, COUNT(*) AS count FROM travel_note WHERE del_flag = 0 GROUP BY DATE(create_time) ORDER BY day DESC LIMIT 14");
        return success(rows);
    }

    @GetMapping("/checkin/trend")
    public Map<String, Object> checkinTrend() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT DATE(create_time) AS day, COUNT(*) AS count FROM checkin_record WHERE del_flag = 0 GROUP BY DATE(create_time) ORDER BY day DESC LIMIT 14");
        return success(rows);
    }

    @GetMapping("/city/top")
    public Map<String, Object> cityTop() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT city, COUNT(*) AS count FROM travel_note WHERE del_flag = 0 AND city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 10");
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











