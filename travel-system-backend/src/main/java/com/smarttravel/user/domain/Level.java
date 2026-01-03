package com.smarttravel.user.domain;

import java.time.LocalDateTime;

/**
 * 用户等级配置实体
 */
public class Level {
    private Long id;
    private Integer level;           // 等级数字
    private String levelName;        // 等级名称（如：新手、达人、专家）
    private Integer minExperience;  // 最低经验值
    private Integer maxExperience;   // 最高经验值（null表示无上限）
    private String medalName;        // 勋章名称
    private String medalIcon;        // 勋章图标（emoji）
    private String description;      // 等级描述
    private Integer status;          // 状态：1-启用，0-禁用
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Integer delFlag;        // 删除标志：0-未删除，1-已删除

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }

    public String getLevelName() { return levelName; }
    public void setLevelName(String levelName) { this.levelName = levelName; }

    public Integer getMinExperience() { return minExperience; }
    public void setMinExperience(Integer minExperience) { this.minExperience = minExperience; }

    public Integer getMaxExperience() { return maxExperience; }
    public void setMaxExperience(Integer maxExperience) { this.maxExperience = maxExperience; }

    public String getMedalName() { return medalName; }
    public void setMedalName(String medalName) { this.medalName = medalName; }

    public String getMedalIcon() { return medalIcon; }
    public void setMedalIcon(String medalIcon) { this.medalIcon = medalIcon; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }

    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }

    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }

    public Integer getDelFlag() { return delFlag; }
    public void setDelFlag(Integer delFlag) { this.delFlag = delFlag; }
}

