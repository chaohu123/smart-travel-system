package com.smarttravel.travel.service.impl;

import com.smarttravel.common.redis.RedisService;
import com.smarttravel.travel.domain.TravelNote;
import com.smarttravel.travel.mapper.TravelNoteMapper;
import com.smarttravel.travel.service.TravelNoteService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service
public class TravelNoteServiceImpl implements TravelNoteService {

    private static final String HOT_NOTES_CACHE_KEY = "recommend:hot:notes";

    @Resource
    private TravelNoteMapper travelNoteMapper;

    @Resource
    private RedisService redisService;

    @Override
    public List<TravelNote> list(TravelNote query) {
        return travelNoteMapper.selectList(query);
    }

    @Override
    public TravelNote getById(Long id) {
        return travelNoteMapper.selectById(id);
    }

    @Override
    public int create(TravelNote note) {
        if (note.getStatus() == null) {
            note.setStatus("pending");
        }
        if (note.getDelFlag() == null) {
            note.setDelFlag(0);
        }
        return travelNoteMapper.insert(note);
    }

    @Override
    public int update(TravelNote note) {
        return travelNoteMapper.update(note);
    }

    @Override
    public int deleteById(Long id) {
        return travelNoteMapper.deleteById(id);
    }

    @Override
    public int deleteByIds(Long[] ids) {
        return travelNoteMapper.deleteByIds(ids);
    }

    @Override
    public int audit(Long id, String action, String remark) {
        String status = "pending";
        if ("pass".equalsIgnoreCase(action)) {
            status = "pass";
        } else if ("reject".equalsIgnoreCase(action)) {
            status = "reject";
        }
        int rows = travelNoteMapper.updateStatusAndRemark(id, status, remark);
        if (rows > 0) {
            evictHotNotesCache();
        }
        return rows;
    }

    @Override
    public int feature(Long id, Integer isFeatured) {
        int rows = travelNoteMapper.updateFeatured(id, isFeatured);
        if (rows > 0) {
            evictHotNotesCache();
        }
        return rows;
    }

    private void evictHotNotesCache() {
        redisService.delete(HOT_NOTES_CACHE_KEY);
    }
}








