package com.smarttravel.route.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface UserRouteFavoriteMapper {
    int insert(@Param("userId") Long userId, @Param("routeId") Long routeId);
    int delete(@Param("userId") Long userId, @Param("routeId") Long routeId);
    int checkExists(@Param("userId") Long userId, @Param("routeId") Long routeId);
    List<Map<String, Object>> selectByUserId(Long userId);
}
































