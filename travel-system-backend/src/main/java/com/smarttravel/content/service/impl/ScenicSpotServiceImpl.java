package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.ContentTag;
import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.domain.Tag;
import com.smarttravel.content.enums.BehaviorType;
import com.smarttravel.content.mapper.ContentTagMapper;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.mapper.TagMapper;
import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.content.service.ScenicSpotService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 景点服务实现
 */
@Service
public class ScenicSpotServiceImpl implements ScenicSpotService {

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private ContentTagMapper contentTagMapper;

    @Resource
    private TagMapper tagMapper;

    @Resource
    private UserBehaviorMapper userBehaviorMapper;

    @Override
    public Map<String, Object> listSpots(Integer pageNum, Integer pageSize, Long cityId,
                                         String tagName, String sortBy) {
        ScenicSpot query = new ScenicSpot();
        query.setCityId(cityId);
        query.setDelFlag(0);

        List<ScenicSpot> list = scenicSpotMapper.selectList(query);

        // 简化分页处理
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, list.size());
        List<ScenicSpot> pageList = list.subList(start, end);

        Map<String, Object> result = new HashMap<>();
        result.put("list", pageList);
        result.put("total", list.size());
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    @Override
    public Map<String, Object> getSpotDetail(Long id) {
        ScenicSpot spot = scenicSpotMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();

        // 获取景点标签
        List<String> tagNames = new ArrayList<>();
        if (spot != null && spot.getId() != null) {
            List<ContentTag> contentTags = contentTagMapper.selectByContentIds("scenic", Collections.singletonList(spot.getId()));
            if (contentTags != null && !contentTags.isEmpty()) {
                List<Long> tagIds = contentTags.stream()
                    .map(ContentTag::getTagId)
                    .collect(Collectors.toList());
                if (!tagIds.isEmpty()) {
                    List<Tag> tags = tagMapper.selectByIds(tagIds);
                    if (tags != null) {
                        tagNames = tags.stream()
                            .map(Tag::getTagName)
                            .collect(Collectors.toList());
                    }
                }
            }
        }

        result.put("spot", spot);
        result.put("tags", tagNames);
        return result;
    }

    @Override
    public List<ScenicSpot> getHotSpots(Long cityId, Integer limit) {
        return scenicSpotMapper.selectHotByCityId(cityId, limit);
    }

    @Override
    public Map<String, Object> getMyFavorites(Long userId) {
        // 获取用户收藏的景点ID列表
        List<Long> favoriteIds = userBehaviorMapper.selectContentIds(
            userId,
            BehaviorType.FAVORITE.getCode(),
            "scenic",
            0,
            1000
        );

        // 根据ID列表查询景点详情
        List<ScenicSpot> favorites = new ArrayList<>();
        if (favoriteIds != null && !favoriteIds.isEmpty()) {
            for (Long id : favoriteIds) {
                ScenicSpot spot = scenicSpotMapper.selectById(id);
                if (spot != null && spot.getDelFlag() == 0) {
                    favorites.add(spot);
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", favorites);
        result.put("total", favorites.size());
        return result;
    }
}

