package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.NoteScenicRef;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NoteScenicRefMapper {
    int insert(NoteScenicRef ref);

    int deleteByNoteId(@Param("noteId") Long noteId);

    List<NoteScenicRef> selectByNoteId(@Param("noteId") Long noteId);
}





























