package com.smarttravel.travel.service.impl;

import com.smarttravel.travel.domain.TravelNote;
import com.smarttravel.travel.mapper.TravelNoteMapper;
import com.smarttravel.travel.service.TravelNoteService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service
public class TravelNoteServiceImpl implements TravelNoteService {

    @Resource
    private TravelNoteMapper travelNoteMapper;

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
        return travelNoteMapper.updateStatusAndRemark(id, status, remark);
    }

    @Override
    public int feature(Long id, Integer isFeatured) {
        return travelNoteMapper.updateFeatured(id, isFeatured);
    }
}








