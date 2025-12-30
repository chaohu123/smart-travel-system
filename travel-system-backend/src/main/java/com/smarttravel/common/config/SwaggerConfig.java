package com.smarttravel.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI 配置
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI smartTravelOpenAPI() {
        return new OpenAPI()
                .components(new Components())
                .info(new Info()
                        .title("Smart Travel API")
                        .version("v1")
                        .description("智能旅游系统接口文档"));
    }
}























































