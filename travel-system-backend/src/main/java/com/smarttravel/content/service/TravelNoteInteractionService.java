package com.smarttravel.content.service;

import java.util.List;
import java.util.Map;

/**
 * 游记互动服务接口
 */
public interface TravelNoteInteractionService {

    /**
     * 点赞/取消点赞
     */
    Map<String, Object> toggleLike(Long userId, Long noteId);

    /**
     * 收藏/取消收藏
     */
    Map<String, Object> toggleFavorite(Long userId, Long noteId);

    /**
     * 发布评论
     */
    Long publishComment(Long userId, String contentType, Long contentId,
                       String content, Long parentId);

    /**
     * 查询评论列表
     */
    List<Map<String, Object>> listComments(String contentType, Long contentId,
                                           Integer pageNum, Integer pageSize);
}


























