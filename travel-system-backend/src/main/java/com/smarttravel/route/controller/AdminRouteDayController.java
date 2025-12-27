package com.smarttravel.route.controller;

import com.smarttravel.route.domain.TravelRouteDay;
import com.smarttravel.route.mapper.TravelRouteDayMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/route/day")
@CrossOrigin
public class AdminRouteDayController {

    @Resource
    private TravelRouteDayMapper routeDayMapper;

    @GetMapping("/list")
    public Map<String, Object> list(@RequestParam Long routeId) {
        List<TravelRouteDay> rows = routeDayMapper.selectByRouteId(routeId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", rows);
        result.put("total", rows == null ? 0 : rows.size());
        return result;
    }

    @PostMapping("/save")
    public Map<String, Object> save(@RequestBody TravelRouteDay body) {
        if (body.getId() == null) {
            routeDayMapper.insert(body);
        } else {
            routeDayMapper.update(body);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        routeDayMapper.deleteById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }
}











