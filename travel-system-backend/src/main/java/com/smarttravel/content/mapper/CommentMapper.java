package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommentMapper {
    int insert(Comment comment);
    List<Comment> selectByContent(@Param("contentType") String contentType, @Param("contentId") Long contentId);
    List<Comment> selectList(Comment query);
    Comment selectById(Long id);
    int update(Comment comment);
    int updateLikeCount(@Param("id") Long id, @Param("increment") Long increment);
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);
}





