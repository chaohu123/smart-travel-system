package com.smarttravel.user.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserTagMapper {
    int deleteByUserId(@Param("userId") Long userId);

    int batchInsert(@Param("userId") Long userId, @Param("tagIds") List<Long> tagIds);

    List<Long> selectTagIdsByUserId(@Param("userId") Long userId);

    List<String> selectTagNamesByUserId(@Param("userId") Long userId);
}























<<<<<<< HEAD

=======
>>>>>>> 299642f29c0d19bfedecf29490a18cfe2ad7de4f
