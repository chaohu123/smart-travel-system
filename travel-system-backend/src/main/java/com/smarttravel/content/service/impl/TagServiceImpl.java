package com.smarttravel.content.service.impl;

import com.smarttravel.content.domain.Tag;
import com.smarttravel.content.mapper.TagMapper;
import com.smarttravel.content.service.TagService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service
public class TagServiceImpl implements TagService {

    @Resource
    private TagMapper tagMapper;

    @Override
    public List<Tag> listContentTags() {
        Tag query = new Tag();
        query.setTagType("content");
        query.setStatus(1);
        query.setDelFlag(0);
        return tagMapper.selectList(query);
    }
}


























































