package com.smarttravel.content.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 图片访问控制器
 * 专门处理图片文件的访问，确保小程序端能正确加载图片
 */
@RestController
@RequestMapping("/uploads")
@CrossOrigin
public class ImageController {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    /**
     * 获取上传目录的绝对路径
     */
    private String getUploadAbsolutePath() {
        // 如果 uploadDir 是绝对路径，直接使用
        File uploadDirFile = new File(uploadDir);
        if (uploadDirFile.isAbsolute()) {
            return uploadDir;
        }
        // 否则相对于项目根目录
        String projectRoot = System.getProperty("user.dir");
        return projectRoot + File.separator + uploadDir;
    }

    /**
     * 获取图片文件
     * 路径格式: /uploads/年/月/日/文件名
     * 示例: /uploads/2026/01/03/c766dd19cf4544c6912ee0edea3b41e4.jpg
     */
    @GetMapping("/**")
    public ResponseEntity<Resource> getImage(HttpServletRequest request) {
        try {
            // 获取请求路径（去掉 /uploads 前缀）
            String requestPath = getRequestPath(request);
            
            if (requestPath == null || requestPath.isEmpty()) {
                System.err.println("无法获取请求路径");
                return ResponseEntity.notFound().build();
            }
            
            // 构建文件的绝对路径
            String uploadBasePath = getUploadAbsolutePath();
            String filePath = uploadBasePath + File.separator + requestPath.replace("/", File.separator);
            
            Path imagePath = Paths.get(filePath);
            File imageFile = imagePath.toFile();
            
            // 检查文件是否存在
            if (!imageFile.exists() || !imageFile.isFile()) {
                System.err.println("文件不存在: " + filePath);
                return ResponseEntity.notFound().build();
            }
            
            // 检查文件是否可读
            if (!imageFile.canRead()) {
                System.err.println("文件不可读: " + filePath);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // 创建资源
            Resource resource = new FileSystemResource(imageFile);
            
            // 确定 Content-Type
            String contentType = determineContentType(imageFile.getName());
            
            // 设置响应头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(imageFile.length());
            // 允许跨域
            headers.set("Access-Control-Allow-Origin", "*");
            headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
            headers.set("Access-Control-Allow-Headers", "*");
            // 禁用缓存，确保图片更新后立即生效
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
                    
        } catch (Exception e) {
            System.err.println("获取图片失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 获取请求路径（从 /uploads 之后的部分）
     */
    private String getRequestPath(HttpServletRequest request) {
        // 获取完整的请求 URI，例如: /uploads/2026/01/03/c766dd19cf4544c6912ee0edea3b41e4.jpg
        String requestURI = request.getRequestURI();
        
        // 去掉查询参数（如果有）
        if (requestURI.contains("?")) {
            requestURI = requestURI.substring(0, requestURI.indexOf("?"));
        }
        
        // 去掉 /uploads 前缀
        if (requestURI.startsWith("/uploads/")) {
            return requestURI.substring("/uploads/".length());
        } else if (requestURI.startsWith("/uploads")) {
            return requestURI.substring("/uploads".length());
        }
        
        return requestURI;
    }
    
    /**
     * 根据文件名确定 Content-Type
     */
    private String determineContentType(String filename) {
        String lowerName = filename.toLowerCase();
        if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerName.endsWith(".png")) {
            return "image/png";
        } else if (lowerName.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerName.endsWith(".webp")) {
            return "image/webp";
        }
        return "application/octet-stream";
    }
}

