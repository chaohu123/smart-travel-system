package com.smarttravel.content.controller;

import com.smarttravel.content.domain.City;
import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.mapper.CityMapper;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 景点管理接口
 */
@RestController
@RequestMapping("/api/v1/admin/scenic")
@CrossOrigin
public class AdminScenicSpotController {

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private CityMapper cityMapper;

    @GetMapping("/list")
    public Map<String, Object> list(ScenicSpot query,
                                     @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                     @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        if (query == null) {
            query = new ScenicSpot();
        }
        query.setDelFlag(0);

        // 计算offset
        Integer offset = (pageNum - 1) * pageSize;

        // 查询总数
        int total = scenicSpotMapper.countList(query);

        // 分页查询
        List<ScenicSpot> list = scenicSpotMapper.selectListWithPage(query, offset, pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", total);
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        ScenicSpot spot = scenicSpotMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", spot);
        return result;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody ScenicSpot spot) {
        // 如果city_id为空，尝试根据城市名称和省份查找city_id
        if (spot.getCityId() == null && spot.getCity() != null && !spot.getCity().isEmpty()) {
            City city = cityMapper.selectByCityNameAndProvince(spot.getCity(), spot.getProvince());
            if (city != null && city.getId() != null) {
                spot.setCityId(city.getId());
            } else {
                // 如果找不到对应的城市，返回错误
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("msg", "未找到对应的城市，请先在城市管理中创建该城市");
                return result;
            }
        }

        // 如果仍然没有city_id，返回错误
        if (spot.getCityId() == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 400);
            result.put("msg", "城市ID不能为空，请选择城市或先创建城市");
            return result;
        }

        // 设置默认值，确保新景点能在小程序端显示
        spot.setDelFlag(0);
        if (spot.getHotScore() == null || spot.getHotScore() == 0) {
            spot.setHotScore(10); // 设置默认热度值，确保新景点能显示在小程序端
        }
        if (spot.getScore() == null) {
            spot.setScore(new java.math.BigDecimal("0.0")); // 设置默认评分
        }

        scenicSpotMapper.insert(spot);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody ScenicSpot spot) {
        // 如果city_id为空，尝试根据城市名称和省份查找city_id
        if (spot.getCityId() == null && spot.getCity() != null && !spot.getCity().isEmpty()) {
            City city = cityMapper.selectByCityNameAndProvince(spot.getCity(), spot.getProvince());
            if (city != null && city.getId() != null) {
                spot.setCityId(city.getId());
            } else {
                // 如果找不到对应的城市，返回错误
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("msg", "未找到对应的城市，请先在城市管理中创建该城市");
                return result;
            }
        }

        scenicSpotMapper.update(spot);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        ScenicSpot spot = new ScenicSpot();
        spot.setId(id);
        spot.setDelFlag(1);
        scenicSpotMapper.update(spot);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }
}














