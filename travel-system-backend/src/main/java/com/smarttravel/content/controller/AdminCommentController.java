package com.smarttravel.content.controller;

import com.smarttravel.content.domain.Comment;
import com.smarttravel.content.mapper.CommentMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 评论管理接口
 */
@RestController
@RequestMapping("/api/v1/admin/comment")
@CrossOrigin
public class AdminCommentController {

    @Resource
    private CommentMapper commentMapper;

    @GetMapping("/list")
    public Map<String, Object> list(Comment query) {
        if (query == null) {
            query = new Comment();
        }
        query.setDelFlag(0);
        List<Comment> list = commentMapper.selectList(query);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", list.size());
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        Comment comment = commentMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", comment);
        return result;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Comment comment) {
        comment.setDelFlag(0);
        if (comment.getStatus() == null) {
            comment.setStatus(1);
        }
        if (comment.getLikeCount() == null) {
            comment.setLikeCount(0L);
        }
        commentMapper.insert(comment);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody Comment comment) {
        commentMapper.update(comment);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        Comment comment = new Comment();
        comment.setId(id);
        comment.setDelFlag(1);
        commentMapper.update(comment);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PostMapping("/audit")
    public Map<String, Object> audit(@RequestBody Map<String, Object> body) {
        Long id = ((Number) body.get("id")).longValue();
        Integer status = body.get("status") == null ? 0 : Integer.parseInt(body.get("status").toString());
        commentMapper.updateStatus(id, status);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }
}




