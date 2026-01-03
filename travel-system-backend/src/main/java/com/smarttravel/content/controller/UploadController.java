package com.smarttravel.content.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 用户端文件上传接口
 */
@RestController
@RequestMapping("/api/v1/upload")
@CrossOrigin
public class UploadController {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Value("${upload.access-prefix:/uploads/}")
    private String accessPrefix;

    /**
     * 获取上传目录的绝对路径
     */
    private String getUploadAbsolutePath() {
        // 如果 uploadDir 是绝对路径，直接使用
        if (new File(uploadDir).isAbsolute()) {
            return uploadDir;
        }
        // 否则相对于项目根目录
        String projectRoot = System.getProperty("user.dir");
        return projectRoot + File.separator + uploadDir;
    }

    /**
     * 图片上传接口
     */
    @PostMapping("/image")
    public Map<String, Object> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();

        if (file == null || file.isEmpty()) {
            result.put("code", 400);
            result.put("msg", "文件不能为空");
            return result;
        }

        // 验证文件类型
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            result.put("code", 400);
            result.put("msg", "文件名不能为空");
            return result;
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        if (!extension.matches("(?i)\\.(jpg|jpeg|png|gif|webp)")) {
            result.put("code", 400);
            result.put("msg", "只支持 jpg、jpeg、png、gif、webp 格式的图片");
            return result;
        }

        // 验证文件大小（5MB，用户端可以稍大一些）
        if (file.getSize() > 5 * 1024 * 1024) {
            result.put("code", 400);
            result.put("msg", "图片大小不能超过 5MB");
            return result;
        }

        try {
            // 生成文件路径：uploads/年/月/日/文件名
            LocalDateTime now = LocalDateTime.now();
            String year = String.valueOf(now.getYear());
            String month = String.format("%02d", now.getMonthValue());
            String day = String.format("%02d", now.getDayOfMonth());

            // 生成唯一文件名
            String uuid = UUID.randomUUID().toString().replace("-", "");
            String newFilename = uuid + extension;

            // 构建目录路径
            String relativeDir = year + File.separator + month + File.separator + day;
            String uploadBasePath = getUploadAbsolutePath();
            String absoluteDir = uploadBasePath + File.separator + relativeDir;
            Path dirPath = Paths.get(absoluteDir);

            // 创建目录（如果不存在）
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            // 保存文件
            Path filePath = dirPath.resolve(newFilename);
            Files.write(filePath, file.getBytes());

            // 构建访问URL
            String accessUrl = accessPrefix + relativeDir.replace(File.separator, "/") + "/" + newFilename;

            result.put("code", 200);
            result.put("msg", "上传成功");
            Map<String, String> dataMap = new HashMap<>();
            dataMap.put("url", accessUrl);
            result.put("data", dataMap);
            return result;

        } catch (IOException e) {
            result.put("code", 500);
            result.put("msg", "文件上传失败：" + e.getMessage());
            return result;
        }
    }
}
