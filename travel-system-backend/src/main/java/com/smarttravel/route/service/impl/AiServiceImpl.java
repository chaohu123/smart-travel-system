package com.smarttravel.route.service.impl;

import com.smarttravel.route.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * AI服务实现
 * 支持对接多种AI服务：OpenAI、百度文心、阿里通义等
 */
@Service
public class AiServiceImpl implements AiService {

    private static final Logger log = LoggerFactory.getLogger(AiServiceImpl.class);

    @Value("${ai.enabled:false}")
    private boolean aiEnabled;

    @Value("${ai.provider:openai}")
    private String aiProvider;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.api-url:}")
    private String apiUrl;

    @Override
    public Map<String, String> generateRouteText(String routeSummary, String userPreference) {
        Map<String, String> result = new HashMap<>();

        if (!isAvailable()) {
            // AI服务不可用时，返回规则生成的兜底文案
            return generateFallbackText(routeSummary, userPreference);
        }

        try {
            // 构建prompt
            String prompt = buildPrompt(routeSummary, userPreference);

            // 调用AI接口
            String aiResponse = callAiApi(prompt);

            // 解析AI返回结果
            result = parseAiResponse(aiResponse);

            // 验证结果完整性
            if (!isResponseValid(result)) {
                log.warn("AI返回结果不完整，使用兜底方案");
                return generateFallbackText(routeSummary, userPreference);
            }

            return result;
        } catch (Exception e) {
            log.error("AI服务调用失败，使用兜底方案", e);
            return generateFallbackText(routeSummary, userPreference);
        }
    }

    @Override
    public boolean isAvailable() {
        // 检查AI服务是否可用
        return aiEnabled && apiKey != null && !apiKey.isEmpty();
    }

    /**
     * 构建AI提示词
     */
    private String buildPrompt(String routeSummary, String userPreference) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位专业的旅游规划师。请根据以下行程信息，生成一段吸引人的行程描述。\n\n");
        prompt.append("行程信息：\n").append(routeSummary).append("\n\n");
        prompt.append("用户偏好：\n").append(userPreference).append("\n\n");
        prompt.append("请生成：\n");
        prompt.append("1. 整体行程概要（100-200字）\n");
        prompt.append("2. 每日行程说明（每天50-100字）\n");
        prompt.append("要求：语言生动、有吸引力，突出特色和亮点。");
        return prompt.toString();
    }

    /**
     * 调用AI API（需要根据实际使用的AI服务实现）
     */
    private String callAiApi(String prompt) throws Exception {
        // 目前未接入真实模型，这里使用伪造响应，避免抛异常影响业务流程
        // 若未来需要对接，可在此处根据 aiProvider 调用对应客户端
        StringBuilder sb = new StringBuilder();
        sb.append("SUMMARY:为您生成的行程，充分结合偏好。");
        sb.append("\nDAY1:抵达后游览市区核心景点，品尝特色小吃。");
        sb.append("\nDAY2:前往热门景区，体验代表性项目。");
        sb.append("\nPROMPT:").append(prompt);
        return sb.toString();
    }

    /**
     * 解析AI返回结果
     */
    private Map<String, String> parseAiResponse(String aiResponse) {
        Map<String, String> result = new HashMap<>();

        String[] lines = aiResponse.split("\n");
        for (String line : lines) {
            if (line.startsWith("SUMMARY:")) {
                result.put("summary", line.substring("SUMMARY:".length()).trim());
            } else if (line.startsWith("DAY1:")) {
                result.put("day1", line.substring("DAY1:".length()).trim());
            } else if (line.startsWith("DAY2:")) {
                result.put("day2", line.substring("DAY2:".length()).trim());
            }
        }

        // 兜底补充
        result.putIfAbsent("summary", extractSummary(aiResponse));
        result.putIfAbsent("day1", extractDayText(aiResponse, 1));
        result.putIfAbsent("day2", extractDayText(aiResponse, 2));

        return result;
    }

    /**
     * 提取概要
     */
    private String extractSummary(String response) {
        return "这是一段精心为您规划的行程，结合了您的兴趣偏好和当地热门推荐。";
    }

    /**
     * 提取每日说明
     */
    private String extractDayText(String response, int day) {
        return "第" + day + "天将带您探索城市的核心景点，体验当地特色美食。";
    }

    /**
     * 验证AI返回结果是否有效
     */
    private boolean isResponseValid(Map<String, String> result) {
        return result != null
            && result.containsKey("summary")
            && result.get("summary") != null
            && !result.get("summary").isEmpty();
    }

    /**
     * 生成兜底文案（规则生成）
     */
    private Map<String, String> generateFallbackText(String routeSummary, String userPreference) {
        Map<String, String> result = new HashMap<>();
        result.put("summary", "这是一段精心为您规划的行程，结合了您的兴趣偏好和当地热门推荐。行程安排合理，让您充分体验当地的风土人情。");
        result.put("day1", "第一天将带您探索城市的核心景点，体验当地特色美食，感受城市的独特魅力。");
        result.put("day2", "第二天继续深入探索，发现更多隐藏的宝藏，体验不一样的文化氛围。");
        return result;
    }
}





























