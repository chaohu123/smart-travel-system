package com.smarttravel.user.controller;

import com.smarttravel.content.domain.Tag;
import com.smarttravel.content.mapper.TagMapper;
import com.smarttravel.user.domain.User;
import com.smarttravel.user.mapper.UserMapper;
import com.smarttravel.user.mapper.UserTagMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/user")
@CrossOrigin
public class AdminUserController {

    @Resource
    private UserMapper userMapper;

    @Resource
    private UserTagMapper userTagMapper;

    @Resource
    private TagMapper tagMapper;

    @GetMapping("/list")
    public Map<String, Object> list(User query,
                                     @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                     @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        if (query == null) {
            query = new User();
        }
        query.setDelFlag(0);

        // 计算offset
        Integer offset = (pageNum - 1) * pageSize;

        // 查询总数
        int total = userMapper.countList(query);

        // 分页查询
        List<User> list = userMapper.selectListWithPage(query, offset, pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", total);
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        User user = userMapper.selectById(id);
        Map<String, Object> result = new HashMap<>();

        if (user == null) {
            result.put("code", 404);
            result.put("msg", "用户不存在");
            result.put("data", null);
            return result;
        }

        // 获取用户标签
        List<String> tagNames = userTagMapper.selectTagNamesByUserId(id);

        // 将 User 对象转换为 Map，并添加标签信息
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("openid", user.getOpenid());
        userData.put("nickname", user.getNickname());
        userData.put("avatar", user.getAvatar());
        userData.put("gender", user.getGender());
        userData.put("city", user.getCity());
        userData.put("signature", user.getSignature());
        userData.put("status", user.getStatus());
        userData.put("noteCount", user.getNoteCount());
        userData.put("favoriteCount", user.getFavoriteCount());
        userData.put("checkinCount", user.getCheckinCount());
        userData.put("createTime", user.getCreateTime());
        userData.put("updateTime", user.getUpdateTime());
        userData.put("tags", tagNames != null ? tagNames : new ArrayList<>());

        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", userData);
        return result;
    }

    @PostMapping("/status")
    public Map<String, Object> changeStatus(@RequestBody Map<String, Object> body) {
        Long id = body.get("id") == null ? null : Long.parseLong(body.get("id").toString());
        Integer status = body.get("status") == null ? null : Integer.parseInt(body.get("status").toString());
        if (id == null || status == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 400);
            result.put("msg", "参数缺失");
            return result;
        }
        userMapper.updateStatus(id, status);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    @GetMapping("/export")
    public @ResponseBody byte[] export(User query, @RequestHeader(value = "Accept", required = false) String accept) {
        List<User> list = userMapper.selectList(query);
        StringBuilder sb = new StringBuilder();
        sb.append("ID,昵称,城市,状态,游记数,收藏数,打卡数,注册时间\n");
        for (User u : list) {
            sb.append(u.getId()).append(',')
              .append(safe(u.getNickname())).append(',')
              .append(safe(u.getCity())).append(',')
              .append(u.getStatus() != null && u.getStatus() == 1 ? "正常" : "禁用").append(',')
              .append(safeNum(u.getNoteCount())).append(',')
              .append(safeNum(u.getFavoriteCount())).append(',')
              .append(safeNum(u.getCheckinCount())).append(',')
              .append(u.getCreateTime() == null ? "" : u.getCreateTime()).append('\n');
        }
        return sb.toString().getBytes();
    }

    private String safe(String v) {
        return v == null ? "" : v.replace(",", " ");
    }

    private String safeNum(Integer v) {
        return v == null ? "0" : String.valueOf(v);
    }

    /**
     * 更新用户基础信息
     */
    @PostMapping("/update")
    public Map<String, Object> updateProfile(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();
        Long id = body.get("id") == null ? null : Long.parseLong(body.get("id").toString());
        if (id == null) {
            result.put("code", 400);
            result.put("msg", "id不能为空");
            return result;
        }
        User user = new User();
        user.setId(id);
        if (body.containsKey("city")) {
            user.setCity((String) body.get("city"));
        }
        if (body.containsKey("signature")) {
            user.setSignature((String) body.get("signature"));
        }
        if (body.containsKey("nickname")) {
            user.setNickname((String) body.get("nickname"));
        }
        if (body.containsKey("avatar")) {
            user.setAvatar((String) body.get("avatar"));
        }
        userMapper.updateProfile(user);
        result.put("code", 200);
        result.put("msg", "success");
        return result;
    }

    /**
     * 更新用户兴趣标签
     */
    @PostMapping("/interests")
    public Map<String, Object> updateInterests(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();
        Long id = body.get("id") == null ? null : Long.parseLong(body.get("id").toString());
        if (id == null || body.get("interests") == null) {
            result.put("code", 400);
            result.put("msg", "参数缺失");
            return result;
        }
        @SuppressWarnings("unchecked")
        List<Object> interests = (List<Object>) body.get("interests");
        List<Long> tagIds = new ArrayList<>();
        for (Object obj : interests) {
            if (obj == null) {
                continue;
            }
            String raw = obj.toString();
            try {
                tagIds.add(Long.parseLong(raw));
                continue;
            } catch (NumberFormatException ignore) {
                // not numeric, treat as tag name
            }
            Tag query = new Tag();
            query.setTagName(raw);
            query.setTagType("user");
            query.setStatus(1);
            List<Tag> exist = tagMapper.selectList(query);
            Long tagId;
            if (exist != null && !exist.isEmpty()) {
                tagId = exist.get(0).getId();
            } else {
                Tag tag = new Tag();
                tag.setTagName(raw);
                tag.setTagType("user");
                tag.setStatus(1);
                tagMapper.insert(tag);
                tagId = tag.getId();
            }
            tagIds.add(tagId);
        }
        // 清空旧兴趣并写入新兴趣
        userTagMapper.deleteByUserId(id);
        if (!tagIds.isEmpty()) {
            userTagMapper.batchInsert(id, tagIds);
        }
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", tagIds);
        return result;
    }
}

