package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.CheckinRecord;
import com.smarttravel.content.domain.City;
import com.smarttravel.content.domain.Food;
import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.mapper.CheckinRecordMapper;
import com.smarttravel.content.mapper.CityMapper;
import com.smarttravel.content.mapper.FoodMapper;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.content.service.CheckinService;
import com.smarttravel.user.mapper.UserMapper;
import com.smarttravel.user.domain.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 打卡服务实现
 */
@Service
public class CheckinServiceImpl implements CheckinService {

    @Resource
    private CheckinRecordMapper checkinRecordMapper;

    @Resource
    private UserBehaviorMapper userBehaviorMapper;

    @Resource
    private UserMapper userMapper;

    @Resource
    private CityMapper cityMapper;

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private FoodMapper foodMapper;

    @Override
    @Transactional
    public Long addCheckin(Long userId, String targetType, Long targetId,
                           String photoUrl, String content, BigDecimal latitude, BigDecimal longitude) {
        CheckinRecord record = new CheckinRecord();
        record.setUserId(userId);
        record.setTargetType(targetType);
        record.setTargetId(targetId);
        record.setPhotoUrl(photoUrl);
        record.setContent(content);
        record.setLatitude(latitude);
        record.setLongitude(longitude);
        record.setCheckinTime(LocalDateTime.now());
        record.setDelFlag(0);

        checkinRecordMapper.insert(record);

        // 记录行为：打卡权重为15
        userBehaviorMapper.insert(userId, com.smarttravel.content.enums.BehaviorType.CHECKIN.getCode(),
            targetType, targetId, com.smarttravel.content.enums.BehaviorType.CHECKIN.getWeight());

        return record.getId();
    }

    @Override
    public Map<String, Object> getMyCheckins(Long userId, Integer pageNum, Integer pageSize) {
        Map<String, Object> result = new HashMap<>();

        // 计算分页偏移量（pageNum从1开始）
        int offset = (pageNum - 1) * pageSize;

        List<CheckinRecord> records = checkinRecordMapper.selectByUserId(userId, offset, pageSize);
        int total = checkinRecordMapper.countByUserId(userId);

        // 转换为返回格式
        List<Map<String, Object>> list = new ArrayList<>();
        for (CheckinRecord record : records) {
            list.add(buildCheckinItem(record));
        }

        result.put("list", list);
        result.put("total", total);
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);

        return result;
    }

    @Override
    public Map<String, Object> getCheckinsByTarget(String targetType, Long targetId,
                                                    Integer pageNum, Integer pageSize) {
        Map<String, Object> result = new HashMap<>();

        // 计算分页偏移量（pageNum从1开始）
        int offset = (pageNum - 1) * pageSize;

        List<CheckinRecord> records = checkinRecordMapper.selectByTarget(targetType, targetId, offset, pageSize);
        int total = checkinRecordMapper.countByTarget(targetType, targetId);

        // 转换为返回格式
        List<Map<String, Object>> list = new ArrayList<>();
        for (CheckinRecord record : records) {
            Map<String, Object> item = buildCheckinItem(record);
            User user = userMapper.selectById(record.getUserId());
            if (user != null) {
                item.put("userNickname", user.getNickname());
                item.put("userAvatar", user.getAvatar());
            }
            list.add(item);
        }

        result.put("list", list);
        result.put("total", total);
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);

        return result;
    }

    @Override
    public Map<String, Object> getCheckinDetail(Long id) {
        CheckinRecord record = checkinRecordMapper.selectById(id);
        if (record == null) {
            return null;
        }
        Map<String, Object> detail = buildCheckinItem(record);
        User user = userMapper.selectById(record.getUserId());
        if (user != null) {
            detail.put("userNickname", user.getNickname());
            detail.put("userAvatar", user.getAvatar());
        }
        return detail;
    }

    private Map<String, Object> buildCheckinItem(CheckinRecord record) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", record.getId());
        item.put("userId", record.getUserId());
        item.put("targetType", record.getTargetType());
        item.put("targetId", record.getTargetId());
        item.put("photoUrl", record.getPhotoUrl());
        item.put("content", record.getContent());
        item.put("latitude", record.getLatitude());
        item.put("longitude", record.getLongitude());
        item.put("checkinTime", record.getCheckinTime());

        if ("scenic".equals(record.getTargetType())) {
            ScenicSpot scenic = scenicSpotMapper.selectById(record.getTargetId());
            if (scenic != null) {
                item.put("targetName", scenic.getName());
                item.put("cityId", scenic.getCityId());
                City city = scenic.getCityId() != null ? cityMapper.selectById(scenic.getCityId()) : null;
                if (city != null) {
                    item.put("cityName", city.getCityName());
                }
            }
        } else if ("food".equals(record.getTargetType())) {
            Food food = foodMapper.selectById(record.getTargetId());
            if (food != null) {
                item.put("targetName", food.getName());
                item.put("cityId", food.getCityId());
                City city = food.getCityId() != null ? cityMapper.selectById(food.getCityId()) : null;
                if (city != null) {
                    item.put("cityName", city.getCityName());
                }
            }
        }
        return item;
    }
}

