package com.smarttravel.route.controller;

import com.smarttravel.route.domain.TravelRoute;
import com.smarttravel.route.mapper.TravelRouteMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 路线管理接口
 */
@RestController
@RequestMapping("/api/v1/admin/route")
@CrossOrigin
public class AdminRouteController {

    @Resource
    private TravelRouteMapper travelRouteMapper;

    @GetMapping("/list")
    public Map<String, Object> list(TravelRoute query,
                                     @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                     @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        if (query == null) {
            query = new TravelRoute();
        }
        query.setDelFlag(0);

        // 计算offset
        Integer offset = (pageNum - 1) * pageSize;

        // 查询总数
        int total = travelRouteMapper.countList(query);

        // 分页查询
        List<TravelRoute> list = travelRouteMapper.selectListWithPage(query, offset, pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", total);
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        TravelRoute route = travelRouteMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", route);
        return result;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody TravelRoute route) {
        route.setDelFlag(0);
        if (route.getViewCount() == null) {
            route.setViewCount(0L);
        }
        if (route.getFavoriteCount() == null) {
            route.setFavoriteCount(0L);
        }
        if (route.getUseCount() == null) {
            route.setUseCount(0L);
        }
        travelRouteMapper.insert(route);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody TravelRoute route) {
        travelRouteMapper.update(route);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        TravelRoute route = new TravelRoute();
        route.setId(id);
        route.setDelFlag(1);
        travelRouteMapper.update(route);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }
}














