package com.smarttravel.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Web MVC 配置
 * - 跨域配置
 * - 静态资源映射（上传文件访问）
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    /**
     * 跨域配置
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * 获取上传目录的绝对路径（与 UploadController 使用相同的逻辑）
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
     * 静态资源映射
     * 将 /uploads/** 映射到文件系统的 uploads 目录
     * 使用与 UploadController 相同的路径解析逻辑
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 获取上传目录的绝对路径（与 UploadController 使用相同的逻辑）
        String uploadsPath = getUploadAbsolutePath();
        
        // 确保目录存在
        File uploadsDir = new File(uploadsPath);
        if (!uploadsDir.exists()) {
            boolean created = uploadsDir.mkdirs();
            if (!created) {
                System.err.println("警告: 无法创建上传目录: " + uploadsPath);
            }
        }

        // 处理路径格式，确保 Spring ResourceHandler 能正确识别
        // Windows 路径示例: C:/path/to/uploads -> file:///C:/path/to/uploads/
        // Unix 路径示例: /path/to/uploads -> file:/path/to/uploads/
        String normalizedPath = uploadsPath.replace("\\", "/");
        if (!normalizedPath.endsWith("/")) {
            normalizedPath += "/";
        }
        
        // 添加 file: 协议前缀
        // Windows 路径（包含冒号，如 C:）需要特殊处理，使用三个斜杠 file:///
        if (normalizedPath.matches("^[A-Za-z]:/.*")) {
            // Windows 绝对路径，格式: file:///C:/path/to/uploads/
            normalizedPath = "file:///" + normalizedPath;
        } else if (normalizedPath.startsWith("/")) {
            // Unix 绝对路径，格式: file:/path/to/uploads/
            normalizedPath = "file:" + normalizedPath;
        } else {
            // 相对路径，格式: file:path/to/uploads/
            normalizedPath = "file:" + normalizedPath;
        }

        // 注意：图片访问现在由 ImageController 处理，这里保留静态资源映射作为备用
        // 如果 ImageController 无法处理，会回退到静态资源映射
        // 映射 /uploads/** 到文件系统的 uploads 目录
        // 设置缓存时间为0，确保图片更新后能立即生效
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(normalizedPath)
                .setCachePeriod(0) // 禁用缓存，确保图片更新后立即生效
                .resourceChain(false); // 禁用资源链，直接访问文件
    }
}
