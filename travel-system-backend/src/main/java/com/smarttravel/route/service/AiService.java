package com.smarttravel.route.service;

import java.util.Map;

/**
 * AI辅助服务接口
 */
public interface AiService {

    /**
     * 生成行程文案
     * @param routeSummary 基础行程结构（JSON字符串）
     * @param userPreference 用户偏好摘要
     * @return 包含整体概述、每日说明、推荐理由的Map
     */
    Map<String, String> generateRouteText(String routeSummary, String userPreference);

    /**
     * 检查AI服务是否可用
     */
    boolean isAvailable();
}




























