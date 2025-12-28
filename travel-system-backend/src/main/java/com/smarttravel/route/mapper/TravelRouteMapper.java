package com.smarttravel.route.mapper;

import com.smarttravel.route.domain.TravelRoute;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TravelRouteMapper {
    int insert(TravelRoute route);
    TravelRoute selectById(Long id);
    List<TravelRoute> selectList(TravelRoute query);
    List<TravelRoute> selectListWithPage(@Param("query") TravelRoute query, @Param("offset") Integer offset, @Param("pageSize") Integer pageSize);
    int countList(TravelRoute query);
    int update(TravelRoute route);

    int incrementFavoriteCount(@Param("id") Long id);

    int decrementFavoriteCount(@Param("id") Long id);

    int incrementViewCount(@Param("id") Long id);

    int deleteById(@Param("id") Long id);
}

