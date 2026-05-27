package com.smarttravel.common.map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttravel.content.domain.City;
import com.smarttravel.content.mapper.CityMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 高德 Web 服务地理编码（地址 → 经纬度）
 */
@Service
public class AmapGeocodeService {

    private static final Logger log = LoggerFactory.getLogger(AmapGeocodeService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<String, double[]> CACHE = new ConcurrentHashMap<>();
    private static final Map<String, double[]> CITY_CENTER_CACHE = new ConcurrentHashMap<>();
    private static final Set<String> FAILED_KEYS = ConcurrentHashMap.newKeySet();
    /** 行程目的地城市半径（公里），超出则视为误匹配 */
    private static final double MAX_CITY_RADIUS_KM = 80;

    @Value("${amap.web-key:b49d114eb175a158b25db7bf30156a3d}")
    private String webKey;

    @Resource
    private PoiCoordinateLookupService poiCoordinateLookupService;

    @Resource
    private CityMapper cityMapper;

    public double[] geocode(String address, String city) {
        return geocode(address, city, null);
    }

  public double[] geocode(String address, String city, Long cityId) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }
        String cityNorm = normalizeCity(city);
        String cacheKey = cityId + "|" + cityNorm + "::" + address.trim();
        if (FAILED_KEYS.contains(cacheKey)) {
            return null;
        }
        double[] cached = CACHE.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        double[] cityCenter = resolveCityCenter(cityId, cityNorm);
        double[] fromDb = poiCoordinateLookupService.lookup(cityId, address, cityNorm);
        if (fromDb != null && isNearCityCenter(fromDb, cityCenter)) {
            CACHE.put(cacheKey, fromDb);
            return fromDb;
        }

        String amapCity = buildAmapCityParam(cityId, cityNorm);
        for (String query : buildCandidates(address, cityNorm)) {
            double[] point = requestGeocode(query, amapCity);
            if (point != null && isNearCityCenter(point, cityCenter)) {
                CACHE.put(cacheKey, point);
                return point;
            }
        }
        FAILED_KEYS.add(cacheKey);
        return null;
    }

    public void enrichDetailCoords(Map<String, Object> detail, String cityName, Long cityId) {
        if (detail == null || detail.isEmpty()) {
            return;
        }
        Double lat = toDouble(detail.get("latitude"));
        Double lng = toDouble(detail.get("longitude"));
        if (isChinaCoord(lat, lng)) {
            detail.put("latitude", lat);
            detail.put("longitude", lng);
            return;
        }
        if (lat != null && lng != null && isChinaCoord(lng, lat)) {
            detail.put("latitude", lng);
            detail.put("longitude", lat);
            return;
        }

        String address = detail.get("address") != null ? detail.get("address").toString() : "";
        String name = detail.get("name") != null ? detail.get("name").toString() : "";
        String city = cityName;
        if (city == null || city.isEmpty()) {
            if (detail.get("city") != null) {
                city = detail.get("city").toString();
            } else if (detail.get("province") != null) {
                city = detail.get("province").toString();
            }
        }

        double[] point = geocode(address, city, cityId);
        if (point == null && name != null && !name.isEmpty()) {
            point = geocode(name, city, cityId);
        }
        if (point != null) {
            detail.put("latitude", point[0]);
            detail.put("longitude", point[1]);
        }
    }

    private double[] requestGeocode(String address, String city) {
        try {
            String cityParam = (city != null && !city.isEmpty())
                ? "&city=" + URLEncoder.encode(city, StandardCharsets.UTF_8.name())
                : "";
            String urlStr = "https://restapi.amap.com/v3/geocode/geo?address="
                + URLEncoder.encode(address, StandardCharsets.UTF_8.name())
                + cityParam
                + "&key=" + webKey;

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int code = conn.getResponseCode();
            if (code != HttpURLConnection.HTTP_OK) {
                return null;
            }

            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            JsonNode root = MAPPER.readTree(sb.toString());
            if (!"1".equals(root.path("status").asText())) {
                String info = root.path("info").asText("");
                if ("USERKEY_PLAT_NOMATCH".equals(info)) {
                    log.warn("高德地理编码 Key 平台不匹配，请在 application.yml 配置 Web 服务类型 Key: {}", info);
                }
                return null;
            }
            JsonNode geocodes = root.path("geocodes");
            if (!geocodes.isArray() || geocodes.size() == 0) {
                return null;
            }
            String location = geocodes.get(0).path("location").asText("");
            return parseLocation(location);
        } catch (Exception e) {
            log.debug("geocode request failed: {}", e.getMessage());
            return null;
        }
    }

    private Set<String> buildCandidates(String address, String city) {
        Set<String> candidates = new LinkedHashSet<>();
        String addr = address != null ? address.trim() : "";
        if (!addr.isEmpty()) {
            if (city != null && !city.isEmpty()) {
                candidates.add(city + "市" + addr);
                candidates.add(city + addr);
            }
            candidates.add(addr);
        }
        return candidates;
    }

    private String buildAmapCityParam(Long cityId, String cityNorm) {
        if (cityId != null) {
            City city = cityMapper.selectById(cityId);
            if (city != null && city.getCityName() != null && !city.getCityName().trim().isEmpty()) {
                return city.getCityName().trim();
            }
        }
        if (cityNorm != null && !cityNorm.isEmpty()) {
            return cityNorm.endsWith("市") ? cityNorm : cityNorm + "市";
        }
        return "";
    }

    private double[] resolveCityCenter(Long cityId, String cityNorm) {
        String cacheKey = cityId + "|" + cityNorm;
        double[] cached = CITY_CENTER_CACHE.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        double[] center = null;
        if (cityId != null) {
            City city = cityMapper.selectById(cityId);
            if (city != null && city.getLatitude() != null && city.getLongitude() != null) {
                center = new double[] {
                    city.getLatitude().doubleValue(),
                    city.getLongitude().doubleValue()
                };
            } else if (city != null && city.getCityName() != null) {
                center = requestGeocode(city.getCityName(), null);
            }
        }
        if (center == null && cityNorm != null && !cityNorm.isEmpty()) {
            String cityQuery = cityNorm.endsWith("市") ? cityNorm : cityNorm + "市";
            center = requestGeocode(cityQuery, null);
        }
        if (center != null) {
            CITY_CENTER_CACHE.put(cacheKey, center);
        }
        return center;
    }

    private boolean isNearCityCenter(double[] point, double[] cityCenter) {
        if (point == null || point.length < 2) {
            return false;
        }
        if (cityCenter == null || cityCenter.length < 2) {
            return true;
        }
        return distanceKm(point[0], point[1], cityCenter[0], cityCenter[1]) <= MAX_CITY_RADIUS_KM;
    }

    private double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int earthRadiusKm = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private double[] parseLocation(String location) {
        if (location == null || location.isEmpty()) {
            return null;
        }
        String[] parts = location.split(",");
        if (parts.length < 2) {
            return null;
        }
        try {
            double lng = Double.parseDouble(parts[0].trim());
            double lat = Double.parseDouble(parts[1].trim());
            if (isChinaCoord(lat, lng)) {
                return new double[] { lat, lng };
            }
            if (isChinaCoord(lng, lat)) {
                return new double[] { lng, lat };
            }
        } catch (NumberFormatException ignored) {
            // ignore
        }
        return null;
    }

    private Double toDouble(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isChinaCoord(Double lat, Double lng) {
        return lat != null && lng != null
            && lat >= 3 && lat <= 54.5
            && lng >= 73 && lng <= 135.5;
    }

    private String normalizeCity(String city) {
        if (city == null) {
            return "";
        }
        return city.trim()
            .replace("特别行政区", "")
            .replace("自治州", "")
            .replace("地区", "")
            .replace("盟", "")
            .replace("市", "")
            .replace("省", "");
    }
}
