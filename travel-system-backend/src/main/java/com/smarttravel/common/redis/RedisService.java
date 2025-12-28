package com.smarttravel.common.redis;

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

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 设置字符串/对象，带过期时间。
     */
    public void set(String key, Object value, long timeoutSeconds) {
        if (timeoutSeconds > 0) {
            redisTemplate.opsForValue().set(key, value, timeoutSeconds, TimeUnit.SECONDS);
        } else {
            redisTemplate.opsForValue().set(key, value);
        }
    }

    /**
     * 设置字符串/对象，带过期时间（Duration）。
     */
    public void set(String key, Object value, Duration duration) {
        if (duration != null && !duration.isZero() && !duration.isNegative()) {
            redisTemplate.opsForValue().set(key, value, duration);
        } else {
            redisTemplate.opsForValue().set(key, value);
        }
    }

    /**
     * 获取字符串/对象。
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }
        return (T) value;
    }

    /**
     * 删除 key。
     */
    public void delete(String key) {
        redisTemplate.delete(key);
    }

    /**
     * 设置 key 过期时间（秒）。
     */
    public boolean expire(String key, long timeoutSeconds) {
        if (timeoutSeconds <= 0) {
            return false;
        }
        Boolean result = redisTemplate.expire(key, timeoutSeconds, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(result);
    }
}




























