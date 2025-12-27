package com.smarttravel.content.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 简单文件上传接口（用于游记图片）
 */
@RestController
@RequestMapping("/api/v1/upload")
@CrossOrigin
public class UploadController {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Value("${upload.access-prefix:/uploads/}")
    private String accessPrefix;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> res = new HashMap<>();
        if (file.isEmpty()) {
            res.put("code", 400);
            res.put("msg", "文件为空");
            return res;
        }

        // 创建日期子目录
        String datePath = DateTimeFormatter.ofPattern("yyyy/MM/dd").format(LocalDateTime.now());
        String dirPath = uploadDir + File.separator + datePath;
        Files.createDirectories(Paths.get(dirPath));

        String original = file.getOriginalFilename();
        String ext = original != null && original.contains(".") ? original.substring(original.lastIndexOf(".")) : "";
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        File dest = new File(dirPath, filename);
        file.transferTo(dest);

        String url = accessPrefix + datePath + "/" + filename;
        res.put("code", 200);
        res.put("msg", "success");
        res.put("data", url.replace("\\", "/"));
        return res;
    }
}

















