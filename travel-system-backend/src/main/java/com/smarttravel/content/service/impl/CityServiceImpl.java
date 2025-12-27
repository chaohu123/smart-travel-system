package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.City;
import com.smarttravel.content.mapper.CityMapper;
import com.smarttravel.content.service.CityService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

/**
 * 城市服务实现
 */
@Service
public class CityServiceImpl implements CityService {

    @Resource
    private CityMapper cityMapper;

    @Override
    public List<City> listCities() {
        City query = new City();
        query.setStatus(1); // 只查询启用的城市
        query.setDelFlag(0);
        return cityMapper.selectList(query);
    }
}

