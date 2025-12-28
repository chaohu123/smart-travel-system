package com.smarttravel.route.service.impl;

import com.smarttravel.route.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * AI服务实现
 * 支持对接多种AI服务：OpenAI、百度文心、阿里通义等
 */
@Service
public class AiServiceImpl implements AiService {

    private static final Logger log = LoggerFactory.getLogger(AiServiceImpl.class);

    @Value("${ai.enabled:false}")
    private boolean aiEnabled;

    @Value("${ai.provider:deepseek}")
    private String aiProvider;

    @Value("${ai.api-key:}")
    private String apiKeyFromConfig;

    @Value("${ai.api-url:https://api.deepseek.com/v1/chat/completions}")
    private String apiUrl;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 获取 API Key，优先从环境变量读取，其次从配置文件读取
     */
    private String getApiKey() {
        // 优先从环境变量读取（IDEA 运行配置中可以设置）
        String envApiKey = System.getenv("DEEPSEEK_API_KEY");
        if (envApiKey != null && !envApiKey.trim().isEmpty()) {
            log.info("从环境变量 DEEPSEEK_API_KEY 读取 API Key");
            return envApiKey.trim();
        }

        // 其次从系统属性读取（IDEA VM options: -DDEEPSEEK_API_KEY=xxx）
        String sysApiKey = System.getProperty("DEEPSEEK_API_KEY");
        if (sysApiKey != null && !sysApiKey.trim().isEmpty()) {
            log.info("从系统属性 DEEPSEEK_API_KEY 读取 API Key");
            return sysApiKey.trim();
        }

        // 最后从配置文件读取
        if (apiKeyFromConfig != null && !apiKeyFromConfig.trim().isEmpty()) {
            log.info("从配置文件读取 API Key");
            return apiKeyFromConfig.trim();
        }

        return null;
    }

    @Override
    public Map<String, String> generateRouteText(String routeSummary, String userPreference) {
        Map<String, String> result = new HashMap<>();

        log.info("========== 开始生成AI旅游路线 ==========");
        log.info("行程摘要: {}", routeSummary);
        log.info("用户偏好: {}", userPreference);
        log.info("AI服务配置: enabled={}, provider={}", aiEnabled, aiProvider);

        if (!isAvailable()) {
            log.warn("AI服务不可用，使用兜底方案");
            // AI服务不可用时，返回规则生成的兜底文案
            return generateFallbackText(routeSummary, userPreference);
        }

        try {
            // 构建prompt
            String prompt = buildPrompt(routeSummary, userPreference);
            log.debug("构建的Prompt长度: {} 字符", prompt.length());
            log.debug("Prompt内容预览: {}", prompt.substring(0, Math.min(200, prompt.length())) + "...");

            // 调用AI接口
            log.info("开始调用 DeepSeek API...");
            long startTime = System.currentTimeMillis();
            String aiResponse = callAiApi(prompt);
            long endTime = System.currentTimeMillis();
            log.info("DeepSeek API 调用成功，耗时: {} ms", (endTime - startTime));
            log.info("API返回原始响应长度: {} 字符", aiResponse.length());
            log.debug("API返回原始响应内容: {}", aiResponse);

            // 解析AI返回结果
            log.info("开始解析AI返回结果...");
            result = parseAiResponse(aiResponse);
            log.info("解析完成，提取到的字段: {}", result.keySet());
            for (Map.Entry<String, String> entry : result.entrySet()) {
                log.debug("  {}: {}", entry.getKey(),
                    entry.getValue() != null ? entry.getValue().substring(0, Math.min(100, entry.getValue().length())) + "..." : "null");
            }

            // 验证结果完整性
            if (!isResponseValid(result)) {
                log.warn("AI返回结果不完整，使用兜底方案");
                return generateFallbackText(routeSummary, userPreference);
            }

            log.info("========== AI旅游路线生成成功 ==========");
            return result;
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            // 检查是否是服务不可用错误（503）
            if (errorMsg != null && (errorMsg.contains("503") || errorMsg.contains("service_unavailable"))) {
                log.warn("========== AI服务暂时不可用，使用兜底方案 ==========");
                log.warn("DeepSeek API 服务繁忙，已自动切换到兜底方案生成行程");
            } else {
                log.error("========== AI服务调用失败，使用兜底方案 ==========", e);
                log.error("错误详情: {}", errorMsg);
                if (e.getCause() != null) {
                    log.error("根本原因: {}", e.getCause().getMessage());
                }
            }
            return generateFallbackText(routeSummary, userPreference);
        }
    }

    @Override
    public boolean isAvailable() {
        // 检查AI服务是否可用
        String apiKey = getApiKey();
        boolean available = aiEnabled && apiKey != null && !apiKey.isEmpty();
        log.debug("AI服务可用性检查: enabled={}, provider={}, hasApiKey={}, available={}",
            aiEnabled, aiProvider, apiKey != null && !apiKey.isEmpty(), available);
        return available;
    }

    /**
     * 构建AI提示词
     */
    private String buildPrompt(String routeSummary, String userPreference) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位专业的旅游规划师，擅长为不同需求的游客制定个性化旅游行程。\n\n");
        prompt.append("请根据以下信息，生成一份详细的旅游行程规划：\n\n");
        prompt.append("【行程基础信息】\n");
        prompt.append(routeSummary).append("\n\n");
        prompt.append("【用户偏好与需求】\n");
        prompt.append(userPreference).append("\n\n");
        prompt.append("【输出要求】\n");
        prompt.append("请按照以下格式输出，确保内容生动有趣、实用详细：\n\n");
        prompt.append("SUMMARY: [整体行程概要，150-250字，突出行程亮点和特色]\n");
        prompt.append("DAY1: [第一天详细行程说明，100-150字，包括主要景点、美食推荐、时间安排建议]\n");
        prompt.append("DAY2: [第二天详细行程说明，100-150字]\n");
        prompt.append("DAY3: [第三天详细行程说明，100-150字，如果只有2天则省略]\n");
        prompt.append("DAY4: [第四天详细行程说明，100-150字，如果只有2-3天则省略]\n");
        prompt.append("DAY5: [第五天详细行程说明，100-150字，如果只有2-4天则省略]\n\n");
        prompt.append("要求：\n");
        prompt.append("1. 语言生动有趣，富有吸引力\n");
        prompt.append("2. 突出当地特色和亮点\n");
        prompt.append("3. 提供实用的时间安排建议\n");
        prompt.append("4. 结合用户偏好推荐合适的景点和美食\n");
        prompt.append("5. 确保行程安排合理，避免过于紧凑");
        return prompt.toString();
    }

    /**
     * 调用AI API - 支持 DeepSeek
     */
    private String callAiApi(String prompt) throws Exception {
        // 如果 provider 是 deepseek，调用 DeepSeek API
        if ("deepseek".equalsIgnoreCase(aiProvider)) {
            return callDeepSeekApi(prompt);
        }

        // 其他 provider 可以在这里扩展
        // 默认使用兜底方案
        log.warn("不支持的 AI provider: " + aiProvider + "，使用兜底方案");
        return generateMockResponse(prompt);
    }

    /**
     * 调用 DeepSeek API
     */
    private String callDeepSeekApi(String prompt) throws Exception {
        String apiKey = getApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            throw new Exception("API Key 未配置，请设置环境变量 DEEPSEEK_API_KEY 或在 IDEA 运行配置中设置");
        }

        if (apiUrl == null || apiUrl.isEmpty()) {
            apiUrl = "https://api.deepseek.com/v1/chat/completions";
        }

        log.info("准备调用 DeepSeek API");
        log.debug("API URL: {}", apiUrl);
        log.debug("API Key 前6位: {}...", apiKey.length() > 6 ? apiKey.substring(0, 6) : "***");

        URL url = new URL(apiUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        conn.setDoOutput(true);
        conn.setConnectTimeout(30000); // 30秒连接超时
        conn.setReadTimeout(60000);   // 60秒读取超时

        // 构建请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "deepseek-chat");
        requestBody.put("messages", new Object[]{
            new HashMap<String, String>() {{
                put("role", "user");
                put("content", prompt);
            }}
        });
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 2000);

        String requestBodyJson = objectMapper.writeValueAsString(requestBody);
        log.debug("请求体: {}", requestBodyJson);

        // 发送请求
        log.debug("发送HTTP请求...");
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = requestBodyJson.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
            log.debug("请求体已发送，大小: {} bytes", input.length);
        }

        // 读取响应
        int responseCode = conn.getResponseCode();
        log.info("HTTP响应状态码: {}", responseCode);

        if (responseCode != HttpURLConnection.HTTP_OK) {
            BufferedReader errorReader = new BufferedReader(
                new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
            StringBuilder errorResponse = new StringBuilder();
            String errorLine;
            while ((errorLine = errorReader.readLine()) != null) {
                errorResponse.append(errorLine);
            }
            errorReader.close();

            String errorMsg = "DeepSeek API 调用失败，状态码: " + responseCode + ", 错误信息: " + errorResponse.toString();

            // 对于 503 服务不可用错误，记录警告而不是错误，因为这是临时性问题
            if (responseCode == HttpURLConnection.HTTP_UNAVAILABLE || responseCode == 503) {
                log.warn("DeepSeek API 服务暂时不可用 (503)，将使用兜底方案: {}", errorResponse.toString());
            } else {
                log.error(errorMsg);
            }

            throw new Exception(errorMsg);
        }

        log.debug("开始读取响应内容...");
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();

        String responseStr = response.toString();
        log.info("收到API响应，长度: {} 字符", responseStr.length());
        log.debug("API响应原始内容: {}", responseStr);

        // 解析响应
        log.debug("开始解析JSON响应...");
        JsonNode jsonNode = objectMapper.readTree(responseStr);

        // 记录完整的响应结构用于调试
        log.debug("响应JSON结构: {}", jsonNode.toPrettyString());

        JsonNode choices = jsonNode.get("choices");
        if (choices != null && choices.isArray() && choices.size() > 0) {
            JsonNode message = choices.get(0).get("message");
            if (message != null) {
                JsonNode content = message.get("content");
                if (content != null) {
                    String contentText = content.asText();
                    log.info("成功提取AI生成内容，长度: {} 字符", contentText.length());
                    return contentText;
                } else {
                    log.error("响应中未找到 content 字段");
                }
            } else {
                log.error("响应中未找到 message 字段");
            }
        } else {
            log.error("响应中未找到 choices 数组或数组为空");
        }

        String errorMsg = "DeepSeek API 返回格式异常: " + responseStr;
        log.error(errorMsg);
        throw new Exception(errorMsg);
    }

    /**
     * 生成模拟响应（兜底方案）
     */
    private String generateMockResponse(String prompt) {
        StringBuilder sb = new StringBuilder();
        sb.append("SUMMARY:为您精心规划的行程，充分结合您的偏好和需求，让您充分体验当地的风土人情和特色文化。");
        sb.append("\nDAY1:第一天将带您探索城市的核心景点，体验当地特色美食，感受城市的独特魅力。");
        sb.append("\nDAY2:第二天继续深入探索，发现更多隐藏的宝藏，体验不一样的文化氛围。");
        return sb.toString();
    }

    /**
     * 解析AI返回结果
     * 支持格式: SUMMARY: 或 **SUMMARY:** 或 SUMMARY:
     * 支持格式: DAY1: 或 **DAY1:** 或 DAY1:
     */
    private Map<String, String> parseAiResponse(String aiResponse) {
        Map<String, String> result = new HashMap<>();

        log.info("开始解析AI返回结果...");
        log.debug("原始响应内容长度: {} 字符", aiResponse.length());

        // 移除所有 ** 标记，统一处理
        String normalizedResponse = aiResponse.replaceAll("\\*\\*", "");

        String[] lines = normalizedResponse.split("\n");
        log.debug("分割后行数: {}", lines.length);

        String currentKey = null;
        StringBuilder currentContent = new StringBuilder();

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String trimmedLine = line.trim();

            // 检查是否是新的标记行
            if (trimmedLine.startsWith("SUMMARY:")) {
                // 保存之前的内容
                if (currentKey != null && currentContent.length() > 0) {
                    String savedContent = currentContent.toString().trim();
                    result.put(currentKey, savedContent);
                    log.debug("保存 {} 内容，长度: {} 字符", currentKey, savedContent.length());
                }
                // 开始新的内容
                currentKey = "summary";
                currentContent = new StringBuilder();
                String content = trimmedLine.substring("SUMMARY:".length()).trim();
                if (!content.isEmpty()) {
                    currentContent.append(content);
                    if (i < lines.length - 1) {
                        currentContent.append("\n");
                    }
                }
                log.debug("开始解析 summary，首行内容: {}", content.length() > 30 ? content.substring(0, 30) + "..." : content);
            } else if (trimmedLine.matches("^DAY[1-5]:.*")) {
                // 保存之前的内容
                if (currentKey != null && currentContent.length() > 0) {
                    String savedContent = currentContent.toString().trim();
                    result.put(currentKey, savedContent);
                    log.debug("保存 {} 内容，长度: {} 字符", currentKey, savedContent.length());
                }
                // 提取天数
                String dayNum = trimmedLine.substring(3, 4); // 提取DAY后面的数字
                currentKey = "day" + dayNum;
                currentContent = new StringBuilder();
                String content = trimmedLine.substring(("DAY" + dayNum + ":").length()).trim();
                if (!content.isEmpty()) {
                    currentContent.append(content);
                    if (i < lines.length - 1) {
                        currentContent.append("\n");
                    }
                }
                log.debug("开始解析 day{}，首行内容: {}", dayNum, content.length() > 30 ? content.substring(0, 30) + "..." : content);
            } else if (currentKey != null) {
                // 继续累积当前内容（跳过空行，但保留非空行）
                if (!trimmedLine.isEmpty()) {
                    currentContent.append(trimmedLine);
                    if (i < lines.length - 1) {
                        currentContent.append("\n");
                    }
                }
            }
        }

        // 保存最后一个内容
        if (currentKey != null && currentContent.length() > 0) {
            String savedContent = currentContent.toString().trim();
            result.put(currentKey, savedContent);
            log.debug("保存最后一个 {} 内容，长度: {} 字符", currentKey, savedContent.length());
        }

        log.info("解析完成，提取到的字段: {}", result.keySet());
        for (Map.Entry<String, String> entry : result.entrySet()) {
            String value = entry.getValue();
            String preview = value.length() > 50 ? value.substring(0, 50) + "..." : value;
            log.debug("  {}: {}", entry.getKey(), preview);
        }

        // 兜底补充（如果解析失败）
        if (!result.containsKey("summary") || result.get("summary").isEmpty()) {
            log.warn("summary 解析失败，使用兜底文案");
            result.put("summary", extractSummary(aiResponse));
        }
        for (int day = 1; day <= 5; day++) {
            String dayKey = "day" + day;
            if (!result.containsKey(dayKey) || result.get(dayKey).isEmpty()) {
                log.warn("{} 解析失败，使用兜底文案", dayKey);
                result.put(dayKey, extractDayText(aiResponse, day));
            }
        }

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






























