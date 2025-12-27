package com.smarttravel.user.controller;

import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.content.enums.BehaviorType;
import com.smarttravel.content.mapper.CheckinRecordMapper;
import com.smarttravel.travel.mapper.TravelNoteMapper;
import com.smarttravel.user.domain.User;
import com.smarttravel.user.mapper.UserMapper;
import com.smarttravel.user.mapper.UserTagMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin
public class UserApiController {

    @Resource
    private UserMapper userMapper;

    @Resource
    private UserTagMapper userTagMapper;

    @Resource
    private TravelNoteMapper travelNoteMapper;

    @Resource
    private UserBehaviorMapper userBehaviorMapper;

    @Resource
    private CheckinRecordMapper checkinRecordMapper;

    /**
     * 简易登录（账号/手机号/测试用户）
     */
    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> body,
                                     @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = body.get("userId") == null ? null : Long.parseLong(body.get("userId").toString());
            String openid = body.get("openid") == null ? null : body.get("openid").toString();
            if (openid == null && body.get("account") != null) {
                openid = body.get("account").toString();
            }
            if (openid == null && body.get("phone") != null) {
                openid = body.get("phone").toString();
            }
            User user = null;
            if (userId != null) {
                user = userMapper.selectById(userId);
            }
            if (user == null && openid != null) {
                user = userMapper.selectByOpenid(openid);
            }
            if (user == null) {
                user = new User();
                user.setOpenid(openid != null ? openid : "temp-" + UUID.randomUUID());
                user.setNickname(body.get("nickname") != null ? body.get("nickname").toString() : "游客" + System.currentTimeMillis());
                user.setAvatar(body.get("avatar") != null ? body.get("avatar").toString() : null);
                user.setCity(body.get("city") != null ? body.get("city").toString() : null);
                user.setSignature(body.get("signature") != null ? body.get("signature").toString() : null);
                userMapper.insert(user);
            }
            String token = "token-" + user.getId() + "-" + System.currentTimeMillis();
            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("userInfo", buildUserInfo(user.getId()));

            response.put("code", 200);
            response.put("msg", "success");
            response.put("data", data);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "登录失败：" + e.getMessage());
        }
        return response;
    }

    /**
     * 获取当前用户信息（token或userId）
     */
    @GetMapping("/user/profile")
    public Map<String, Object> profile(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                       @RequestParam(value = "token", required = false) String token,
                                       @RequestParam(value = "userId", required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        Long uid = resolveUserId(authHeader, token, userId);
        if (uid == null) {
            response.put("code", 401);
            response.put("msg", "未登录");
            return response;
        }
        User user = userMapper.selectById(uid);
        if (user == null) {
            response.put("code", 404);
            response.put("msg", "用户不存在");
            return response;
        }
        Map<String, Object> data = buildUserInfo(uid);
        data.put("stats", buildStats(uid));
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return response;
    }

    /**
     * 用户统计
     */
    @GetMapping("/user/stats")
    public Map<String, Object> stats(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                     @RequestParam(value = "token", required = false) String token,
                                     @RequestParam(value = "userId", required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        Long uid = resolveUserId(authHeader, token, userId);
        if (uid == null) {
            response.put("code", 401);
            response.put("msg", "未登录");
            return response;
        }
        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", buildStats(uid));
        return response;
    }

    private Long resolveUserId(String authHeader, String token, Long userId) {
        if (userId != null) {
            return userId;
        }
        String tk = token;
        if ((tk == null || tk.isEmpty()) && authHeader != null && !authHeader.isEmpty()) {
            tk = authHeader.replace("Bearer ", "").trim();
        }
        if (tk != null && tk.startsWith("token-")) {
            String[] parts = tk.split("-");
            if (parts.length >= 2) {
                try {
                    return Long.parseLong(parts[1]);
                } catch (NumberFormatException ignore) { }
            }
        }
        return null;
    }

    private Map<String, Object> buildUserInfo(Long userId) {
        User user = userMapper.selectById(userId);
        Map<String, Object> info = new HashMap<>();
        info.put("id", user.getId());
        info.put("nickname", user.getNickname());
        info.put("avatar", user.getAvatar());
        info.put("city", user.getCity());
        info.put("signature", user.getSignature());
        List<String> interestNames = userTagMapper.selectTagNamesByUserId(userId);
        List<Long> interestIds = userTagMapper.selectTagIdsByUserId(userId);
        info.put("interests", interestNames);
        info.put("interestIds", interestIds);
        return info;
    }

    private Map<String, Object> buildStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        int noteCount = travelNoteMapper.countByUserId(userId);
        int favoriteCount = userBehaviorMapper.countByUserAndBehavior(userId, BehaviorType.FAVORITE.getCode(), "note");
        int checkinCount = checkinRecordMapper.countByUserId(userId);
        stats.put("noteCount", noteCount);
        stats.put("favoriteCount", favoriteCount);
        stats.put("checkinCount", checkinCount);
        return stats;
    }
}

