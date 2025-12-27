package com.smarttravel.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * 静态资源映射，支持本地上传文件访问
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Value("${upload.access-prefix:/uploads/}")
    private String accessPrefix;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String physicalPath = Paths.get(uploadDir).toAbsolutePath().toUri().toString();
        registry.addResourceHandler(accessPrefix + "**")
                .addResourceLocations(physicalPath);
    }
}

















