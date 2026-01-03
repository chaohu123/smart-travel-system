package com.smarttravel.content.service;

import com.smarttravel.travel.domain.TravelNote;
import com.smarttravel.content.domain.TravelNoteImage;

import java.util.List;
import java.util.Map;

/**
 * 游记用户侧服务接口
 */
public interface TravelNoteUserService {

    /**
     * 查询游记列表（分页、筛选、排序）
     */
    Map<String, Object> listNotes(Integer pageNum, Integer pageSize, Long cityId,
                                  String tagName, String sortBy);

    /**
     * 查询游记详情（含图片、评论）
     */
    Map<String, Object> getNoteDetail(Long id, Long userId);

    /**
     * 发布游记
     */
    Long publishNote(TravelNote note, List<String> imageUrls, List<Long> scenicIds, List<Long> tagIds);

    /**
     * 编辑我的游记
     */
    int updateMyNote(Long userId, TravelNote note, List<String> imageUrls,
                     List<Long> scenicIds, List<Long> tagIds);

    /**
     * 删除我的游记
     */
    int deleteMyNote(Long userId, Long noteId);

    /**
     * 增加浏览量（异步）
     */
    void incrementViewCount(Long noteId);

    /**
     * 查询我收藏的游记
     */
    Map<String, Object> listMyFavorites(Long userId, Integer pageNum, Integer pageSize);

    /**
     * 查询我发布的游记
     * @param status 可选，状态筛选：pending-待审核, pass-已通过, reject-已驳回
     */
    Map<String, Object> listMyNotes(Long userId, Integer pageNum, Integer pageSize, String status);

    /**
     * 查询我点赞的游记
     */
    Map<String, Object> listMyLikes(Long userId, Integer pageNum, Integer pageSize);

    /**
     * 查询我的评论列表
     */
    Map<String, Object> listMyComments(Long userId, Integer pageNum, Integer pageSize);
}






























































