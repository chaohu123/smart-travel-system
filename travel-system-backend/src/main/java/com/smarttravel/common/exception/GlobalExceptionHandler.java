package com.smarttravel.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 业务异常
     */
    @ExceptionHandler(RuntimeException.class)
    public Map<String, Object> handleRuntimeException(RuntimeException e) {
        log.error("业务异常：", e);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 500);
        result.put("msg", e.getMessage() != null ? e.getMessage() : "业务处理失败");
        result.put("data", null);
        return result;
    }

    /**
     * 参数校验异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public Map<String, Object> handleIllegalArgumentException(IllegalArgumentException e) {
        log.error("参数异常：", e);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 400);
        result.put("msg", e.getMessage() != null ? e.getMessage() : "参数错误");
        result.put("data", null);
        return result;
    }

    /**
     * 系统异常
     */
    @ExceptionHandler(Exception.class)
    public Map<String, Object> handleException(Exception e) {
        log.error("系统异常：", e);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 500);
        result.put("msg", "系统内部错误，请稍后重试");
        result.put("data", null);
        return result;
    }
}


















