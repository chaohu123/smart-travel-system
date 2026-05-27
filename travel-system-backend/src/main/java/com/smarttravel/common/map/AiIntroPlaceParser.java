package com.smarttravel.common.map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 从 AI 日程 intro JSON 中提取地点名称
 */
public final class AiIntroPlaceParser {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Pattern BRACKET_NAME = Pattern.compile("【([^】\\n]{2,40})】");

    private AiIntroPlaceParser() {
    }

    public static List<String> extractPlaceNames(String intro) {
        List<String> ordered = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        if (intro == null || intro.trim().isEmpty()) {
            return ordered;
        }

        String introText = intro.trim();
        try {
            if (introText.startsWith("{") && introText.endsWith("}")) {
                JsonNode root = MAPPER.readTree(introText);
                appendFromText(ordered, seen, text(root, "morning"));
                appendFromText(ordered, seen, text(root, "noon"));
                appendFromText(ordered, seen, text(root, "lunch"));
                appendFromText(ordered, seen, text(root, "afternoon"));
                appendFromText(ordered, seen, text(root, "evening"));
                return ordered;
            }
        } catch (Exception ignored) {
            // fallback plain text
        }

        appendFromText(ordered, seen, introText);
        return ordered;
    }

    private static String text(JsonNode root, String field) {
        JsonNode node = root.get(field);
        return node == null || node.isNull() ? "" : node.asText("");
    }

    private static void appendFromText(List<String> ordered, Set<String> seen, String text) {
        if (text == null || text.trim().isEmpty()) {
            return;
        }
        Matcher matcher = BRACKET_NAME.matcher(text);
        while (matcher.find()) {
            String name = matcher.group(1).trim();
            if (name.length() < 2 || !containsChinese(name)) {
                continue;
            }
            String key = name.replace(" ", "");
            if (seen.add(key)) {
                ordered.add(name);
            }
        }
    }

    private static boolean containsChinese(String value) {
        return value != null && value.matches(".*[\u4e00-\u9fa5].*");
    }
}
