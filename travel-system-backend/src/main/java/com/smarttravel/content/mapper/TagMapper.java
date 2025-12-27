package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.Tag;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface TagMapper {
    List<Tag> selectList(Tag query);

    int insert(Tag tag);

    java.util.List<Tag> selectByIds(@org.apache.ibatis.annotations.Param("ids") java.util.List<Long> ids);
}




