package com.smarttravel.content.controller;

import com.smarttravel.content.domain.Food;
import com.smarttravel.content.mapper.FoodMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 美食管理接口
 */
@RestController
@RequestMapping("/api/v1/admin/food")
@CrossOrigin
public class AdminFoodController {

    @Resource
    private FoodMapper foodMapper;

    @GetMapping("/list")
    public Map<String, Object> list(Food query) {
        if (query == null) {
            query = new Food();
        }
        query.setDelFlag(0);
        List<Food> list = foodMapper.selectList(query);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", list.size());
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        Food food = foodMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", food);
        return result;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Food food) {
        food.setDelFlag(0);
        foodMapper.insert(food);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody Food food) {
        foodMapper.update(food);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        Food food = new Food();
        food.setId(id);
        food.setDelFlag(1);
        foodMapper.update(food);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }
}















