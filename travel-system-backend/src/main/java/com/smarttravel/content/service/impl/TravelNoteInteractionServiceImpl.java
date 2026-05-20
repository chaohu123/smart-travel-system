package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.Comment;
import com.smarttravel.content.enums.BehaviorType;
import com.smarttravel.content.mapper.CommentMapper;
import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.content.service.TravelNoteInteractionService;
import com.smarttravel.user.domain.User;
import com.smarttravel.user.mapper.UserMapper;
import com.smarttravel.travel.domain.TravelNote;
import com.smarttravel.travel.mapper.TravelNoteMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 游记互动服务实现
 */
@Service
public class TravelNoteInteractionServiceImpl implements TravelNoteInteractionService {

    @Resource
    private UserBehaviorMapper userBehaviorMapper;

    @Resource
    private TravelNoteMapper travelNoteMapper;

    @Resource
    private CommentMapper commentMapper;

    @Resource
    private UserMapper userMapper;

    @Override
    @Transactional
    public Map<String, Object> toggleLike(Long userId, Long noteId) {
        Map<String, Object> result = new HashMap<>();

        // 检查是否已点赞
        int exists = userBehaviorMapper.checkExists(userId, BehaviorType.LIKE.getCode(), "note", noteId);

        if (exists > 0) {
            // 取消点赞
            userBehaviorMapper.delete(userId, BehaviorType.LIKE.getCode(), "note", noteId);
            travelNoteMapper.decrementLikeCount(noteId);
            result.put("isLiked", false);
            result.put("action", "unlike");
        } else {
            // 点赞
            userBehaviorMapper.insert(userId, BehaviorType.LIKE.getCode(), "note", noteId, BehaviorType.LIKE.getWeight());
            travelNoteMapper.incrementLikeCount(noteId);
            result.put("isLiked", true);
            result.put("action", "like");
        }

        // 获取更新后的点赞数
        result.put("likeCount", travelNoteMapper.selectById(noteId).getLikeCount());

        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> toggleFavorite(Long userId, Long noteId) {
        Map<String, Object> result = new HashMap<>();

        // 检查是否已收藏
        int exists = userBehaviorMapper.checkExists(userId, BehaviorType.FAVORITE.getCode(), "note", noteId);

        if (exists > 0) {
            // 取消收藏
            userBehaviorMapper.delete(userId, BehaviorType.FAVORITE.getCode(), "note", noteId);
            travelNoteMapper.decrementFavoriteCount(noteId);
            result.put("isFavorite", false);
            result.put("action", "unfavorite");
        } else {
            // 收藏
            userBehaviorMapper.insert(userId, BehaviorType.FAVORITE.getCode(), "note", noteId, BehaviorType.FAVORITE.getWeight());
            travelNoteMapper.incrementFavoriteCount(noteId);
            result.put("isFavorite", true);
            result.put("action", "favorite");
        }

        result.put("favoriteCount", travelNoteMapper.selectById(noteId).getFavoriteCount());

        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> publishComment(Long userId, String contentType, Long contentId,
                                              String content, Long parentId) {
        String normalizedContentType = normalizeContentType(contentType);
        Comment comment = new Comment();
        comment.setContentType(normalizedContentType);
        comment.setContentId(contentId);
        comment.setUserId(userId);
        comment.setContent(content);
        comment.setParentId(parentId != null ? parentId : 0L);
        comment.setStatus(1);
        comment.setLikeCount(0L);
        comment.setCreateTime(LocalDateTime.now());
        comment.setDelFlag(0);

        commentMapper.insert(comment);

        // 如果是游记评论，增加评论数
        Long commentCount = null;
        if (isNoteContent(normalizedContentType)) {
            travelNoteMapper.incrementCommentCount(contentId);
            TravelNote note = travelNoteMapper.selectById(contentId);
            if (note != null) {
                commentCount = note.getCommentCount();
            }
        }

        // 记录评论行为
        userBehaviorMapper.insert(userId, BehaviorType.COMMENT.getCode(), normalizedContentType, contentId, BehaviorType.COMMENT.getWeight());

        Map<String, Object> result = new HashMap<>();
        result.put("commentId", comment.getId());
        result.put("comment", buildCommentMap(comment, userId));
        if (commentCount != null) {
            result.put("commentCount", commentCount);
        }
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> toggleCommentLike(Long userId, Long commentId) {
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            throw new RuntimeException("评论不存在");
        }

        Map<String, Object> result = new HashMap<>();
        int exists = userBehaviorMapper.checkExists(userId, BehaviorType.LIKE.getCode(), "comment", commentId);

        if (exists > 0) {
            userBehaviorMapper.delete(userId, BehaviorType.LIKE.getCode(), "comment", commentId);
            commentMapper.updateLikeCount(commentId, -1L);
            result.put("isLiked", false);
            result.put("action", "unlike");
        } else {
            userBehaviorMapper.insert(userId, BehaviorType.LIKE.getCode(), "comment", commentId, BehaviorType.LIKE.getWeight());
            commentMapper.updateLikeCount(commentId, 1L);
            result.put("isLiked", true);
            result.put("action", "like");
        }

        Comment updated = commentMapper.selectById(commentId);
        result.put("likeCount", updated != null && updated.getLikeCount() != null ? updated.getLikeCount() : 0L);
        return result;
    }

    @Override
    public List<Map<String, Object>> listComments(String contentType, Long contentId,
                                                   Integer pageNum, Integer pageSize, Long userId) {
        String normalizedContentType = normalizeContentType(contentType);
        List<Comment> comments = selectCommentsByContent(normalizedContentType, contentId);

        // 分页处理
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, comments.size());
        List<Comment> pageList = start < comments.size() ?
            comments.subList(start, end) : new ArrayList<>();

        // 转换为Map格式（可以包含用户信息等）
        List<Map<String, Object>> result = new ArrayList<>();
        for (Comment comment : pageList) {
            result.add(buildCommentMap(comment, userId));
        }

        return result;
    }

    private String normalizeContentType(String contentType) {
        if ("travel_note".equals(contentType)) {
            return "note";
        }
        return contentType;
    }

    private boolean isNoteContent(String contentType) {
        return "note".equals(contentType);
    }

    private List<Comment> selectCommentsByContent(String contentType, Long contentId) {
        List<Comment> comments = new ArrayList<>(commentMapper.selectByContent(contentType, contentId));
        if (isNoteContent(contentType)) {
            for (Comment comment : commentMapper.selectByContent("travel_note", contentId)) {
                boolean exists = comments.stream().anyMatch(item -> item.getId().equals(comment.getId()));
                if (!exists) {
                    comments.add(comment);
                }
            }
            comments.sort((a, b) -> {
                if (a.getCreateTime() == null) return 1;
                if (b.getCreateTime() == null) return -1;
                return b.getCreateTime().compareTo(a.getCreateTime());
            });
        }
        return comments;
    }

    private Map<String, Object> buildCommentMap(Comment comment, Long currentUserId) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", comment.getId());
        map.put("contentType", comment.getContentType());
        map.put("contentId", comment.getContentId());
        map.put("userId", comment.getUserId());
        map.put("content", comment.getContent());
        map.put("parentId", comment.getParentId());
        map.put("likeCount", comment.getLikeCount());
        map.put("createTime", comment.getCreateTime());
        map.put("isLiked", currentUserId != null
                && userBehaviorMapper.checkExists(currentUserId, BehaviorType.LIKE.getCode(), "comment", comment.getId()) > 0);
        User user = userMapper.selectById(comment.getUserId());
        if (user != null) {
            map.put("nickname", user.getNickname());
            map.put("avatar", user.getAvatar());
            map.put("city", user.getCity());
        }
        return map;
    }
}
