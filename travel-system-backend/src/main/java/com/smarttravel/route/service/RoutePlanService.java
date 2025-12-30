package com.smarttravel.route.service;

import java.util.List;
import java.util.Map;

/**
 * 线路规划服务接口
 */
public interface RoutePlanService {

    /**
     * 生成旅游线路
     * @param cityId 城市ID
     * @param days 天数
     * @param tagIds 兴趣标签ID列表
     * @param budget 预算范围（可选）
     * @param suitablePeople 适合人群（可选）
     * @param useAi 是否使用AI生成文案
     * @param selectedScenicIds 用户选择的景点ID列表（必选内容）
     * @param selectedFoodIds 用户选择的美食ID列表（必选内容）
     * @param dailySelections 每天选择的景点和美食列表，格式：[{day: 1, scenicIds: [1,2], foodIds: [3,4]}]
     * @param startDate 开始日期 YYYY-MM-DD（可选）
     * @param endDate 结束日期 YYYY-MM-DD（可选）
     * @return 线路ID
     */
    Long generateRoute(Long cityId, Integer days, List<Long> tagIds,
                      String budget, String suitablePeople, Boolean useAi,
                      List<Long> selectedScenicIds, List<Long> selectedFoodIds,
                      List<Map<String, Object>> dailySelections,
                      String startDate, String endDate);

    /**
     * 查询线路详情（含每日安排）
     */
    Map<String, Object> getRouteDetail(Long routeId);

    /**
     * 收藏/取消收藏线路
     */
    Map<String, Object> toggleFavorite(Long userId, Long routeId);

    /**
     * 查询我的行程列表
     */
    List<Map<String, Object>> listMyRoutes(Long userId);
}

