package com.smarttravel.content.domain;

/**
 * 活动实体
 */
public class Activity {
    private Long id;
    private String name;
    private String highlight;
    private String description;
    private String rules;
    private String imageUrl;
    private String startTime;
    private String endTime;
    private String status; // online, offline, upcoming, ended
    private String linkUrl;
    private String relatedRouteIds; // JSON数组，存储关联路线ID
    private String relatedScenicIds; // JSON数组，存储关联景点ID
    private String relatedFoodIds; // JSON数组，存储关联美食ID
    private String relatedNoteIds; // JSON数组，存储关联游记ID
    private String createTime;
    private String updateTime;
    private Long createBy;
    private Long updateBy;
    private Integer delFlag;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHighlight() {
        return highlight;
    }

    public void setHighlight(String highlight) {
        this.highlight = highlight;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRules() {
        return rules;
    }

    public void setRules(String rules) {
        this.rules = rules;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }

    public String getRelatedRouteIds() {
        return relatedRouteIds;
    }

    public void setRelatedRouteIds(String relatedRouteIds) {
        this.relatedRouteIds = relatedRouteIds;
    }

    public String getRelatedScenicIds() {
        return relatedScenicIds;
    }

    public void setRelatedScenicIds(String relatedScenicIds) {
        this.relatedScenicIds = relatedScenicIds;
    }

    public String getRelatedFoodIds() {
        return relatedFoodIds;
    }

    public void setRelatedFoodIds(String relatedFoodIds) {
        this.relatedFoodIds = relatedFoodIds;
    }

    public String getRelatedNoteIds() {
        return relatedNoteIds;
    }

    public void setRelatedNoteIds(String relatedNoteIds) {
        this.relatedNoteIds = relatedNoteIds;
    }

    public String getCreateTime() {
        return createTime;
    }

    public void setCreateTime(String createTime) {
        this.createTime = createTime;
    }

    public String getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(String updateTime) {
        this.updateTime = updateTime;
    }

    public Long getCreateBy() {
        return createBy;
    }

    public void setCreateBy(Long createBy) {
        this.createBy = createBy;
    }

    public Long getUpdateBy() {
        return updateBy;
    }

    public void setUpdateBy(Long updateBy) {
        this.updateBy = updateBy;
    }

    public Integer getDelFlag() {
        return delFlag;
    }

    public void setDelFlag(Integer delFlag) {
        this.delFlag = delFlag;
    }
}

