package com.smarttravel.content.controller;

import com.smarttravel.content.domain.City;
import com.smarttravel.content.mapper.CityMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 城市管理接口
 */
@RestController
@RequestMapping("/api/v1/admin/city")
@CrossOrigin
public class AdminCityController {

    @Resource
    private CityMapper cityMapper;

    @GetMapping("/list")
    public Map<String, Object> list(City query,
                                     @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                     @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        if (query == null) {
            query = new City();
        }
        query.setDelFlag(0);

        // 计算offset
        Integer offset = (pageNum - 1) * pageSize;

        // 查询总数
        int total = cityMapper.countList(query);

        // 分页查询
        List<City> list = cityMapper.selectListWithPage(query, offset, pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", total);
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        City city = cityMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", city);
        return result;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody City city) {
        city.setDelFlag(0);
        cityMapper.insert(city);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody City city) {
        cityMapper.update(city);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        City city = new City();
        city.setId(id);
        city.setDelFlag(1);
        cityMapper.update(city);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }
}














