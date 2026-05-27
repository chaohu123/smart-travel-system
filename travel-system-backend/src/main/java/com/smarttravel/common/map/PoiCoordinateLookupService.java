package com.smarttravel.common.map;

import com.smarttravel.content.domain.Food;
import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.mapper.FoodMapper;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.math.BigDecimal;
import java.util.List;

/**
 * 从景点/美食库按名称匹配经纬度（地理编码失败时的兜底）
 */
@Service
public class PoiCoordinateLookupService {

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private FoodMapper foodMapper;

    public double[] lookup(Long cityId, String placeName, String cityName) {
        if (placeName == null || placeName.trim().isEmpty()) {
            return null;
        }
        String target = normalizeName(placeName);

        if (cityId == null) {
            return null;
        }

        double[] scenic = lookupScenicInCity(cityId, target);
        if (scenic != null) {
            return scenic;
        }
        return lookupFoodInCity(cityId, target);
    }

    private double[] lookupScenicInCity(Long cityId, String target) {
        ScenicSpot query = new ScenicSpot();
        query.setCityId(cityId);
        List<ScenicSpot> list = scenicSpotMapper.selectList(query);
        return matchFromScenics(list, target);
    }

    private double[] lookupFoodInCity(Long cityId, String target) {
        Food query = new Food();
        query.setCityId(cityId);
        List<Food> list = foodMapper.selectList(query);
        for (Food food : list) {
            if (food == null || food.getName() == null) {
                continue;
            }
            if (nameMatches(normalizeName(food.getName()), target)) {
                double[] coord = toCoord(food.getLatitude(), food.getLongitude());
                if (coord != null) {
                    return coord;
                }
            }
        }
        return null;
    }

    private double[] matchFromScenics(List<ScenicSpot> list, String target) {
        if (list == null) {
            return null;
        }
        for (ScenicSpot spot : list) {
            if (spot == null || spot.getName() == null) {
                continue;
            }
            if (nameMatches(normalizeName(spot.getName()), target)) {
                double[] coord = toCoord(spot.getLatitude(), spot.getLongitude());
                if (coord != null) {
                    return coord;
                }
            }
        }
        return null;
    }

    private boolean nameMatches(String dbName, String target) {
        if (dbName == null || target == null) {
            return false;
        }
        if (dbName.equals(target)) {
            return true;
        }
        if (target.length() >= 3 && dbName.contains(target)) {
            return true;
        }
        return target.length() >= 3 && dbName.length() >= 3 && target.contains(dbName);
    }

    private String normalizeName(String name) {
        return name.trim()
            .replace("景区", "")
            .replace("风景区", "")
            .replace("旅游区", "")
            .replace("公园", "")
            .replace("广场", "")
            .replace(" ", "");
    }

    private double[] toCoord(BigDecimal lat, BigDecimal lng) {
        if (lat == null || lng == null) {
            return null;
        }
        double la = lat.doubleValue();
        double ln = lng.doubleValue();
        if (la >= 3 && la <= 54.5 && ln >= 73 && ln <= 135.5) {
            return new double[] { la, ln };
        }
        if (ln >= 3 && ln <= 54.5 && la >= 73 && la <= 135.5) {
            return new double[] { ln, la };
        }
        return null;
    }
}
