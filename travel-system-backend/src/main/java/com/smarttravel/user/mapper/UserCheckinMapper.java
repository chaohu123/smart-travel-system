package com.smarttravel.user.mapper;

import com.smarttravel.user.domain.UserCheckin;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.sql.Date;

@Mapper
public interface UserCheckinMapper {
    /**
     * 插入签到记录
     */
    int insert(UserCheckin userCheckin);

    /**
     * 查询用户今天是否已签到
     */
    UserCheckin selectByUserAndDate(@Param("userId") Long userId, @Param("checkinDate") Date checkinDate);
}

