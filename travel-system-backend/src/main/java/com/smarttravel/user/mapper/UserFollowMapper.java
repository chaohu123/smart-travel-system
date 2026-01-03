package com.smarttravel.user.mapper;

import com.smarttravel.user.domain.UserFollow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface UserFollowMapper {
    /**
     * 插入关注关系
     */
    int insert(UserFollow userFollow);

    /**
     * 取消关注（软删除）
     */
    int delete(@Param("userId") Long userId, @Param("followedUserId") Long followedUserId);

    /**
     * 查询是否已关注
     */
    UserFollow selectByUserAndFollowed(@Param("userId") Long userId, @Param("followedUserId") Long followedUserId);

    /**
     * 查询用户的粉丝列表（关注该用户的人）
     */
    List<Map<String, Object>> selectFollowers(@Param("userId") Long userId,
                                              @Param("currentUserId") Long currentUserId,
                                              @Param("offset") Integer offset, 
                                              @Param("pageSize") Integer pageSize);

    /**
     * 查询用户的关注列表（该用户关注的人）
     */
    List<Map<String, Object>> selectFollowing(@Param("userId") Long userId, 
                                               @Param("offset") Integer offset, 
                                               @Param("pageSize") Integer pageSize);

    /**
     * 统计粉丝数量
     */
    int countFollowers(@Param("userId") Long userId);

    /**
     * 统计关注数量
     */
    int countFollowing(@Param("userId") Long userId);
}

