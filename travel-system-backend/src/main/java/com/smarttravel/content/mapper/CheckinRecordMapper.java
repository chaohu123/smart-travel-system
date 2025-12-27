package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.CheckinRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CheckinRecordMapper {
    int insert(CheckinRecord record);

    List<CheckinRecord> selectByUserId(@Param("userId") Long userId,
                                        @Param("offset") Integer offset,
                                        @Param("pageSize") Integer pageSize);

    List<CheckinRecord> selectByTarget(@Param("targetType") String targetType,
                                       @Param("targetId") Long targetId,
                                       @Param("offset") Integer offset,
                                       @Param("pageSize") Integer pageSize);

    int countByUserId(@Param("userId") Long userId);

    int countByTarget(@Param("targetType") String targetType,
                      @Param("targetId") Long targetId);

    CheckinRecord selectById(@Param("id") Long id);
}

