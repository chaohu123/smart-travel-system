package com.smarttravel.user.controller;

import com.smarttravel.content.mapper.UserBehaviorMapper;
import com.smarttravel.content.enums.BehaviorType;
import com.smarttravel.content.mapper.CheckinRecordMapper;
import com.smarttravel.content.mapper.CommentMapper;
import com.smarttravel.travel.mapper.TravelNoteMapper;
import com.smarttravel.user.domain.User;
import com.smarttravel.user.domain.Level;
import com.smarttravel.user.domain.UserFollow;
import com.smarttravel.user.domain.UserCheckin;
import com.smarttravel.user.mapper.UserMapper;
import com.smarttravel.user.mapper.UserTagMapper;
import com.smarttravel.user.mapper.LevelMapper;
import com.smarttravel.user.mapper.UserFollowMapper;
import com.smarttravel.user.mapper.UserCheckinMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.sql.Date;
import java.text.SimpleDateFormat;
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

    @Resource
    private CommentMapper commentMapper;

    @Resource
    private LevelMapper levelMapper;

    @Resource
    private UserFollowMapper userFollowMapper;

    @Resource
    private UserCheckinMapper userCheckinMapper;

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
        if (tk != null) {
            // 支持两种token格式：
            // 1. token-{userId}-{timestamp}
            // 2. test-token-{userId} 或 test-token-{userId}-{timestamp}
            String[] parts = tk.split("-");
            if (tk.startsWith("token-") && parts.length >= 2) {
                try {
                    return Long.parseLong(parts[1]);
                } catch (NumberFormatException ignore) { }
            } else if (tk.startsWith("test-token-") && parts.length >= 3) {
                try {
                    return Long.parseLong(parts[2]);
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
        info.put("email", user.getEmail());
        List<String> interestNames = userTagMapper.selectTagNamesByUserId(userId);
        List<Long> interestIds = userTagMapper.selectTagIdsByUserId(userId);
        info.put("interests", interestNames);
        info.put("interestIds", interestIds);
        
        // 添加经验值、等级、勋章信息
        int experience = calculateExperience(userId);
        int level = calculateLevel(experience);
        List<Map<String, Object>> medals = getMedals(userId, level, experience);
        
        info.put("experience", experience);
        info.put("level", level);
        info.put("medals", medals);
        
        return info;
    }
    
    /**
     * 计算用户总经验值
     * 从配置中读取经验值规则，如果没有配置则使用默认值
     */
    private int calculateExperience(Long userId) {
        // 从配置读取经验值规则（可以从系统参数表或配置文件读取）
        // 这里先使用默认值，实际应该从配置读取
        int commentExp = getExpRule("commentExp", 1);
        int noteExp = getExpRule("noteExp", 10);
        int checkinExp = getExpRule("checkinExp", 20);
        
        int commentCount = commentMapper.countByUserId(userId);
        int noteCount = travelNoteMapper.countByUserId(userId);
        int checkinCount = checkinRecordMapper.countByUserId(userId);
        
        return commentCount * commentExp + noteCount * noteExp + checkinCount * checkinExp;
    }
    
    /**
     * 获取经验值规则（从配置读取，如果不存在则返回默认值）
     * TODO: 从系统参数表或配置文件读取
     */
    private int getExpRule(String key, int defaultValue) {
        // 可以从系统参数表读取，key 如 'exp_rule_comment', 'exp_rule_note' 等
        // 这里暂时返回默认值
        return defaultValue;
    }
    
    /**
     * 根据经验值计算等级
     * 从等级配置表中查找对应的等级
     */
    private int calculateLevel(int experience) {
        if (experience <= 0) return 1;
        
        // 从等级配置表查询
        Level levelConfig = levelMapper.selectByExperience(experience);
        if (levelConfig != null) {
            return levelConfig.getLevel();
        }
        
        // 如果没有配置，使用默认公式
        int level = (int) Math.sqrt(experience / 100.0) + 1;
        return Math.max(1, level);
    }
    
    /**
     * 获取用户勋章列表
     * 从等级配置表中获取当前等级对应的勋章
     */
    private List<Map<String, Object>> getMedals(Long userId, int level, int experience) {
        List<Map<String, Object>> medals = new java.util.ArrayList<>();
        
        // 从等级配置表获取当前等级及以下所有启用的等级勋章
        List<Level> allLevels = levelMapper.selectAllEnabled();
        for (Level levelConfig : allLevels) {
            if (levelConfig.getLevel() <= level && levelConfig.getStatus() == 1) {
                Map<String, Object> medal = new HashMap<>();
                medal.put("name", levelConfig.getMedalName());
                medal.put("icon", levelConfig.getMedalIcon());
                medal.put("description", levelConfig.getDescription());
                medals.add(medal);
            }
        }
        
        // 如果没有配置，使用默认勋章
        if (medals.isEmpty()) {
            if (level >= 1) {
                Map<String, Object> medal = new HashMap<>();
                medal.put("name", "新手");
                medal.put("icon", "🌱");
                medal.put("description", "初来乍到");
                medals.add(medal);
            }
            if (level >= 5) {
                Map<String, Object> medal = new HashMap<>();
                medal.put("name", "达人");
                medal.put("icon", "⭐");
                medal.put("description", "旅行达人");
                medals.add(medal);
            }
        }
        
        return medals;
    }

    private Map<String, Object> buildStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        // 使用与 listMyNotes 相同的查询逻辑，确保统计数量与列表显示一致
        // 查询条件：userId 和 del_flag = 0（不传 status，统计所有状态的游记）
        com.smarttravel.travel.domain.TravelNote query = new com.smarttravel.travel.domain.TravelNote();
        query.setUserId(userId);
        // 不设置 status，统计所有状态的游记（与"我的游记"页面"全部"标签的逻辑一致）
        List<com.smarttravel.travel.domain.TravelNote> allNotes = travelNoteMapper.selectList(query);
        int noteCount = allNotes.size();
        
        int favoriteCount = userBehaviorMapper.countByUserAndBehavior(userId, BehaviorType.FAVORITE.getCode(), "note");
        int likeCount = userBehaviorMapper.countByUserAndBehavior(userId, BehaviorType.LIKE.getCode(), "note");
        int checkinCount = checkinRecordMapper.countByUserId(userId);
        int commentCount = commentMapper.countByUserId(userId);
        
        // 粉丝数和关注数
        int followerCount = userFollowMapper.countFollowers(userId);
        int followingCount = userFollowMapper.countFollowing(userId);
        
        stats.put("noteCount", noteCount);
        stats.put("favoriteCount", favoriteCount);
        stats.put("likeCount", likeCount);
        stats.put("commentCount", commentCount);
        stats.put("checkinCount", checkinCount);
        stats.put("followerCount", followerCount);
        stats.put("followingCount", followingCount);
        stats.put("totalLikes", likeCount); // 获赞数使用点赞数
        stats.put("followers", followerCount);
        stats.put("following", followingCount);
        return stats;
    }

    /**
     * 获取粉丝列表
     */
    @GetMapping("/user/followers")
    public Map<String, Object> followers(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @RequestParam(value = "userId", required = false) Long userId,
                                         @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                         @RequestParam(value = "pageSize", defaultValue = "20") Integer pageSize) {
        Map<String, Object> response = new HashMap<>();
        Long uid = resolveUserId(authHeader, null, userId);
        if (uid == null) {
            response.put("code", 401);
            response.put("msg", "未登录");
            return response;
        }

        Integer offset = (pageNum - 1) * pageSize;
        Long currentUserId = resolveUserId(authHeader, null, null); // 当前登录用户，用于判断是否已关注

        List<Map<String, Object>> list = userFollowMapper.selectFollowers(uid, currentUserId, offset, pageSize);
        int total = userFollowMapper.countFollowers(uid);

        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", total);
        data.put("pageNum", pageNum);
        data.put("pageSize", pageSize);

        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return response;
    }

    /**
     * 获取关注列表
     */
    @GetMapping("/user/following")
    public Map<String, Object> following(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @RequestParam(value = "userId", required = false) Long userId,
                                         @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                         @RequestParam(value = "pageSize", defaultValue = "20") Integer pageSize) {
        Map<String, Object> response = new HashMap<>();
        Long uid = resolveUserId(authHeader, null, userId);
        if (uid == null) {
            response.put("code", 401);
            response.put("msg", "未登录");
            return response;
        }

        Integer offset = (pageNum - 1) * pageSize;
        List<Map<String, Object>> list = userFollowMapper.selectFollowing(uid, offset, pageSize);
        int total = userFollowMapper.countFollowing(uid);

        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", total);
        data.put("pageNum", pageNum);
        data.put("pageSize", pageSize);

        response.put("code", 200);
        response.put("msg", "success");
        response.put("data", data);
        return response;
    }

    /**
     * 关注/取消关注用户
     */
    @PostMapping("/user/follow")
    public Map<String, Object> follow(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                       @RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        Long userId = resolveUserId(authHeader, null, null);
        if (userId == null) {
            response.put("code", 401);
            response.put("msg", "未登录");
            return response;
        }

        Long targetUserId = body.get("targetUserId") == null ? null : Long.parseLong(body.get("targetUserId").toString());
        if (targetUserId == null) {
            response.put("code", 400);
            response.put("msg", "目标用户ID不能为空");
            return response;
        }

        if (userId.equals(targetUserId)) {
            response.put("code", 400);
            response.put("msg", "不能关注自己");
            return response;
        }

        // 检查是否已关注
        UserFollow existing = userFollowMapper.selectByUserAndFollowed(userId, targetUserId);
        if (existing != null) {
            // 取消关注
            userFollowMapper.delete(userId, targetUserId);
            response.put("code", 200);
            response.put("msg", "取消关注成功");
        } else {
            // 关注
            UserFollow userFollow = new UserFollow();
            userFollow.setUserId(userId);
            userFollow.setFollowedUserId(targetUserId);
            userFollowMapper.insert(userFollow);
            response.put("code", 200);
            response.put("msg", "关注成功");
        }

        return response;
    }

    /**
     * 签到
     */
    @PostMapping("/user/checkin")
    public Map<String, Object> checkin(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                       @RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        Long userId = resolveUserId(authHeader, null, null);
        if (userId == null) {
            // 如果token解析失败，尝试从body中获取userId
            if (body.get("userId") != null) {
                userId = Long.parseLong(body.get("userId").toString());
            } else {
                response.put("code", 401);
                response.put("msg", "未登录");
                return response;
            }
        }

        // 检查今天是否已签到
        java.util.Date today = new java.util.Date();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        try {
            Date checkinDate = Date.valueOf(sdf.format(today));
            UserCheckin existing = userCheckinMapper.selectByUserAndDate(userId, checkinDate);
            if (existing != null) {
                response.put("code", 400);
                response.put("msg", "今天已经签到过了");
                return response;
            }

            // 创建签到记录
            UserCheckin userCheckin = new UserCheckin();
            userCheckin.setUserId(userId);
            userCheckin.setCheckinDate(checkinDate);
            userCheckin.setExperienceGained(10);
            userCheckinMapper.insert(userCheckin);

            // 更新用户经验值（这里需要更新user表的experience字段，如果存在的话）
            // 或者通过计算经验值来更新
            // 暂时只返回成功，经验值更新可以通过定时任务或异步处理

            response.put("code", 200);
            response.put("msg", "签到成功");
            Map<String, Object> data = new HashMap<>();
            data.put("experienceGained", 10);
            response.put("data", data);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("msg", "签到失败：" + e.getMessage());
        }

        return response;
    }
}

