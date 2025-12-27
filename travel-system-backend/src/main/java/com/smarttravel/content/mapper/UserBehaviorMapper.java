package com.smarttravel.content.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface UserBehaviorMapper {
    int insert(@Param("userId") Long userId,
               @Param("behaviorType") String behaviorType,
               @Param("contentType") String contentType,
               @Param("contentId") Long contentId,
               @Param("score") Integer score);

    int checkExists(@Param("userId") Long userId,
                    @Param("behaviorType") String behaviorType,
                    @Param("contentType") String contentType,
                    @Param("contentId") Long contentId);

    int delete(@Param("userId") Long userId,
               @Param("behaviorType") String behaviorType,
               @Param("contentType") String contentType,
               @Param("contentId") Long contentId);

    /**
     * 查询用户的行为记录（用于推荐模块）
     */
    List<Map<String, Object>> selectByUserId(@Param("userId") Long userId,
                                              @Param("limit") Integer limit);

    /**
     * 统计用户对特定内容类型的总权重
     */
    Integer sumScoreByUserAndContentType(@Param("userId") Long userId,
                                         @Param("contentType") String contentType);

    /**
     * 记录浏览行为（如果已存在则不重复记录）
     */
    int recordView(@Param("userId") Long userId,
                   @Param("contentType") String contentType,
                   @Param("contentId") Long contentId);

    int countByUserAndBehavior(@Param("userId") Long userId,
                               @Param("behaviorType") String behaviorType,
                               @Param("contentType") String contentType);

    java.util.List<Long> selectContentIds(@Param("userId") Long userId,
                                          @Param("behaviorType") String behaviorType,
                                          @Param("contentType") String contentType,
                                          @Param("offset") Integer offset,
                                          @Param("limit") Integer limit);

    java.util.List<Long> selectContentIdsInList(@Param("userId") Long userId,
                                                @Param("behaviorType") String behaviorType,
                                                @Param("contentType") String contentType,
                                                @Param("contentIds") java.util.List<Long> contentIds);
}






