package com.smarttravel.travel.controller;

import com.smarttravel.travel.domain.TravelNote;
import com.smarttravel.travel.service.TravelNoteService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/v1/admin/travel/note")
@CrossOrigin
public class AdminTravelNoteController {

    @Resource
    private TravelNoteService travelNoteService;

    @GetMapping("/list")
    public Map<String, Object> list(TravelNote query) {
        // 简化：先不做真正分页，返回全部数据和 total
        List<TravelNote> list = travelNoteService.list(query);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", list.size());
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        TravelNote note = travelNoteService.getById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", note);
        return result;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody TravelNote note) {
        travelNoteService.create(note);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody TravelNote note) {
        travelNoteService.update(note);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        travelNoteService.deleteById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PostMapping("/audit")
    public Map<String, Object> audit(@RequestBody Map<String, Object> body) {
        Long id = ((Number) body.get("id")).longValue();
        String action = (String) body.get("action");
        String remark = body.get("remark") == null ? null : body.get("remark").toString();
        travelNoteService.audit(id, action, remark);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @PostMapping("/feature")
    public Map<String, Object> feature(@RequestBody Map<String, Object> body) {
        Long id = ((Number) body.get("id")).longValue();
        Integer isFeatured = body.get("isFeatured") == null ? 0 : Integer.parseInt(body.get("isFeatured").toString());
        travelNoteService.feature(id, isFeatured);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }
}


