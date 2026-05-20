package com.smarttravel.content.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.util.AntPathMatcher;

import javax.servlet.http.HttpServletRequest;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * 图片访问控制器
 * 专门处理图片文件的访问，确保小程序端能正确加载图片
 */
@RestController
@RequestMapping("/uploads")
@CrossOrigin
public class ImageController {
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

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
                return ResponseEntity.notFound().build();
            }

            // 规范化路径，避免前导分隔符和目录穿越
            requestPath = requestPath.replace("\\", "/");
            while (requestPath.startsWith("/")) {
                requestPath = requestPath.substring(1);
            }
            if (requestPath.contains("..")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            // 构建文件的可能路径（兼容从不同工作目录启动服务的情况）
            String uploadBasePath = getUploadAbsolutePath();

            File imageFile = resolveImageFile(uploadBasePath, requestPath);
            if (imageFile == null || !imageFile.exists() || !imageFile.isFile()) {
                // 兼容：如果以仓库根目录启动，但上传目录位于 travel-system-backend/uploads
                String projectRoot = System.getProperty("user.dir");
                String altBasePath = projectRoot + File.separator + "travel-system-backend" + File.separator + uploadDir;
                imageFile = resolveImageFile(altBasePath, requestPath);
            }
            
            // 解析失败或文件不存在时直接返回404，避免NPE导致500
            if (imageFile == null || !imageFile.exists() || !imageFile.isFile()) {
                return ResponseEntity.notFound().build();
            }
            
            // 检查文件是否可读
            if (!imageFile.canRead()) {
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
            headers.setCacheControl("public, max-age=2592000, immutable");
            headers.setLastModified(imageFile.lastModified());
            
            ResponseEntity<Resource> response = ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
            return response;
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 基于上传根目录和相对路径解析文件，返回 File（不会抛出异常）
     */
    private File resolveImageFile(String uploadBasePath, String requestPath) {
        try {
            Path base = Paths.get(uploadBasePath);
            Path resolved = base.resolve(requestPath.replace("/", File.separator));
            File f = resolved.toFile();
            return f;
        } catch (Exception ex) {
            return null;
        }
    }
    
    /**
     * 获取请求路径（从 /uploads 之后的部分）
     */
    private String getRequestPath(HttpServletRequest request) {
        // 先使用 Spring 的路径匹配属性提取 /** 的相对路径，兼容 context-path 与不同部署方式
        String relativePath = null;
        Object pathAttr = request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        Object patternAttr = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (pathAttr instanceof String && patternAttr instanceof String) {
            relativePath = PATH_MATCHER.extractPathWithinPattern((String) patternAttr, (String) pathAttr);
        }

        // 兜底：手动从 requestURI 去掉 /uploads 前缀
        if (relativePath == null || relativePath.isEmpty()) {
            String requestURI = request.getRequestURI();
            String contextPath = request.getContextPath();
            if (contextPath != null && !contextPath.isEmpty() && requestURI.startsWith(contextPath)) {
                requestURI = requestURI.substring(contextPath.length());
            }
            if (requestURI.contains("?")) {
                requestURI = requestURI.substring(0, requestURI.indexOf("?"));
            }
            if (requestURI.startsWith("/uploads/")) {
                relativePath = requestURI.substring("/uploads/".length());
            } else if (requestURI.startsWith("/uploads")) {
                relativePath = requestURI.substring("/uploads".length());
            } else {
                relativePath = requestURI;
            }
        }

        // 对URL编码做解码（例如中文、空格），解码失败则使用原值
        try {
            return URLDecoder.decode(relativePath, StandardCharsets.UTF_8.name());
        } catch (Exception ex) {
            return relativePath;
        }
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
