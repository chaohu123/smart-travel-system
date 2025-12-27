package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.ScenicSpot;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ScenicSpotMapper {
    List<ScenicSpot> selectList(ScenicSpot query);
    List<ScenicSpot> selectListWithPage(@Param("query") ScenicSpot query, @Param("offset") Integer offset, @Param("pageSize") Integer pageSize);
    int countList(ScenicSpot query);
    ScenicSpot selectById(Long id);
    List<ScenicSpot> selectHotByCityId(@Param("cityId") Long cityId, @Param("limit") Integer limit);
    List<ScenicSpot> selectHotByProvince(@Param("province") String province, @Param("limit") Integer limit);
    List<ScenicSpot> selectTopByTotalScore(@Param("limit") Integer limit);
    List<ScenicSpot> selectRecommend(@Param("limit") Integer limit);
    int insert(ScenicSpot spot);
    int update(ScenicSpot spot);
    int incrementHotScore(@Param("id") Long id, @Param("increment") Integer increment);
}

