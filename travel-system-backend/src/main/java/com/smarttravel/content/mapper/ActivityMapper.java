package com.smarttravel.content.mapper;

import com.smarttravel.content.domain.Activity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ActivityMapper {
    int insert(Activity activity);

    int update(Activity activity);

    int deleteByIdPhysically(@Param("id") Long id);

    Activity selectById(@Param("id") Long id);

    Activity selectByIdWithoutDelFlag(@Param("id") Long id);

    List<Activity> selectListWithPage(@Param("query") Activity query,
                                     @Param("offset") Integer offset,
                                     @Param("pageSize") Integer pageSize);

    int countList(@Param("query") Activity query);
}

