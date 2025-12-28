package com.smarttravel.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

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
     * 参数类型不匹配异常（如将 "undefined" 转换为 Long）
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public Map<String, Object> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {
        log.error("参数类型不匹配异常：", e);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 400);

        // 获取参数名称和期望的类型
        String paramName = e.getName();
        Class<?> requiredType = e.getRequiredType();
        Object value = e.getValue();

        // 构建友好的错误消息
        String msg = "参数类型错误";
        if (paramName != null && requiredType != null) {
            if (value != null && "undefined".equals(String.valueOf(value))) {
                msg = String.format("参数 '%s' 不能为空或未定义", paramName);
            } else {
                msg = String.format("参数 '%s' 类型错误，期望类型：%s，实际值：%s",
                    paramName, requiredType.getSimpleName(), value);
            }
        }

        result.put("msg", msg);
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


























