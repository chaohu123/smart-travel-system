package com.smarttravel.travel.mapper;

import com.smarttravel.travel.domain.TravelNote;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface TravelNoteMapper {

    List<TravelNote> selectList(TravelNote query);

    TravelNote selectById(@Param("id") Long id);

    int insert(TravelNote note);

    int update(TravelNote note);

    int deleteById(@Param("id") Long id);

    int deleteByIds(@Param("ids") Long[] ids);

    int incrementViewCount(@Param("id") Long id);

    int incrementLikeCount(@Param("id") Long id);

    int decrementLikeCount(@Param("id") Long id);

    int incrementFavoriteCount(@Param("id") Long id);

    int decrementFavoriteCount(@Param("id") Long id);

    int incrementCommentCount(@Param("id") Long id);

    int decrementCommentCount(@Param("id") Long id);

    int updateStatusAndRemark(@Param("id") Long id, @Param("status") String status, @Param("auditRemark") String auditRemark);

    int updateFeatured(@Param("id") Long id, @Param("isFeatured") Integer isFeatured);

    int countByUserId(@Param("userId") Long userId);

    List<TravelNote> selectByIds(@Param("ids") List<Long> ids);
}








