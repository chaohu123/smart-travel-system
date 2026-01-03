package com.smarttravel.user.controller;

import com.smarttravel.user.domain.Level;
import com.smarttravel.user.mapper.LevelMapper;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 等级管理Controller
 */
@RestController
@RequestMapping("/api/v1/admin/level")
@CrossOrigin
public class AdminLevelController {

    @Resource
    private LevelMapper levelMapper;

    /**
     * 获取等级列表（分页）
     */
    @GetMapping("/list")
    public Map<String, Object> list(
            @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
            @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize,
            @RequestParam(value = "status", required = false) Integer status) {
        
        Integer offset = (pageNum - 1) * pageSize;
        int total = levelMapper.countList(status);
        List<Level> list = levelMapper.selectListWithPage(status, offset, pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", total);
        return result;
    }

    /**
     * 创建等级配置
     */
    @PostMapping("/create")
    public Map<String, Object> create(@RequestBody Level level) {
        Map<String, Object> result = new HashMap<>();
        
        // 验证等级是否已存在
        Level existing = levelMapper.selectByLevel(level.getLevel());
        if (existing != null) {
            result.put("code", 400);
            result.put("msg", "该等级已存在");
            return result;
        }

        // 设置默认值
        if (level.getStatus() == null) {
            level.setStatus(1);
        }

        int affected = levelMapper.insert(level);
        if (affected > 0) {
            result.put("code", 200);
            result.put("msg", "创建成功");
        } else {
            result.put("code", 500);
            result.put("msg", "创建失败");
        }
        return result;
    }

    /**
     * 更新等级配置
     */
    @PostMapping("/update")
    public Map<String, Object> update(@RequestBody Level level) {
        Map<String, Object> result = new HashMap<>();
        
        if (level.getId() == null) {
            result.put("code", 400);
            result.put("msg", "id不能为空");
            return result;
        }

        // 如果修改了等级数字，检查是否与其他等级冲突
        Level existing = levelMapper.selectById(level.getId());
        if (existing != null && !existing.getLevel().equals(level.getLevel())) {
            Level conflict = levelMapper.selectByLevel(level.getLevel());
            if (conflict != null && !conflict.getId().equals(level.getId())) {
                result.put("code", 400);
                result.put("msg", "该等级已存在");
                return result;
            }
        }

        int affected = levelMapper.update(level);
        if (affected > 0) {
            result.put("code", 200);
            result.put("msg", "更新成功");
        } else {
            result.put("code", 500);
            result.put("msg", "更新失败");
        }
        return result;
    }

    /**
     * 删除等级配置
     */
    @PostMapping("/delete")
    public Map<String, Object> delete(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();
        Long id = body.get("id") == null ? null : Long.parseLong(body.get("id").toString());
        
        if (id == null) {
            result.put("code", 400);
            result.put("msg", "id不能为空");
            return result;
        }

        int affected = levelMapper.deleteById(id);
        if (affected > 0) {
            result.put("code", 200);
            result.put("msg", "删除成功");
        } else {
            result.put("code", 500);
            result.put("msg", "删除失败");
        }
        return result;
    }

    /**
     * 获取经验值计算规则
     */
    @GetMapping("/exp-rules")
    public Map<String, Object> getExpRules() {
        Map<String, Object> result = new HashMap<>();
        
        // 从系统参数或配置中读取经验值规则
        // 这里使用默认值，实际应该从配置表读取
        Map<String, Object> rules = new HashMap<>();
        rules.put("commentExp", 1);      // 评论+1经验
        rules.put("noteExp", 10);         // 游记+10经验
        rules.put("checkinExp", 20);      // 打卡+20经验
        rules.put("dailyCheckinExp", 5);  // 签到+5经验
        
        // TODO: 从系统参数表读取实际配置
        // 可以存储在 sys_config 表中，key 为 'exp_rule_comment', 'exp_rule_note' 等
        
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", rules);
        return result;
    }

    /**
     * 保存经验值计算规则
     */
    @PostMapping("/exp-rules")
    public Map<String, Object> saveExpRules(@RequestBody Map<String, Object> rules) {
        Map<String, Object> result = new HashMap<>();
        
        // TODO: 保存到系统参数表
        // 可以存储在 sys_config 表中
        
        result.put("code", 200);
        result.put("msg", "保存成功");
        return result;
    }
}

