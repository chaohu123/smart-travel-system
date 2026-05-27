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
            Map<String, String> fb = generateFallbackText(routeSummary, userPreference);
            fb.put("_ai_used", "false");
            fb.put("_ai_provider", aiProvider);
            return fb;
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
                Map<String, String> fb = generateFallbackText(routeSummary, userPreference);
                fb.put("_ai_used", "false");
                fb.put("_ai_provider", aiProvider);
                return fb;
            }

            log.info("========== AI旅游路线生成成功 ==========");
            result.put("_ai_used", "true");
            result.put("_ai_provider", aiProvider);
            return result;
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            // 检查是否是超时错误
            if (e instanceof java.net.SocketTimeoutException || 
                (errorMsg != null && (errorMsg.contains("timeout") || errorMsg.contains("timed out") || errorMsg.contains("Read timed out")))) {
                log.warn("========== AI服务调用超时，使用兜底方案 ==========");
                log.warn("DeepSeek API 响应超时（可能是网络延迟或API服务繁忙），已自动切换到兜底方案生成行程");
                log.warn("提示：系统已自动使用规则生成的行程方案，功能不受影响");
            }
            // 检查是否是服务不可用错误（503）
            else if (errorMsg != null && (errorMsg.contains("503") || errorMsg.contains("service_unavailable"))) {
                log.warn("========== AI服务暂时不可用，使用兜底方案 ==========");
                log.warn("DeepSeek API 服务繁忙，已自动切换到兜底方案生成行程");
            } else {
                log.error("========== AI服务调用失败，使用兜底方案 ==========", e);
                log.error("错误详情: {}", errorMsg);
                if (e.getCause() != null) {
                    log.error("根本原因: {}", e.getCause().getMessage());
                }
            }
            Map<String, String> fb = generateFallbackText(routeSummary, userPreference);
            fb.put("_ai_used", "false");
            fb.put("_ai_provider", aiProvider);
            return fb;
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
        prompt.append("请严格使用下列键名逐行输出（键名必须大写且与示例一致），不得省略任何一天、任一时间段。\n");
        prompt.append("SUMMARY: [整体行程概要，150-250字，突出行程亮点和特色]\n\n");
        prompt.append("对每个 DAYn_MORNING / DAYn_AFTERNOON / DAYn_EVENING，内容必须为固定结构（可多行），用于 App 展示：\n");
        prompt.append("第一行：时段主题标题，必须以「上午：」「下午：」或「晚上：」开头（与当前字段对应），冒号后为一句有画面感的主题（如：上午：邂逅古典园林的静谧诗意）。\n");
        prompt.append("第二行起依次三行，每行以星号+空格开头，且标签与冒号必须完全一致：\n");
        prompt.append("* 时间安排：[开始时间] - [结束时间]（24小时制，如 9:00 - 12:30）\n");
        prompt.append("* 详细行程：[该时段游览与活动的连续说明，结合用户选择的景点/美食，可含【站点名】等提示，80-180字]\n");
        prompt.append("* 交通方式：[具体交通：地铁线路与出口、步行分钟、公交等，单独成行，勿与详细行程混写]\n");
        prompt.append("禁止在以上三行中使用 Markdown 表格或其它格式；不要使用 ** 加粗符号。\n\n");
        prompt.append("示例（DAY1_MORNING 的值部分）：\n");
        prompt.append("DAY1_MORNING:\n");
        prompt.append("上午：探秘城市绿肺，沉浸植物王国\n");
        prompt.append("* 时间安排：9:00 - 12:30\n");
        prompt.append("* 详细行程：上午从上海植物园开始，游览盆景园与温室……\n");
        prompt.append("* 交通方式：建议乘坐地铁3号线至「石龙路」站，出站后步行约8分钟至2号门。\n\n");
        prompt.append("请按实际天数继续输出：DAY1_MORNING … DAY1_EVENING，再到最后一天，最大支持 DAY7_EVENING。\n");
        prompt.append("例如 3 天行程须完整包含 DAY1、DAY2、DAY3 各 MORNING/AFTERNOON/EVENING 共 9 段。\n\n");
        prompt.append("通用要求：\n");
        prompt.append("1. 语言生动、实用，突出当地特色\n");
        prompt.append("2. 结合用户偏好与用户选择的景点、美食，优先写入对应时段\n");
        prompt.append("3. 行程节奏合理，避免过于紧凑\n");
        prompt.append("4. 交通方式务必具体（线路、站点、步行时间等）\n");
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
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(40000);

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
        requestBody.put("max_tokens", 4096);

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
            
            // 移除 Markdown 标题标记 ###（每行开头）
            if (trimmedLine.startsWith("###")) {
                trimmedLine = trimmedLine.substring(3).trim();
            }

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
            } else if (trimmedLine.matches("^DAY([1-9]|1[0-9])_(MORNING|AFTERNOON|EVENING)(:.*)?$")) {
                // 保存之前的内容
                if (currentKey != null && currentContent.length() > 0) {
                    String savedContent = currentContent.toString().trim();
                    result.put(currentKey, savedContent);
                    log.debug("保存 {} 内容，长度: {} 字符", currentKey, savedContent.length());
                }
                // 提取天数和时间段
                int underscoreIndex = trimmedLine.indexOf('_');
                String dayNum = trimmedLine.substring(3, underscoreIndex); // 支持 DAY10 这种多位数字
                String timeSlot = trimmedLine.contains("MORNING") ? "MORNING" :
                                 trimmedLine.contains("AFTERNOON") ? "AFTERNOON" : "EVENING";
                currentKey = "day" + dayNum + "_" + timeSlot.toLowerCase();
                currentContent = new StringBuilder();
                // 处理带冒号和不带冒号的情况
                String prefix = "DAY" + dayNum + "_" + timeSlot;
                String content = "";
                if (trimmedLine.contains(":")) {
                    content = trimmedLine.substring(prefix.length() + 1).trim(); // +1 for colon
                }
                // 如果第一行有内容，添加到currentContent；否则内容在后续行
                if (!content.isEmpty()) {
                    currentContent.append(content);
                    if (i < lines.length - 1) {
                        currentContent.append("\n");
                    }
                }
                log.debug("开始解析 day{}_{}，首行内容: {}", dayNum, timeSlot, content.length() > 30 ? content.substring(0, 30) + "..." : content);
            } else if (trimmedLine.matches("^DAY([1-9]|1[0-9]):.*")) {
                // 兼容旧格式 DAY1: 格式
                if (currentKey != null && currentContent.length() > 0) {
                    String savedContent = currentContent.toString().trim();
                    result.put(currentKey, savedContent);
                    log.debug("保存 {} 内容，长度: {} 字符", currentKey, savedContent.length());
                }
                int colonIndex = trimmedLine.indexOf(':');
                String dayNum = trimmedLine.substring(3, colonIndex);
                currentKey = "day" + dayNum;
                currentContent = new StringBuilder();
                String content = trimmedLine.substring(("DAY" + dayNum + ":").length()).trim();
                if (!content.isEmpty()) {
                    currentContent.append(content);
                    if (i < lines.length - 1) {
                        currentContent.append("\n");
                    }
                }
                log.debug("开始解析 day{}（旧格式），首行内容: {}", dayNum, content.length() > 30 ? content.substring(0, 30) + "..." : content);
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
        // 检查是否有早中晚格式，如果没有则使用旧格式兜底
        boolean hasTimeSlotFormat = false;
        for (int day = 1; day <= 7; day++) {
            if (result.containsKey("day" + day + "_morning") ||
                result.containsKey("day" + day + "_afternoon") ||
                result.containsKey("day" + day + "_evening")) {
                hasTimeSlotFormat = true;
                break;
            }
        }

        if (!hasTimeSlotFormat) {
            // 使用旧格式兜底
            for (int day = 1; day <= 7; day++) {
                String dayKey = "day" + day;
                if (!result.containsKey(dayKey) || result.get(dayKey).isEmpty()) {
                    log.warn("{} 解析失败，使用兜底文案", dayKey);
                    String dayText = extractDayText(aiResponse, day);
                    result.put(dayKey, dayText);
                    // 将旧格式转换为早中晚格式
                    result.put("day" + day + "_morning", dayText);
                    result.put("day" + day + "_afternoon", dayText);
                    result.put("day" + day + "_evening", dayText);
                }
            }
        } else {
            // 补充缺失的早中晚计划
            for (int day = 1; day <= 7; day++) {
                String morningKey = "day" + day + "_morning";
                String afternoonKey = "day" + day + "_afternoon";
                String eveningKey = "day" + day + "_evening";

                if (!result.containsKey(morningKey) || result.get(morningKey).isEmpty()) {
                    result.put(morningKey, "第" + day + "天上午将带您探索城市的核心景点。");
                }
                if (!result.containsKey(afternoonKey) || result.get(afternoonKey).isEmpty()) {
                    result.put(afternoonKey, "第" + day + "天下午继续游览，体验当地特色。");
                }
                if (!result.containsKey(eveningKey) || result.get(eveningKey).isEmpty()) {
                    result.put(eveningKey, "第" + day + "天晚上享受当地美食，感受城市夜生活。");
                }
            }
        }

        return result;
    }

    /**
     * 提取概要
     */
    private String extractSummary(String response) {
        if (response == null || response.trim().isEmpty()) {
            return "这是一段精心为您规划的行程，结合了您的兴趣偏好和当地热门推荐。";
        }
        String normalized = response.replaceAll("\\*\\*", "").trim();
        int dayMarkerIndex = normalized.indexOf("DAY1");
        String candidate = dayMarkerIndex > 0 ? normalized.substring(0, dayMarkerIndex) : normalized;
        candidate = candidate
            .replace("SUMMARY:", "")
            .replace("SUMMARY：", "")
            .trim();
        if (!candidate.isEmpty()) {
            return candidate;
        }
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
        String fbMorning = "上午：城市经典线路初体验\n"
            + "* 时间安排：9:00 - 12:00\n"
            + "* 详细行程：根据您的偏好游览核心景点与街区，节奏舒缓，留出拍照与休息时间。\n"
            + "* 交通方式：建议优先地铁出行，到站后按导航步行前往各景点。";
        String fbAfternoon = "下午：美食与街巷漫步\n"
            + "* 时间安排：14:00 - 17:30\n"
            + "* 详细行程：安排当地特色餐饮与邻近街区漫步，体验城市生活氛围。\n"
            + "* 交通方式：午饭后可步行或短途打车/地铁前往下一处。";
        String fbEvening = "晚上：轻松收尾与夜景\n"
            + "* 时间安排：18:30 - 21:00\n"
            + "* 详细行程：晚餐后安排轻松活动或夜景打卡，避免过度疲劳。\n"
            + "* 交通方式：夜间建议地铁或正规网约车返回住处。";
        for (int d = 1; d <= 7; d++) {
            result.put("day" + d + "_morning", fbMorning);
            result.put("day" + d + "_afternoon", fbAfternoon);
            result.put("day" + d + "_evening", fbEvening);
        }
        result.put("day1", "第一天将带您探索城市的核心景点，体验当地特色美食，感受城市的独特魅力。");
        result.put("day2", "第二天继续深入探索，发现更多隐藏的宝藏，体验不一样的文化氛围。");
        result.put("_ai_used", "false");
        result.put("_ai_provider", aiProvider);
        return result;
    }
}





























