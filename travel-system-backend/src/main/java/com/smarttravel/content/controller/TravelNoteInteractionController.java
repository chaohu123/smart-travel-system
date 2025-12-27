package com.smarttravel.content.controller;

import com.smarttravel.content.service.TravelNoteInteractionService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 游记互动接口
 */
@RestController
@RequestMapping("/api/v1/travel/note/interaction")
@CrossOrigin
public class TravelNoteInteractionController {

    @Resource
    private TravelNoteInteractionService interactionService;

    /**
     * 点赞/取消点赞
     */
    @PostMapping("/like")
    public Map<String, Object> toggleLike(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        Long noteId = Long.valueOf(request.get("noteId").toString());
        Map<String, Object> result = interactionService.toggleLike(userId, noteId);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 收藏/取消收藏
     */
    @PostMapping("/favorite")
    public Map<String, Object> toggleFavorite(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        Long noteId = Long.valueOf(request.get("noteId").toString());
        Map<String, Object> result = interactionService.toggleFavorite(userId, noteId);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 发布评论
     */
    @PostMapping("/comment")
    public Map<String, Object> publishComment(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        String contentType = request.get("contentType").toString();
        Long contentId = Long.valueOf(request.get("contentId").toString());
        String content = request.get("content").toString();
        Long parentId = request.get("parentId") != null ?
            Long.valueOf(request.get("parentId").toString()) : 0L;

        Long commentId = interactionService.publishComment(userId, contentType, contentId, content, parentId);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", Collections.singletonMap("commentId", commentId));
        return response;
    }

    /**
     * 查询评论列表
     */
    @GetMapping("/comment/list")
    public Map<String, Object> listComments(
            @RequestParam String contentType,
            @RequestParam Long contentId,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        List<Map<String, Object>> list = interactionService.listComments(contentType, contentId, pageNum, pageSize);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", list);
        return response;
    }
}


