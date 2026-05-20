package com.smarttravel.common.redis;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Redis 通用工具封装，简化业务层的使用。
 */
@Component
public class RedisService {

    private static final Logger log = LoggerFactory.getLogger(RedisService.class);

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 设置字符串/对象，带过期时间。
     */
    public void set(String key, Object value, long timeoutSeconds) {
        try {
            if (timeoutSeconds > 0) {
                redisTemplate.opsForValue().set(key, value, timeoutSeconds, TimeUnit.SECONDS);
            } else {
                redisTemplate.opsForValue().set(key, value);
            }
        } catch (DataAccessException e) {
            log.warn("Redis set failed, key={}", key, e);
        }
    }

    /**
     * 设置字符串/对象，带过期时间（Duration）。
     */
    public void set(String key, Object value, Duration duration) {
        try {
            if (duration != null && !duration.isZero() && !duration.isNegative()) {
                redisTemplate.opsForValue().set(key, value, duration);
            } else {
                redisTemplate.opsForValue().set(key, value);
            }
        } catch (DataAccessException e) {
            log.warn("Redis set failed, key={}", key, e);
        }
    }

    /**
     * 获取字符串/对象。
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }
            return (T) value;
        } catch (DataAccessException e) {
            log.warn("Redis get failed, key={}", key, e);
            return null;
        }
    }

    /**
     * 删除 key。
     */
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
        } catch (DataAccessException e) {
            log.warn("Redis delete failed, key={}", key, e);
        }
    }

    /**
     * 设置 key 过期时间（秒）。
     */
    public boolean expire(String key, long timeoutSeconds) {
        if (timeoutSeconds <= 0) {
            return false;
        }
        try {
            Boolean result = redisTemplate.expire(key, timeoutSeconds, TimeUnit.SECONDS);
            return Boolean.TRUE.equals(result);
        } catch (DataAccessException e) {
            log.warn("Redis expire failed, key={}", key, e);
            return false;
        }
    }
}




























































