package com.smarttravel.route.mapper;

import com.smarttravel.route.domain.TravelRoutePoi;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface TravelRoutePoiMapper {
    int insert(TravelRoutePoi poi);
    List<TravelRoutePoi> selectByRouteDayId(Long routeDayId);
    int deleteByRouteDayId(Long routeDayId);
}




























<<<<<<< HEAD

=======
>>>>>>> 299642f29c0d19bfedecf29490a18cfe2ad7de4f
