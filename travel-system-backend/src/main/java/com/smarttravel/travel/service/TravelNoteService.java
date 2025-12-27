package com.smarttravel.travel.service;

import com.smarttravel.travel.domain.TravelNote;

import java.util.List;

public interface TravelNoteService {

    List<TravelNote> list(TravelNote query);

    TravelNote getById(Long id);

    int create(TravelNote note);

    int update(TravelNote note);

    int deleteById(Long id);

    int deleteByIds(Long[] ids);

    int audit(Long id, String action, String remark);

    int feature(Long id, Integer isFeatured);
}








