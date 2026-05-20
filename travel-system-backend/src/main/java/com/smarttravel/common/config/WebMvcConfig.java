package com.smarttravel.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private static final int UPLOAD_CACHE_SECONDS = 30 * 24 * 60 * 60;

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadsPath = getUploadAbsolutePath();
        File uploadsDir = new File(uploadsPath);
        if (!uploadsDir.exists()) {
            uploadsDir.mkdirs();
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(toFileResourceLocation(uploadsPath))
                .setCachePeriod(UPLOAD_CACHE_SECONDS)
                .resourceChain(true);
    }

    private String getUploadAbsolutePath() {
        File uploadDirFile = new File(uploadDir);
        if (uploadDirFile.isAbsolute()) {
            return uploadDir;
        }
        return System.getProperty("user.dir") + File.separator + uploadDir;
    }

    private String toFileResourceLocation(String path) {
        String normalizedPath = path.replace("\\", "/");
        if (!normalizedPath.endsWith("/")) {
            normalizedPath += "/";
        }
        if (normalizedPath.matches("^[A-Za-z]:/.*")) {
            return "file:///" + normalizedPath;
        }
        if (normalizedPath.startsWith("/")) {
            return "file:" + normalizedPath;
        }
        return "file:" + normalizedPath;
    }
}
