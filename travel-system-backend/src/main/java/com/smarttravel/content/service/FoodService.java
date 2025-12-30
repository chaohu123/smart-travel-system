package com.smarttravel.content.service;

import com.smarttravel.content.domain.Food;
import java.util.List;
import java.util.Map;

/**
 * 美食服务接口
 */
public interface FoodService {

    /**
     * 查询美食列表（分页、筛选、排序）
     */
    Map<String, Object> listFoods(Integer pageNum, Integer pageSize, Long cityId,
                                  String tagName, String sortBy);

    /**
     * 查询美食详情
     */
    Map<String, Object> getFoodDetail(Long id);

    /**
     * 查询热门美食（用于首页）
     */
    List<Food> getHotFoods(Long cityId, Integer limit);

    /**
     * 获取用户收藏的美食列表
     */
    Map<String, Object> getMyFavorites(Long userId);
}

