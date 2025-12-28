package com.smarttravel.content.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 景点实体
 */
public class ScenicSpot {
    private Long id;
    private String name;
    private String province;
    private String city;
    private Long cityId;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String intro;
    private String openTime;
    private String ticketInfo;
    private BigDecimal price;
    private String imageUrl;
    private Integer isWorldHeritage;
    private String suggestedVisitTime;
    private BigDecimal score;
    private Integer hotScore;
    private Integer isRecommend;
    private String freeNotice;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
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

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Long getCityId() {
        return cityId;
    }

    public void setCityId(Long cityId) {
        this.cityId = cityId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getIntro() {
        return intro;
    }

    public void setIntro(String intro) {
        this.intro = intro;
    }

    public String getOpenTime() {
        return openTime;
    }

    public void setOpenTime(String openTime) {
        this.openTime = openTime;
    }

    public String getTicketInfo() {
        return ticketInfo;
    }

    public void setTicketInfo(String ticketInfo) {
        this.ticketInfo = ticketInfo;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getIsWorldHeritage() {
        return isWorldHeritage;
    }

    public void setIsWorldHeritage(Integer isWorldHeritage) {
        this.isWorldHeritage = isWorldHeritage;
    }

    public String getSuggestedVisitTime() {
        return suggestedVisitTime;
    }

    public void setSuggestedVisitTime(String suggestedVisitTime) {
        this.suggestedVisitTime = suggestedVisitTime;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public Integer getHotScore() {
        return hotScore;
    }

    public void setHotScore(Integer hotScore) {
        this.hotScore = hotScore;
    }

    public Integer getIsRecommend() {
        return isRecommend;
    }

    public void setIsRecommend(Integer isRecommend) {
        this.isRecommend = isRecommend;
    }

    public String getFreeNotice() {
        return freeNotice;
    }

    public void setFreeNotice(String freeNotice) {
        this.freeNotice = freeNotice;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }

    public Integer getDelFlag() {
        return delFlag;
    }

    public void setDelFlag(Integer delFlag) {
        this.delFlag = delFlag;
    }
}














