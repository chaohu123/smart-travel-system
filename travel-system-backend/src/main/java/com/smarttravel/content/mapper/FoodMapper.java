package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.Food;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FoodMapper {
    List<Food> selectList(Food query);
    List<Food> selectListWithPage(@Param("query") Food query, @Param("offset") Integer offset, @Param("pageSize") Integer pageSize);
    int countList(Food query);
    Food selectById(Long id);
    List<Food> selectHotByCityId(@Param("cityId") Long cityId, @Param("limit") Integer limit);
    List<Food> selectHotByProvince(@Param("province") String province, @Param("limit") Integer limit);
    List<Food> selectRecommend(@Param("limit") Integer limit);
    int insert(Food food);
    int update(Food food);
    int deleteById(Long id);
    int deleteByIdPhysically(Long id);
    Food selectByIdWithoutDelFlag(Long id);
}

