package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.ActivityRegistration;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

public interface ActivityRegistrationMapper {
    /**
     * 根据活动ID查询报名人列表（包含用户信息）
     */
    List<Map<String, Object>> selectParticipantsByActivityId(@Param("activityId") Long activityId,
                                                              @Param("offset") Integer offset,
                                                              @Param("pageSize") Integer pageSize);

    /**
     * 统计活动报名人数
     */
    int countByActivityId(@Param("activityId") Long activityId);

    /**
     * 统计用户报名活动次数
     */
    int countByUserId(@Param("userId") Long userId);
}

