package com.smarttravel.content.controller;

import com.smarttravel.content.service.TravelNoteUserService;
import com.smarttravel.travel.domain.TravelNote;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 游记用户侧接口
 */
@RestController
@RequestMapping("/api/v1/travel/note")
@CrossOrigin
public class TravelNoteUserController {

    @Resource
    private TravelNoteUserService travelNoteUserService;

    /**
     * 查询游记列表
     */
    @GetMapping("/list")
    public Map<String, Object> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) String tagName,
            @RequestParam(defaultValue = "hot") String sortBy) {
        Map<String, Object> result = travelNoteUserService.listNotes(pageNum, pageSize, cityId, tagName, sortBy);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 查询游记详情
     */
    @GetMapping("/{id}")
    public Map<String, Object> getDetail(@PathVariable Long id,
                                         @RequestParam(required = false) Long userId) {
        Map<String, Object> result = travelNoteUserService.getNoteDetail(id, userId);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", result);
        return response;
    }

    /**
     * 发布游记
     */
    @PostMapping
    public Map<String, Object> publish(@RequestBody Map<String, Object> request) {
        try {
            TravelNote note = new TravelNote();
            note.setUserId(Long.valueOf(request.get("userId").toString()));
            note.setTitle(request.get("title").toString());
            note.setContent(request.get("content") != null ? request.get("content").toString() : null);
            note.setCityId(request.get("cityId") != null ? Long.valueOf(request.get("cityId").toString()) : null);
            note.setCityName(request.get("cityName") != null ? request.get("cityName").toString() : null);

            @SuppressWarnings("unchecked")
            List<String> imageUrls = request.get("imageUrls") != null ?
                (List<String>) request.get("imageUrls") : new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Long> scenicIds = request.get("scenicIds") != null ?
                (List<Long>) request.get("scenicIds") : new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Long> tagIds = request.get("tagIds") != null ?
                (List<Long>) request.get("tagIds") : new ArrayList<>();

            Long noteId = travelNoteUserService.publishNote(note, imageUrls, scenicIds, tagIds);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", Collections.singletonMap("noteId", noteId));
            return response;
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("msg", "发布失败：" + e.getMessage());
            return response;
        }
    }

    /**
     * 编辑我的游记
     */
    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            TravelNote note = new TravelNote();
            note.setId(id);
            note.setTitle(request.get("title").toString());
            note.setContent(request.get("content") != null ? request.get("content").toString() : null);
            note.setCityId(request.get("cityId") != null ? Long.valueOf(request.get("cityId").toString()) : null);
            note.setCityName(request.get("cityName") != null ? request.get("cityName").toString() : null);

            @SuppressWarnings("unchecked")
            List<String> imageUrls = request.get("imageUrls") != null ?
                (List<String>) request.get("imageUrls") : new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Long> scenicIds = request.get("scenicIds") != null ?
                (List<Long>) request.get("scenicIds") : new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Long> tagIds = request.get("tagIds") != null ?
                (List<Long>) request.get("tagIds") : new ArrayList<>();

            int result = travelNoteUserService.updateMyNote(userId, note, imageUrls, scenicIds, tagIds);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("msg", "success");
            return response;
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("msg", "更新失败：" + e.getMessage());
            return response;
        }
    }

    /**
     * 删除我的游记
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id,
                                      @RequestParam Long userId) {
        int result = travelNoteUserService.deleteMyNote(userId, id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        return response;
    }

    /**
     * 我收藏的游记列表
     */
    @GetMapping("/my/favorites")
    public Map<String, Object> listMyFavorites(@RequestParam Long userId,
                                               @RequestParam(defaultValue = "1") Integer pageNum,
                                               @RequestParam(defaultValue = "10") Integer pageSize) {
        Map<String, Object> data = travelNoteUserService.listMyFavorites(userId, pageNum, pageSize);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return response;
    }

    /**
     * 我发布的游记列表
     */
    @GetMapping("/my/list")
    public Map<String, Object> listMyNotes(@RequestParam Long userId,
                                           @RequestParam(defaultValue = "1") Integer pageNum,
                                           @RequestParam(defaultValue = "10") Integer pageSize) {
        Map<String, Object> data = travelNoteUserService.listMyNotes(userId, pageNum, pageSize);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return response;
    }
}


