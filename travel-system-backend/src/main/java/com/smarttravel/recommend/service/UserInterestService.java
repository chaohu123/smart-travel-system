package com.smarttravel.recommend.service;

import java.util.Map;

/**
 * 用户兴趣模型服务
 */
public interface UserInterestService {
    /**
     * 计算并更新用户偏好标签权重
     * 基于用户兴趣标签 + 行为记录
     */
    Map<Long, Integer> calculateUserTagWeights(Long userId);

    /**
     * 获取用户偏好标签权重（带缓存）
     */
    Map<Long, Integer> getUserTagWeights(Long userId);

    /**
     * 更新用户画像（定期任务调用）
     */
    void updateUserProfile(Long userId);
}



























