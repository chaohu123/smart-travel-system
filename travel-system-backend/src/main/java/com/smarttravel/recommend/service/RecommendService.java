package com.smarttravel.recommend.service;

import java.util.List;
import java.util.Map;

/**
 * 推荐服务接口
 */
public interface RecommendService {
    /**
     * 首页推荐旅游线路接口（兴趣 + 热度）
     */
    List<Map<String, Object>> recommendRoutes(Long userId, Integer limit);

    /**
     * 首页推荐游记接口（热度 + 标签匹配）
     */
    List<Map<String, Object>> recommendTravelNotes(Long userId, Integer limit);

    /**
     * 推荐景点接口（本地热门、与用户偏好匹配）
     */
    List<Map<String, Object>> recommendScenicSpots(Long userId, Long cityId, Integer limit);

    /**
     * 推荐景点接口（支持按省份筛选）
     */
    List<Map<String, Object>> recommendScenicSpots(Long userId, Long cityId, String province, Integer limit);

    /**
     * 推荐美食接口（本地热门、与用户偏好匹配）
     */
    List<Map<String, Object>> recommendFoods(Long userId, Long cityId, Integer limit);

    /**
     * 推荐美食接口（支持按省份筛选）
     */
    List<Map<String, Object>> recommendFoods(Long userId, Long cityId, String province, Integer limit);
}













