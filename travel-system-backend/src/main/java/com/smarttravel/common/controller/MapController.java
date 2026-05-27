package com.smarttravel.common.controller;

import com.smarttravel.common.map.AmapGeocodeService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

/**
 * 地图辅助接口（地理编码代理，供小程序调用）
 */
@RestController
@RequestMapping("/api/v1/map")
@CrossOrigin
public class MapController {

    @Resource
    private AmapGeocodeService amapGeocodeService;

    @GetMapping("/geocode")
    public Map<String, Object> geocode(
        @RequestParam String address,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) Long cityId
    ) {
        Map<String, Object> response = new HashMap<>();
        double[] point = amapGeocodeService.geocode(address, city, cityId);
        Map<String, Object> data = new HashMap<>();
        if (point != null) {
            data.put("latitude", point[0]);
            data.put("longitude", point[1]);
        }
        response.put("code", point != null ? 200 : 404);
        response.put("msg", point != null ? "success" : "geocode failed");
        response.put("data", data);
        return response;
    }
}
