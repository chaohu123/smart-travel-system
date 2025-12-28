package com.smarttravel.content.controller;

import com.smarttravel.content.domain.City;
import com.smarttravel.content.service.CityService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 城市管理接口
 */
@RestController
@RequestMapping("/api/v1/city")
@CrossOrigin
public class CityController {

    @Resource
    private CityService cityService;

    /**
     * 查询城市列表
     */
    @GetMapping("/list")
    public Map<String, Object> list() {
        List<City> cities = cityService.listCities();
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", cities);
        return response;
    }
}




























