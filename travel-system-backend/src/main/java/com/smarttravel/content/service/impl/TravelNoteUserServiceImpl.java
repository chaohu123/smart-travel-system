package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.TravelNoteImage;
import com.smarttravel.content.domain.NoteScenicRef;
import com.smarttravel.content.domain.ContentTag;
import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.mapper.CommentMapper;
import com.smarttravel.content.mapper.TravelNoteImageMapper;
import com.smarttravel.content.mapper.NoteScenicRefMapper;
import com.smarttravel.content.mapper.ContentTagMapper;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.mapper.TagMapper;
import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.content.domain.Comment;
import com.smarttravel.content.domain.Tag;
import com.smarttravel.user.mapper.UserMapper;
import com.smarttravel.user.domain.User;
import com.smarttravel.travel.domain.TravelNote;
import com.smarttravel.travel.mapper.TravelNoteMapper;
import com.smarttravel.content.service.TravelNoteUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 游记用户侧服务实现
 */
@Service
public class TravelNoteUserServiceImpl implements TravelNoteUserService {

    @Resource
    private TravelNoteMapper travelNoteMapper;

    @Resource
    private TravelNoteImageMapper travelNoteImageMapper;

    @Resource
    private NoteScenicRefMapper noteScenicRefMapper;

    @Resource
    private ContentTagMapper contentTagMapper;

    @Resource
    private CommentMapper commentMapper;

    @Resource
    private UserMapper userMapper;

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private TagMapper tagMapper;

    @Resource
    private UserBehaviorMapper userBehaviorMapper;

    @Override
    public Map<String, Object> listNotes(Integer pageNum, Integer pageSize, Long cityId,
                                         String tagName, String sortBy) {
        TravelNote query = new TravelNote();
        query.setCityId(cityId);
        query.setStatus("pass"); // 只查询已审核通过的

        List<TravelNote> allNotes = travelNoteMapper.selectList(query);

        // 标签过滤：根据标签名查出tagId，再过滤关联的游记
        if (tagName != null && !tagName.isEmpty()) {
            Tag tagQuery = new Tag();
            tagQuery.setTagName(tagName);
            tagQuery.setTagType("content");
            List<Tag> tags = tagMapper.selectList(tagQuery);
            if (!tags.isEmpty()) {
                Long tagId = tags.get(0).getId();
                List<Long> noteIds = new ArrayList<>();
                for (TravelNote n : allNotes) {
                    noteIds.add(n.getId());
                }
                if (!noteIds.isEmpty()) {
                    List<ContentTag> tagRelations = contentTagMapper.selectByContentIds("note", noteIds);
                    List<Long> matchedNoteIds = new ArrayList<>();
                    for (ContentTag ct : tagRelations) {
                        if (ct.getTagId().equals(tagId)) {
                            matchedNoteIds.add(ct.getContentId());
                        }
                    }
                    allNotes.removeIf(n -> !matchedNoteIds.contains(n.getId()));
                }
            }
        }

        // 排序处理
        if ("hot".equals(sortBy)) {
            allNotes.sort((a, b) -> {
                long scoreA = (a.getLikeCount() != null ? a.getLikeCount() : 0) * 2
                            + (a.getViewCount() != null ? a.getViewCount() : 0);
                long scoreB = (b.getLikeCount() != null ? b.getLikeCount() : 0) * 2
                            + (b.getViewCount() != null ? b.getViewCount() : 0);
                return Long.compare(scoreB, scoreA);
            });
        } else {
            // 默认按时间排序
            allNotes.sort((a, b) -> {
                if (a.getCreateTime() == null) return 1;
                if (b.getCreateTime() == null) return -1;
                return b.getCreateTime().compareTo(a.getCreateTime());
            });
        }

        // 分页处理
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, allNotes.size());
        List<TravelNote> pageList = start < allNotes.size() ?
            allNotes.subList(start, end) : new ArrayList<>();

        // 为每个游记加载第一张图片和作者信息
        List<Map<String, Object>> noteList = new ArrayList<>();
        for (TravelNote note : pageList) {
            Map<String, Object> noteMap = new HashMap<>();
            noteMap.put("id", note.getId());
            noteMap.put("title", note.getTitle());
            noteMap.put("content", note.getContent());
            noteMap.put("cityId", note.getCityId());
            noteMap.put("cityName", note.getCityName());
            noteMap.put("viewCount", note.getViewCount());
            noteMap.put("likeCount", note.getLikeCount());
            noteMap.put("favoriteCount", note.getFavoriteCount());
            noteMap.put("commentCount", note.getCommentCount());
            noteMap.put("isFeatured", note.getIsFeatured());
            noteMap.put("createTime", note.getCreateTime());
            noteMap.put("userId", note.getUserId());

            // 加载第一张图片
            List<TravelNoteImage> images = travelNoteImageMapper.selectByNoteId(note.getId());
            if (images != null && !images.isEmpty()) {
                noteMap.put("coverImage", images.get(0).getUrl());
            }
            // 加载作者信息
            if (note.getUserId() != null) {
                User authorUser = userMapper.selectById(note.getUserId());
                if (authorUser != null) {
                    note.setAuthorName(authorUser.getNickname());
                    note.setAuthorAvatar(authorUser.getAvatar());
                }
            }
            // 加载作者信息
            if (note.getUserId() != null) {
                User author = userMapper.selectById(note.getUserId());
                if (author != null) {
                    noteMap.put("authorName", author.getNickname());
                    noteMap.put("authorAvatar", author.getAvatar());
                }
            }

            noteList.add(noteMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", noteList);
        result.put("rows", noteList); // 兼容不同的字段名
        result.put("total", allNotes.size());
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    @Override
    public Map<String, Object> getNoteDetail(Long id, Long userId) {
        TravelNote note = travelNoteMapper.selectById(id);
        if (note == null) {
            return null;
        }

        // 异步增加浏览量
        new Thread(() -> {
            try {
                travelNoteMapper.incrementViewCount(id);
                if (userId != null) {
                    userBehaviorMapper.recordView(userId, "note", id);
                }
            } catch (Exception e) {
                // 忽略异常
            }
        }).start();

        // 加载图片
        List<TravelNoteImage> images = travelNoteImageMapper.selectByNoteId(id);

        // 加载标签
        List<ContentTag> contentTags = contentTagMapper.selectByContent("note", id);
        List<Long> tagIds = new ArrayList<>();
        for (ContentTag ct : contentTags) {
            tagIds.add(ct.getTagId());
        }

        // 加载关联景点
        List<NoteScenicRef> scenicRefs = noteScenicRefMapper.selectByNoteId(id);
        List<Map<String, Object>> scenicList = new ArrayList<>();
        for (NoteScenicRef ref : scenicRefs) {
            ScenicSpot spot = scenicSpotMapper.selectById(ref.getScenicId());
            if (spot != null) {
                Map<String, Object> scenicMap = new HashMap<>();
                scenicMap.put("id", spot.getId());
                scenicMap.put("name", spot.getName());
                scenicMap.put("address", spot.getAddress());
                scenicMap.put("score", spot.getScore());
                scenicList.add(scenicMap);
            }
        }

        // 加载最新评论（默认前10条）
        List<Comment> comments = commentMapper.selectByContent("note", id);
        List<Map<String, Object>> commentResult = new ArrayList<>();
        int limit = Math.min(10, comments.size());
        for (int i = 0; i < limit; i++) {
            Comment c = comments.get(i);
            Map<String, Object> cMap = new HashMap<>();
            cMap.put("id", c.getId());
            cMap.put("content", c.getContent());
            cMap.put("parentId", c.getParentId());
            cMap.put("createTime", c.getCreateTime());
            User user = userMapper.selectById(c.getUserId());
            if (user != null) {
                cMap.put("userId", user.getId());
                cMap.put("nickname", user.getNickname());
                cMap.put("avatar", user.getAvatar());
            }
            commentResult.add(cMap);
        }

        // 加载作者信息
        Map<String, Object> authorInfo = new HashMap<>();
        if (note.getUserId() != null) {
            User author = userMapper.selectById(note.getUserId());
            if (author != null) {
                authorInfo.put("id", author.getId());
                authorInfo.put("nickname", author.getNickname());
                authorInfo.put("avatar", author.getAvatar());
                authorInfo.put("city", author.getCity());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("note", note);
        result.put("author", authorInfo);
        result.put("images", images);
        result.put("tags", tagIds);
        result.put("scenics", scenicList);
        result.put("comments", commentResult);
        if (userId != null) {
            boolean liked = userBehaviorMapper.checkExists(userId, com.smarttravel.content.enums.BehaviorType.LIKE.getCode(), "note", id) > 0;
            boolean favorite = userBehaviorMapper.checkExists(userId, com.smarttravel.content.enums.BehaviorType.FAVORITE.getCode(), "note", id) > 0;
            result.put("isLiked", liked);
            result.put("isFavorite", favorite);
        }

        return result;
    }

    @Override
    @Transactional
    public Long publishNote(TravelNote note, List<String> imageUrls,
                           List<Long> scenicIds, List<Long> tagIds) {
        // 设置默认值
        if (note.getStatus() == null) {
            note.setStatus("pending"); // 待审核
        }
        if (note.getViewCount() == null) {
            note.setViewCount(0L);
        }
        if (note.getLikeCount() == null) {
            note.setLikeCount(0L);
        }
        if (note.getFavoriteCount() == null) {
            note.setFavoriteCount(0L);
        }
        if (note.getCommentCount() == null) {
            note.setCommentCount(0L);
        }
        if (note.getIsFeatured() == null) {
            note.setIsFeatured(0);
        }
        if (note.getDelFlag() == null) {
            note.setDelFlag(0);
        }

        // 插入游记
        travelNoteMapper.insert(note);
        Long noteId = note.getId();

        // 插入图片
        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (int i = 0; i < imageUrls.size(); i++) {
                TravelNoteImage image = new TravelNoteImage();
                image.setNoteId(noteId);
                image.setUrl(imageUrls.get(i));
                image.setSort(i);
                image.setCreateTime(LocalDateTime.now());
                image.setDelFlag(0);
                travelNoteImageMapper.insert(image);
            }
        }

        // 关联景点
        if (scenicIds != null && !scenicIds.isEmpty()) {
            for (Long scenicId : scenicIds) {
                NoteScenicRef ref = new NoteScenicRef();
                ref.setNoteId(noteId);
                ref.setScenicId(scenicId);
                ref.setCreateTime(LocalDateTime.now());
                ref.setDelFlag(0);
                noteScenicRefMapper.insert(ref);
            }
        }

        // 关联标签
        if (tagIds != null && !tagIds.isEmpty()) {
            for (Long tagId : tagIds) {
                ContentTag ct = new ContentTag();
                ct.setContentType("note");
                ct.setContentId(noteId);
                ct.setTagId(tagId);
                ct.setCreateTime(LocalDateTime.now());
                ct.setDelFlag(0);
                contentTagMapper.insert(ct);
            }
        }

        return noteId;
    }

    @Override
    @Transactional
    public int updateMyNote(Long userId, TravelNote note, List<String> imageUrls,
                            List<Long> scenicIds, List<Long> tagIds) {
        // 验证权限
        TravelNote existing = travelNoteMapper.selectById(note.getId());
        if (existing == null || !existing.getUserId().equals(userId)) {
            throw new RuntimeException("无权修改此游记");
        }

        // 更新游记
        note.setUserId(userId); // 确保userId不被修改
        travelNoteMapper.update(note);

        // 删除旧图片
        travelNoteImageMapper.deleteByNoteId(note.getId());

        // 插入新图片
        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (int i = 0; i < imageUrls.size(); i++) {
                TravelNoteImage image = new TravelNoteImage();
                image.setNoteId(note.getId());
                image.setUrl(imageUrls.get(i));
                image.setSort(i);
                image.setCreateTime(LocalDateTime.now());
                image.setDelFlag(0);
                travelNoteImageMapper.insert(image);
            }
        }

        // 更新景点关联
        noteScenicRefMapper.deleteByNoteId(note.getId());
        if (scenicIds != null && !scenicIds.isEmpty()) {
            for (Long scenicId : scenicIds) {
                NoteScenicRef ref = new NoteScenicRef();
                ref.setNoteId(note.getId());
                ref.setScenicId(scenicId);
                ref.setCreateTime(LocalDateTime.now());
                ref.setDelFlag(0);
                noteScenicRefMapper.insert(ref);
            }
        }

        // 更新标签关联
        contentTagMapper.deleteByContent("note", note.getId());
        if (tagIds != null && !tagIds.isEmpty()) {
            for (Long tagId : tagIds) {
                ContentTag ct = new ContentTag();
                ct.setContentType("note");
                ct.setContentId(note.getId());
                ct.setTagId(tagId);
                ct.setCreateTime(LocalDateTime.now());
                ct.setDelFlag(0);
                contentTagMapper.insert(ct);
            }
        }

        return 1;
    }

    @Override
    @Transactional
    public int deleteMyNote(Long userId, Long noteId) {
        TravelNote note = travelNoteMapper.selectById(noteId);
        if (note == null || !note.getUserId().equals(userId)) {
            throw new RuntimeException("无权删除此游记");
        }

        return travelNoteMapper.deleteById(noteId);
    }

    @Override
    public void incrementViewCount(Long noteId) {
        travelNoteMapper.incrementViewCount(noteId);
    }

    @Override
    public Map<String, Object> listMyFavorites(Long userId, Integer pageNum, Integer pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Long> noteIds = userBehaviorMapper.selectContentIds(userId,
            com.smarttravel.content.enums.BehaviorType.FAVORITE.getCode(), "note", offset, pageSize);
        int total = userBehaviorMapper.countByUserAndBehavior(userId,
            com.smarttravel.content.enums.BehaviorType.FAVORITE.getCode(), "note");

        List<TravelNote> notes = noteIds.isEmpty() ? new ArrayList<>() : travelNoteMapper.selectByIds(noteIds);
        // 保持原有顺序
        Map<Long, TravelNote> noteMap = notes.stream().collect(Collectors.toMap(TravelNote::getId, n -> n));
        List<TravelNote> ordered = new ArrayList<>();
        for (Long id : noteIds) {
            if (noteMap.containsKey(id)) {
                ordered.add(noteMap.get(id));
            }
        }

        Set<Long> likedIds = noteIds.isEmpty() ? java.util.Collections.emptySet()
            : userBehaviorMapper.selectContentIdsInList(userId,
            com.smarttravel.content.enums.BehaviorType.LIKE.getCode(), "note", noteIds)
            .stream().collect(Collectors.toSet());

        List<Map<String, Object>> list = new ArrayList<>();
        for (TravelNote note : ordered) {
            Map<String, Object> item = buildNoteCard(note);
            item.put("isFavorite", true);
            item.put("isLiked", likedIds.contains(note.getId()));
            list.add(item);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("total", total);
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    @Override
    public Map<String, Object> listMyNotes(Long userId, Integer pageNum, Integer pageSize) {
        TravelNote query = new TravelNote();
        query.setUserId(userId);
        List<TravelNote> all = travelNoteMapper.selectList(query);
        // 按时间排序
        all.sort((a, b) -> {
            if (a.getCreateTime() == null) return 1;
            if (b.getCreateTime() == null) return -1;
            return b.getCreateTime().compareTo(a.getCreateTime());
        });

        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, all.size());
        List<TravelNote> pageList = start < all.size() ? all.subList(start, end) : new ArrayList<>();

        List<Long> noteIds = pageList.stream().map(TravelNote::getId).collect(Collectors.toList());
        Set<Long> likedIds = noteIds.isEmpty() ? java.util.Collections.emptySet()
            : userBehaviorMapper.selectContentIdsInList(userId,
            com.smarttravel.content.enums.BehaviorType.LIKE.getCode(), "note", noteIds)
            .stream().collect(Collectors.toSet());
        Set<Long> favoriteIds = noteIds.isEmpty() ? java.util.Collections.emptySet()
            : userBehaviorMapper.selectContentIdsInList(userId,
            com.smarttravel.content.enums.BehaviorType.FAVORITE.getCode(), "note", noteIds)
            .stream().collect(Collectors.toSet());

        List<Map<String, Object>> list = new ArrayList<>();
        for (TravelNote note : pageList) {
            Map<String, Object> item = buildNoteCard(note);
            item.put("isFavorite", favoriteIds.contains(note.getId()));
            item.put("isLiked", likedIds.contains(note.getId()));
            list.add(item);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("total", all.size());
        result.put("pageNum", pageNum);
        result.put("pageSize", pageSize);
        return result;
    }

    private Map<String, Object> buildNoteCard(TravelNote note) {
        // 填充封面
        if (note.getCoverImage() == null) {
            List<TravelNoteImage> images = travelNoteImageMapper.selectByNoteId(note.getId());
            if (images != null && !images.isEmpty()) {
                note.setCoverImage(images.get(0).getUrl());
            }
        }
        Map<String, Object> item = new HashMap<>();
        item.put("id", note.getId());
        item.put("title", note.getTitle());
        item.put("cityId", note.getCityId());
        item.put("cityName", note.getCityName());
        item.put("coverImage", note.getCoverImage());
        item.put("likeCount", note.getLikeCount());
        item.put("favoriteCount", note.getFavoriteCount());
        item.put("commentCount", note.getCommentCount());
        item.put("createTime", note.getCreateTime());
        item.put("status", note.getStatus());
        return item;
    }
}



