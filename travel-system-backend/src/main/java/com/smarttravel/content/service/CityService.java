package com.smarttravel.content.service;

import com.smarttravel.content.domain.City;
import java.util.List;

/**
 * 城市服务接口
 */
public interface CityService {
    /**
     * 查询城市列表
     */
    List<City> listCities();
}

