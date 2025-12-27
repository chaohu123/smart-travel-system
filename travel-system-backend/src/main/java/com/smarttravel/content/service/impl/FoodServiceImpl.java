package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.Food;
import com.smarttravel.content.mapper.FoodMapper;
import com.smarttravel.content.service.FoodService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 美食服务实现
 */
@Service
public class FoodServiceImpl implements FoodService {

    @Resource
    private FoodMapper foodMapper;

    @Override
    public Map<String, Object> listFoods(Integer pageNum, Integer pageSize, Long cityId,
                                         String tagName, String sortBy) {
        Food query = new Food();
        query.setCityId(cityId);
        query.setDelFlag(0);

        List<Food> list = foodMapper.selectList(query);

        // 简化分页处理
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, list.size());
        List<Food> pageList = list.subList(start, end);

        Map<String, Object> result = new HashMap<>();
        result.put("list", pageList);
        result.put("total", list.size());
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    @Override
    public Map<String, Object> getFoodDetail(Long id) {
        Food food = foodMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("food", food);
        return result;
    }

    @Override
    public List<Food> getHotFoods(Long cityId, Integer limit) {
        return foodMapper.selectHotByCityId(cityId, limit);
    }
}

