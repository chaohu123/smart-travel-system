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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        pageNum = normalizePageNum(pageNum);
        pageSize = normalizePageSize(pageSize);

        ScenicSpot query = new ScenicSpot();
        query.setCityId(cityId);
        query.setDelFlag(0);

        int offset = (pageNum - 1) * pageSize;
        List<ScenicSpot> pageList = scenicSpotMapper.selectListWithPage(query, offset, pageSize);
        int total = scenicSpotMapper.countList(query);

        Map<String, Object> result = new HashMap<>();
        result.put("list", pageList != null ? pageList : new ArrayList<>());
        result.put("total", total);
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    @Override
    public Map<String, Object> getSpotDetail(Long id) {
        ScenicSpot spot = scenicSpotMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();

        List<String> tagNames = new ArrayList<>();
        if (spot != null && spot.getId() != null) {
            List<Long> scenicIds = new ArrayList<>();
            scenicIds.add(spot.getId());
            List<ContentTag> contentTags = contentTagMapper.selectByContentIds("scenic", scenicIds);
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
        limit = normalizeLimit(limit);
        return scenicSpotMapper.selectHotByCityId(cityId, limit);
    }

    @Override
    public Map<String, Object> getMyFavorites(Long userId) {
        return getMyFavorites(userId, 1, 1000);
    }

    public Map<String, Object> getMyFavorites(Long userId, Integer pageNum, Integer pageSize) {
        pageNum = normalizePageNum(pageNum);
        pageSize = normalizePageSize(pageSize);
        int offset = (pageNum - 1) * pageSize;

        List<Long> favoriteIds = userBehaviorMapper.selectContentIds(
            userId,
            BehaviorType.FAVORITE.getCode(),
            "scenic",
            offset,
            pageSize
        );
        int total = userBehaviorMapper.countByUserAndBehavior(userId, BehaviorType.FAVORITE.getCode(), "scenic");

        List<ScenicSpot> favorites = new ArrayList<>();
        if (favoriteIds != null && !favoriteIds.isEmpty()) {
            for (Long id : favoriteIds) {
                ScenicSpot spot = scenicSpotMapper.selectById(id);
                if (spot != null && (spot.getDelFlag() == null || spot.getDelFlag() == 0)) {
                    favorites.add(spot);
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", favorites);
        result.put("total", total);
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    private int normalizePageNum(Integer pageNum) {
        return pageNum == null || pageNum < 1 ? 1 : pageNum;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return 10;
        }
        return Math.min(pageSize, 50);
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return 10;
        }
        return Math.min(limit, 50);
    }
}
