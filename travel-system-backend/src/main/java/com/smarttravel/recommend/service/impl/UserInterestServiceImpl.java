package com.smarttravel.recommend.service.impl;

import com.smarttravel.common.redis.RedisService;
import com.smarttravel.content.domain.ContentTag;
import com.smarttravel.content.mapper.ContentTagMapper;
import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.recommend.service.UserInterestService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户兴趣模型服务实现
 */
@Service
public class UserInterestServiceImpl implements UserInterestService {

    @Resource
    private UserBehaviorMapper userBehaviorMapper;

    @Resource
    private RedisService redisService;

    @Resource
    private ContentTagMapper contentTagMapper;

    // 缓存key前缀
    private static final String USER_TAG_WEIGHTS_KEY = "user:tag:weights:";
    private static final long CACHE_EXPIRE_SECONDS = 3600; // 1小时

    @Override
    public Map<Long, Integer> calculateUserTagWeights(Long userId) {
        Map<Long, Integer> tagWeights = new HashMap<>();

        // 获取用户最近的行为记录（最近1000条）
        List<Map<String, Object>> behaviors = userBehaviorMapper.selectByUserId(userId, 1000);

        // 按内容类型收集ID
        Map<String, List<Long>> contentIdsByType = new HashMap<>();
        for (Map<String, Object> behavior : behaviors) {
            String contentType = (String) behavior.get("content_type");
            Long contentId = ((Number) behavior.get("content_id")).longValue();
            contentIdsByType.computeIfAbsent(contentType, k -> new java.util.ArrayList<>()).add(contentId);
        }

        // 为每类内容批量查标签
        Map<String, Map<Long, List<Long>>> tagMapByType = new HashMap<>();
        for (Map.Entry<String, List<Long>> entry : contentIdsByType.entrySet()) {
            List<ContentTag> relations = contentTagMapper.selectByContentIds(entry.getKey(), entry.getValue());
            Map<Long, List<Long>> contentTags = new HashMap<>();
            for (ContentTag relation : relations) {
                contentTags.computeIfAbsent(relation.getContentId(), k -> new java.util.ArrayList<>())
                        .add(relation.getTagId());
            }
            tagMapByType.put(entry.getKey(), contentTags);
        }

        // 累加标签权重
        for (Map<String, Object> behavior : behaviors) {
            String contentType = (String) behavior.get("content_type");
            Long contentId = ((Number) behavior.get("content_id")).longValue();
            Integer score = (Integer) behavior.get("score");
            Map<Long, List<Long>> contentTags = tagMapByType.getOrDefault(contentType, new HashMap<>());
            List<Long> tagIds = contentTags.getOrDefault(contentId, new java.util.ArrayList<>());
            for (Long tagId : tagIds) {
                tagWeights.put(tagId, tagWeights.getOrDefault(tagId, 0) + score);
            }
        }

        return tagWeights;
    }

    @Override
    public Map<Long, Integer> getUserTagWeights(Long userId) {
        // 先从缓存获取
        String cacheKey = USER_TAG_WEIGHTS_KEY + userId;
        Map<Long, Integer> cached = redisService.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // 缓存未命中，计算并缓存
        Map<Long, Integer> weights = calculateUserTagWeights(userId);
        redisService.set(cacheKey, weights, Duration.ofSeconds(CACHE_EXPIRE_SECONDS));

        return weights;
    }

    @Override
    public void updateUserProfile(Long userId) {
        // 清除缓存，强制重新计算
        String cacheKey = USER_TAG_WEIGHTS_KEY + userId;
        redisService.delete(cacheKey);

        // 重新计算并缓存
        getUserTagWeights(userId);
    }
}




