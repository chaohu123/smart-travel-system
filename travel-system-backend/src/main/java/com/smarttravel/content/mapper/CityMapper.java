package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.City;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CityMapper {
    List<City> selectList(City query);
    List<City> selectListWithPage(@Param("query") City query, @Param("offset") Integer offset, @Param("pageSize") Integer pageSize);
    int countList(City query);
    City selectById(Long id);
    City selectByCityNameAndProvince(@Param("cityName") String cityName, @Param("province") String province);
    int insert(City city);
    int update(City city);
}

