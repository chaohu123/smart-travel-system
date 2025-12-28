package com.smarttravel.content.enums;

/**
 * 用户行为类型枚举
 */
public enum BehaviorType {
    /**
     * 浏览行为，权重：1
     */
    VIEW("view", 1),

    /**
     * 点赞行为，权重：5
     */
    LIKE("like", 5),

    /**
     * 收藏行为，权重：10
     */
    FAVORITE("favorite", 10),

    /**
     * 打卡行为，权重：15
     */
    CHECKIN("checkin", 15),

    /**
     * 评论行为，权重：8
     */
    COMMENT("comment", 8),

    /**
     * 分享行为，权重：12
     */
    SHARE("share", 12);

    private final String code;
    private final Integer weight;

    BehaviorType(String code, Integer weight) {
        this.code = code;
        this.weight = weight;
    }

    public String getCode() {
        return code;
    }

    public Integer getWeight() {
        return weight;
    }

    /**
     * 根据code获取枚举
     */
    public static BehaviorType fromCode(String code) {
        for (BehaviorType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        return null;
    }
}



























<<<<<<< HEAD

=======
>>>>>>> 299642f29c0d19bfedecf29490a18cfe2ad7de4f
