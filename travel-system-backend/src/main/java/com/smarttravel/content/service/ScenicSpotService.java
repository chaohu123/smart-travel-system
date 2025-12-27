package com.smarttravel.content.service;

import com.smarttravel.content.domain.ScenicSpot;
import java.util.List;
import java.util.Map;

/**
 * 景点服务接口
 */
public interface ScenicSpotService {

    /**
     * 查询景点列表（分页、筛选、排序）
     */
    Map<String, Object> listSpots(Integer pageNum, Integer pageSize, Long cityId,
                                  String tagName, String sortBy);

    /**
     * 查询景点详情
     */
    Map<String, Object> getSpotDetail(Long id);

    /**
     * 查询热门景点（用于首页）
     */
    List<ScenicSpot> getHotSpots(Long cityId, Integer limit);
}

