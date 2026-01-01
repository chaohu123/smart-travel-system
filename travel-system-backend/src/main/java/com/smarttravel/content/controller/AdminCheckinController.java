package com.smarttravel.content.controller;

import com.smarttravel.content.domain.CheckinPoint;
import com.smarttravel.content.domain.ScenicSpot;
import com.smarttravel.content.domain.Food;
import com.smarttravel.content.mapper.CheckinPointMapper;
import com.smarttravel.content.mapper.ScenicSpotMapper;
import com.smarttravel.content.mapper.FoodMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 打卡点管理接口
 */
@RestController
@RequestMapping("/api/v1/admin/checkin")
@CrossOrigin
public class AdminCheckinController {

    @Resource
    private CheckinPointMapper checkinPointMapper;

    @Resource
    private ScenicSpotMapper scenicSpotMapper;

    @Resource
    private FoodMapper foodMapper;

    @GetMapping("/list")
    public Map<String, Object> list(CheckinPoint query,
                                    @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,
                                    @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        if (query == null) {
            query = new CheckinPoint();
        }
        query.setDelFlag(0);

        // 计算offset
        Integer offset = (pageNum - 1) * pageSize;

        // 查询总数
        int total = checkinPointMapper.countList(query);

        // 分页查询
        List<CheckinPoint> list = checkinPointMapper.selectListWithPage(query, offset, pageSize);

        // 更新打卡次数（从checkin_record表统计）
        for (CheckinPoint point : list) {
            Integer count = checkinPointMapper.countCheckinByTarget(point.getTargetType(), point.getTargetId());
            if (count != null) {
                point.setCheckinCount(count);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("rows", list);
        result.put("total", total);
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id) {
        CheckinPoint point = checkinPointMapper.selectById(id);
        if (point != null) {
            Integer count = checkinPointMapper.countCheckinByTarget(point.getTargetType(), point.getTargetId());
            if (count != null) {
                point.setCheckinCount(count);
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("data", point);
        return result;
    }

    @PostMapping
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> create(@RequestBody CheckinPoint point) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 验证targetId是否存在
            if (point.getTargetId() == null) {
                result.put("code", 400);
                result.put("msg", "目标ID不能为空");
                return result;
            }

            // 检查是否已存在相同的打卡点
            CheckinPoint existing = checkinPointMapper.selectByTarget(point.getTargetType(), point.getTargetId());
            if (existing != null) {
                result.put("code", 400);
                result.put("msg", "该景点/美食已配置为打卡点");
                return result;
            }

            // 从景点或美食表获取信息
            if ("scenic".equals(point.getTargetType())) {
                ScenicSpot scenic = scenicSpotMapper.selectById(point.getTargetId());
                if (scenic == null) {
                    result.put("code", 400);
                    result.put("msg", "景点不存在");
                    return result;
                }
                if (point.getTargetName() == null) {
                    point.setTargetName(scenic.getName());
                }
                if (point.getLocation() == null && scenic.getAddress() != null) {
                    point.setLocation(scenic.getAddress());
                }
                if (point.getImageUrl() == null && scenic.getImageUrl() != null) {
                    point.setImageUrl(scenic.getImageUrl());
                }
            } else if ("food".equals(point.getTargetType())) {
                Food food = foodMapper.selectById(point.getTargetId());
                if (food == null) {
                    result.put("code", 400);
                    result.put("msg", "美食不存在");
                    return result;
                }
                if (point.getTargetName() == null) {
                    point.setTargetName(food.getName());
                }
                if (point.getLocation() == null && food.getAddress() != null) {
                    point.setLocation(food.getAddress());
                }
                if (point.getImageUrl() == null && food.getImageUrl() != null) {
                    point.setImageUrl(food.getImageUrl());
                }
            }

            // 设置默认值
            if (point.getName() == null || point.getName().isEmpty()) {
                point.setName(point.getTargetName());
            }
            if (point.getIsActive() == null) {
                point.setIsActive(1);
            }
            point.setCheckinCount(0);
            point.setDelFlag(0);

            checkinPointMapper.insert(point);
            result.put("code", 200);
            result.put("msg", "success");
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "创建失败：" + e.getMessage());
        }

        return result;
    }

    @PutMapping
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> update(@RequestBody CheckinPoint point) {
        Map<String, Object> result = new HashMap<>();

        try {
            if (point.getId() == null) {
                result.put("code", 400);
                result.put("msg", "ID不能为空");
                return result;
            }

            CheckinPoint existing = checkinPointMapper.selectById(point.getId());
            if (existing == null) {
                result.put("code", 404);
                result.put("msg", "打卡点不存在");
                return result;
            }

            // 如果修改了targetType或targetId，检查是否冲突
            if ((point.getTargetType() != null && !point.getTargetType().equals(existing.getTargetType())) ||
                (point.getTargetId() != null && !point.getTargetId().equals(existing.getTargetId()))) {
                CheckinPoint conflict = checkinPointMapper.selectByTarget(
                    point.getTargetType() != null ? point.getTargetType() : existing.getTargetType(),
                    point.getTargetId() != null ? point.getTargetId() : existing.getTargetId()
                );
                if (conflict != null && !conflict.getId().equals(point.getId())) {
                    result.put("code", 400);
                    result.put("msg", "该景点/美食已配置为其他打卡点");
                    return result;
                }
            }

            // 如果修改了targetId，更新关联信息
            if (point.getTargetId() != null && !point.getTargetId().equals(existing.getTargetId())) {
                String targetType = point.getTargetType() != null ? point.getTargetType() : existing.getTargetType();
                if ("scenic".equals(targetType)) {
                    ScenicSpot scenic = scenicSpotMapper.selectById(point.getTargetId());
                    if (scenic != null) {
                        if (point.getTargetName() == null) {
                            point.setTargetName(scenic.getName());
                        }
                        if (point.getLocation() == null && scenic.getAddress() != null) {
                            point.setLocation(scenic.getAddress());
                        }
                        if (point.getImageUrl() == null && scenic.getImageUrl() != null) {
                            point.setImageUrl(scenic.getImageUrl());
                        }
                    }
                } else if ("food".equals(targetType)) {
                    Food food = foodMapper.selectById(point.getTargetId());
                    if (food != null) {
                        if (point.getTargetName() == null) {
                            point.setTargetName(food.getName());
                        }
                        if (point.getLocation() == null && food.getAddress() != null) {
                            point.setLocation(food.getAddress());
                        }
                        if (point.getImageUrl() == null && food.getImageUrl() != null) {
                            point.setImageUrl(food.getImageUrl());
                        }
                    }
                }
            }

            checkinPointMapper.update(point);
            result.put("code", 200);
            result.put("msg", "success");
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "更新失败：" + e.getMessage());
        }

        return result;
    }

    @DeleteMapping("/{id}")
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> delete(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();

        try {
            CheckinPoint existing = checkinPointMapper.selectByIdWithoutDelFlag(id);
            if (existing == null) {
                result.put("code", 404);
                result.put("msg", "打卡点不存在");
                return result;
            }

            int rows = checkinPointMapper.deleteByIdPhysically(id);
            if (rows > 0) {
                result.put("code", 200);
                result.put("msg", "删除成功");
            } else {
                result.put("code", 500);
                result.put("msg", "删除失败");
            }
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "删除操作异常: " + e.getMessage());
            throw e;
        }

        return result;
    }

}

