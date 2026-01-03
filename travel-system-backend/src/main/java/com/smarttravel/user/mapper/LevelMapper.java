package com.smarttravel.user.mapper;

import com.smarttravel.user.domain.Level;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 等级配置Mapper
 */
@Mapper
public interface LevelMapper {

    /**
     * 插入等级配置
     */
    @Insert("INSERT INTO user_level (level, level_name, min_experience, max_experience, medal_name, medal_icon, description, status, create_time, update_time, del_flag) " +
            "VALUES (#{level}, #{levelName}, #{minExperience}, #{maxExperience}, #{medalName}, #{medalIcon}, #{description}, #{status}, NOW(), NOW(), 0)")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Level level);

    /**
     * 更新等级配置
     */
    @Update("UPDATE user_level SET level_name = #{levelName}, min_experience = #{minExperience}, max_experience = #{maxExperience}, " +
            "medal_name = #{medalName}, medal_icon = #{medalIcon}, description = #{description}, status = #{status}, update_time = NOW() " +
            "WHERE id = #{id} AND del_flag = 0")
    int update(Level level);

    /**
     * 根据ID查询
     */
    @Select("SELECT * FROM user_level WHERE id = #{id} AND del_flag = 0")
    Level selectById(Long id);

    /**
     * 根据等级数字查询
     */
    @Select("SELECT * FROM user_level WHERE level = #{level} AND del_flag = 0")
    Level selectByLevel(Integer level);

    /**
     * 查询所有启用的等级配置（按等级升序）
     */
    @Select("SELECT * FROM user_level WHERE status = 1 AND del_flag = 0 ORDER BY level ASC")
    List<Level> selectAllEnabled();

    /**
     * 分页查询等级列表
     */
    @Select("<script>" +
            "SELECT * FROM user_level WHERE del_flag = 0 " +
            "<if test='status != null'> AND status = #{status} </if>" +
            "ORDER BY level ASC " +
            "LIMIT #{offset}, #{pageSize}" +
            "</script>")
    List<Level> selectListWithPage(@Param("status") Integer status, @Param("offset") Integer offset, @Param("pageSize") Integer pageSize);

    /**
     * 统计总数
     */
    @Select("<script>" +
            "SELECT COUNT(*) FROM user_level WHERE del_flag = 0 " +
            "<if test='status != null'> AND status = #{status} </if>" +
            "</script>")
    int countList(@Param("status") Integer status);

    /**
     * 根据经验值查询对应的等级
     */
    @Select("SELECT * FROM user_level WHERE status = 1 AND del_flag = 0 " +
            "AND min_experience <= #{experience} " +
            "AND (max_experience IS NULL OR max_experience >= #{experience}) " +
            "ORDER BY level DESC LIMIT 1")
    Level selectByExperience(Integer experience);

    /**
     * 软删除
     */
    @Update("UPDATE user_level SET del_flag = 1, update_time = NOW() WHERE id = #{id}")
    int deleteById(Long id);
}

