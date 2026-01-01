package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.CheckinPoint;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface CheckinPointMapper {
    int insert(CheckinPoint point);

    int update(CheckinPoint point);

    int deleteByIdPhysically(@Param("id") Long id);

    CheckinPoint selectById(@Param("id") Long id);

    CheckinPoint selectByIdWithoutDelFlag(@Param("id") Long id);

    List<CheckinPoint> selectListWithPage(@Param("query") CheckinPoint query,
                                          @Param("offset") Integer offset,
                                          @Param("pageSize") Integer pageSize);

    int countList(@Param("query") CheckinPoint query);

    CheckinPoint selectByTarget(@Param("targetType") String targetType, @Param("targetId") Long targetId);

    Integer countCheckinByTarget(@Param("targetType") String targetType, @Param("targetId") Long targetId);
}

