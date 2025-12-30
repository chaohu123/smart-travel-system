package com.smarttravel.user.mapper;

import com.smarttravel.user.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {
    List<User> selectList(User query);
    List<User> selectListWithPage(@Param("query") User query, @Param("offset") Integer offset, @Param("pageSize") Integer pageSize);
    int countList(User query);
    User selectById(@Param("id") Long id);
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    int updateProfile(User user);

    int insert(User user);

    User selectByOpenid(@Param("openid") String openid);

    /**
     * 批量软删除用户（将 del_flag 置为 1）
     */
    int batchDelete(@Param("ids") List<Long> ids);
}

