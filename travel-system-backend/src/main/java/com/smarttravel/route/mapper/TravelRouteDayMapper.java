package com.smarttravel.route.mapper;

import com.smarttravel.route.domain.TravelRouteDay;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface TravelRouteDayMapper {
    int insert(TravelRouteDay day);
    List<TravelRouteDay> selectByRouteId(Long routeId);
    int deleteByRouteId(Long routeId);
    int update(TravelRouteDay day);
    int deleteById(Long id);
}































