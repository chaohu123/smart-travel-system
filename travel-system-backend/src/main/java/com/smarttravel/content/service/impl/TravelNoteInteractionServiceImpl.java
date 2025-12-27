package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.Comment;
import com.smarttravel.content.enums.BehaviorType;
import com.smarttravel.content.mapper.CommentMapper;
import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.content.service.TravelNoteInteractionService;
import com.smarttravel.user.domain.User;
import com.smarttravel.user.mapper.UserMapper;
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
    public Long publishComment(Long userId, String contentType, Long contentId,
                               String content, Long parentId) {
        Comment comment = new Comment();
        comment.setContentType(contentType);
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
        if ("note".equals(contentType)) {
            travelNoteMapper.incrementCommentCount(contentId);
        }

        // 记录评论行为
        userBehaviorMapper.insert(userId, BehaviorType.COMMENT.getCode(), contentType, contentId, BehaviorType.COMMENT.getWeight());

        return comment.getId();
    }

    @Override
    public List<Map<String, Object>> listComments(String contentType, Long contentId,
                                                   Integer pageNum, Integer pageSize) {
        List<Comment> comments = commentMapper.selectByContent(contentType, contentId);

        // 分页处理
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, comments.size());
        List<Comment> pageList = start < comments.size() ?
            comments.subList(start, end) : new ArrayList<>();

        // 转换为Map格式（可以包含用户信息等）
        List<Map<String, Object>> result = new ArrayList<>();
        for (Comment comment : pageList) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", comment.getId());
            map.put("userId", comment.getUserId());
            map.put("content", comment.getContent());
            map.put("parentId", comment.getParentId());
            map.put("likeCount", comment.getLikeCount());
            map.put("createTime", comment.getCreateTime());
            User user = userMapper.selectById(comment.getUserId());
            if (user != null) {
                map.put("nickname", user.getNickname());
                map.put("avatar", user.getAvatar());
                map.put("city", user.getCity());
            }
            result.add(map);
        }

        return result;
    }
}

