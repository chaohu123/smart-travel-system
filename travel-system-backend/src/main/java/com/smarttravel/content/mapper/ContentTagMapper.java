package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.ContentTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ContentTagMapper {
    int insert(ContentTag tag);

    int deleteByContent(@Param("contentType") String contentType, @Param("contentId") Long contentId);

    /**
     * 查询单个内容的标签列表
     */
    java.util.List<ContentTag> selectByContent(@Param("contentType") String contentType, @Param("contentId") Long contentId);

    /**
     * 批量查询内容的标签列表
     */
    java.util.List<ContentTag> selectByContentIds(@Param("contentType") String contentType, @Param("contentIds") java.util.List<Long> contentIds);
}



