package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.TravelNoteImage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TravelNoteImageMapper {
    int insert(TravelNoteImage image);
    int deleteByNoteId(Long noteId);
    List<TravelNoteImage> selectByNoteId(Long noteId);
}





























