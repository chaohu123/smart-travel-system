package com.smarttravel.content.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 打卡服务接口
 */
public interface CheckinService {
    /**
     * 新增打卡记录
     */
    Long addCheckin(Long userId, String targetType, Long targetId,
                    String photoUrl, String content, BigDecimal latitude, BigDecimal longitude);

    /**
     * 查询我的打卡列表
     */
    Map<String, Object> getMyCheckins(Long userId, Integer pageNum, Integer pageSize);

    /**
     * 查询某景点/美食的打卡列表
     */
    Map<String, Object> getCheckinsByTarget(String targetType, Long targetId,
                                            Integer pageNum, Integer pageSize);

    /**
     * 查询单条打卡详情
     */
    Map<String, Object> getCheckinDetail(Long id);
}





