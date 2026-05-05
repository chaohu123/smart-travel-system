from openpyxl import Workbook


OUTPUT_PATH = r"D:/APPdalley/smart-travel-system/第四章核心数据库表字段.xlsx"

TABLES = {
    "user": [
        ("id", "bigint", "20", "PK, 自增", "用户ID"),
        ("openid", "varchar", "64", "非空, 唯一", "微信OpenID"),
        ("nickname", "varchar", "64", "非空", "用户昵称"),
        ("avatar", "varchar", "255", "可空", "头像地址"),
        ("gender", "tinyint", "1", "可空", "性别: 0未知/1男/2女"),
        ("city", "varchar", "64", "可空", "常驻城市"),
        ("signature", "varchar", "255", "可空", "个性签名"),
        ("email", "varchar", "128", "可空", "邮箱地址"),
        ("status", "tinyint", "1", "非空, 默认1", "账号状态"),
        ("note_count", "int", "11", "默认0", "游记数量"),
        ("favorite_count", "int", "11", "默认0", "收藏数量"),
        ("checkin_count", "int", "11", "默认0", "打卡数量"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "city": [
        ("id", "bigint", "20", "PK, 自增", "城市ID"),
        ("city_name", "varchar", "64", "非空, 唯一", "城市名称"),
        ("province", "varchar", "64", "可空", "省份"),
        ("country", "varchar", "64", "默认中国", "国家"),
        ("image_url", "varchar", "512", "可空", "城市图片URL"),
        ("latitude", "decimal", "10,6", "可空", "纬度"),
        ("longitude", "decimal", "10,6", "可空", "经度"),
        ("status", "tinyint", "1", "非空, 默认1", "状态"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "scenic_spot": [
        ("id", "bigint", "20", "PK, 自增", "景点ID"),
        ("name", "varchar", "128", "非空", "景点名称"),
        ("province", "varchar", "64", "可空", "省份"),
        ("city", "varchar", "64", "可空", "城市名(冗余)"),
        ("city_id", "bigint", "20", "非空, 索引", "所属城市ID"),
        ("address", "varchar", "255", "可空", "详细地址"),
        ("latitude", "decimal", "10,6", "可空", "纬度"),
        ("longitude", "decimal", "10,6", "可空", "经度"),
        ("intro", "text", "-", "可空", "景点简介"),
        ("open_time", "varchar", "128", "可空", "开放时间"),
        ("ticket_info", "varchar", "255", "可空", "门票信息"),
        ("price", "decimal", "10,2", "可空", "门票价格"),
        ("image_url", "varchar", "512", "可空", "景点主图"),
        ("score", "decimal", "3,2", "默认0.00", "评分"),
        ("hot_score", "int", "11", "默认0, 索引", "热度值"),
        ("is_recommend", "tinyint", "1", "非空, 默认0", "是否推荐"),
        ("free_notice", "varchar", "255", "可空", "免费景点提示"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "food": [
        ("id", "bigint", "20", "PK, 自增", "美食ID"),
        ("name", "varchar", "128", "非空", "美食/店铺名称"),
        ("city_id", "bigint", "20", "非空, 索引", "所属城市ID"),
        ("address", "varchar", "255", "可空", "详细地址"),
        ("latitude", "decimal", "10,6", "可空", "纬度"),
        ("longitude", "decimal", "10,6", "可空", "经度"),
        ("food_type", "varchar", "64", "可空, 索引", "菜系/类型"),
        ("avg_price", "decimal", "10,2", "可空", "人均消费"),
        ("intro", "text", "-", "可空", "简介"),
        ("image_url", "varchar", "512", "可空", "主图URL"),
        ("score", "decimal", "3,2", "默认0.00", "评分"),
        ("hot_score", "int", "11", "默认0, 索引", "热度值"),
        ("is_recommend", "tinyint", "1", "非空, 默认0", "是否推荐"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "travel_note": [
        ("id", "bigint", "20", "PK, 自增", "游记ID"),
        ("user_id", "bigint", "20", "非空, 索引", "作者用户ID"),
        ("title", "varchar", "255", "非空", "游记标题"),
        ("content", "longtext", "-", "可空", "游记正文"),
        ("city_id", "bigint", "20", "可空, 索引", "城市ID"),
        ("city_name", "varchar", "64", "可空", "城市名称冗余"),
        ("status", "varchar", "16", "非空, 默认pending", "审核状态"),
        ("view_count", "int", "11", "默认0", "浏览数"),
        ("like_count", "int", "11", "默认0", "点赞数"),
        ("favorite_count", "int", "11", "默认0", "收藏数"),
        ("comment_count", "int", "11", "默认0", "评论数"),
        ("is_featured", "tinyint", "1", "非空, 默认0", "是否精选"),
        ("audit_remark", "varchar", "500", "可空", "审核备注"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "travel_route": [
        ("id", "bigint", "20", "PK, 自增", "路线ID"),
        ("route_name", "varchar", "255", "非空", "路线名称"),
        ("city_id", "bigint", "20", "非空, 索引", "主要城市ID"),
        ("days", "int", "11", "非空", "行程天数"),
        ("suitable_people", "varchar", "255", "可空", "适合人群"),
        ("source_type", "varchar", "32", "非空, 默认template", "来源类型"),
        ("summary", "varchar", "1000", "可空", "行程概要"),
        ("cover_image", "varchar", "255", "可空", "封面图"),
        ("view_count", "int", "11", "默认0", "浏览数"),
        ("favorite_count", "int", "11", "默认0", "收藏数"),
        ("use_count", "int", "11", "默认0", "使用次数"),
        ("ai_used", "tinyint", "1", "非空, 默认0", "是否使用AI文案"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "user_behavior": [
        ("id", "bigint", "20", "PK, 自增", "行为记录ID"),
        ("user_id", "bigint", "20", "非空, 索引", "用户ID"),
        ("behavior_type", "varchar", "32", "非空", "行为类型"),
        ("content_type", "varchar", "32", "非空", "内容类型"),
        ("content_id", "bigint", "20", "非空, 组合索引", "内容ID"),
        ("score", "int", "11", "默认0", "行为权重"),
        ("behavior_time", "datetime", "-", "默认当前时间", "行为发生时间"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "comment": [
        ("id", "bigint", "20", "PK, 自增", "评论ID"),
        ("content_type", "varchar", "32", "非空, 索引", "被评论内容类型"),
        ("content_id", "bigint", "20", "非空, 索引", "被评论内容ID"),
        ("user_id", "bigint", "20", "非空, 索引", "评论用户ID"),
        ("content", "varchar", "1000", "非空", "评论内容"),
        ("parent_id", "bigint", "20", "默认0, 索引", "父评论ID"),
        ("status", "tinyint", "1", "非空, 默认1", "状态: 1正常/0屏蔽"),
        ("like_count", "int", "11", "默认0", "点赞数"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
    ],
    "checkin_record": [
        ("id", "bigint", "20", "PK, 自增", "打卡ID"),
        ("user_id", "bigint", "20", "非空, 索引", "用户ID"),
        ("target_type", "varchar", "32", "非空, 索引", "目标类型: scenic/food"),
        ("target_id", "bigint", "20", "非空, 索引", "目标ID"),
        ("photo_url", "varchar", "255", "可空", "打卡照片"),
        ("content", "varchar", "1000", "可空", "打卡文字说明"),
        ("latitude", "decimal", "10,6", "可空", "纬度"),
        ("longitude", "decimal", "10,6", "可空", "经度"),
        ("checkin_time", "datetime", "-", "默认当前时间", "打卡时间"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
    ],
    "tag": [
        ("id", "bigint", "20", "PK, 自增", "标签ID"),
        ("tag_name", "varchar", "64", "非空", "标签名称"),
        ("tag_type", "varchar", "32", "非空", "标签类型: user/content/common"),
        ("status", "tinyint", "1", "非空, 默认1", "状态"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "content_tag": [
        ("id", "bigint", "20", "PK, 自增", "关联ID"),
        ("content_type", "varchar", "32", "非空, 索引", "内容类型"),
        ("content_id", "bigint", "20", "非空, 索引", "内容ID"),
        ("tag_id", "bigint", "20", "非空, 索引", "标签ID"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "travel_route_day": [
        ("id", "bigint", "20", "PK, 自增", "日程ID"),
        ("route_id", "bigint", "20", "非空, 索引", "路线ID"),
        ("day_no", "int", "11", "非空", "第几天"),
        ("title", "varchar", "255", "可空", "当日标题"),
        ("intro", "varchar", "1000", "可空", "当日简介"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
    "travel_route_poi": [
        ("id", "bigint", "20", "PK, 自增", "点位明细ID"),
        ("route_day_id", "bigint", "20", "非空, 索引", "路线日程ID"),
        ("poi_type", "varchar", "32", "非空", "点位类型: scenic/food"),
        ("poi_id", "bigint", "20", "非空", "点位对象ID"),
        ("sort", "int", "11", "非空, 默认0", "顺序号"),
        ("stay_time", "int", "11", "可空", "停留时间(分钟)"),
        ("note", "varchar", "500", "可空", "备注说明"),
        ("create_time", "datetime", "-", "默认当前时间", "创建时间"),
        ("update_time", "datetime", "-", "自动更新时间", "更新时间"),
        ("del_flag", "tinyint", "1", "非空, 默认0", "逻辑删除标记"),
    ],
}


def main():
    wb = Workbook()
    wb.remove(wb.active)

    for table_name, rows in TABLES.items():
        ws = wb.create_sheet(title=table_name[:31])
        ws.append(["字段名", "字段类型", "长度", "约束", "描述"])
        for row in rows:
            ws.append(list(row))

        widths = {"A": 20, "B": 14, "C": 10, "D": 22, "E": 36}
        for col, width in widths.items():
            ws.column_dimensions[col].width = width

    wb.save(OUTPUT_PATH)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
