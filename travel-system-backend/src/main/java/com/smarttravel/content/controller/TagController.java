package com.smarttravel.content.controller;

import com.smarttravel.content.domain.Tag;
import com.smarttravel.content.service.TagService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tag")
@CrossOrigin
public class TagController {

    @Resource
    private TagService tagService;

    @GetMapping("/list")
    public Map<String, Object> list() {
        List<Tag> tags = tagService.listContentTags();
        Map<String, Object> res = new HashMap<>();
        res.put("code", 200);
        res.put("msg", "success");
        res.put("data", tags);
        return res;
    }
}


























































