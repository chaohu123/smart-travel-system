package com.smarttravel;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.smarttravel.**.mapper")
public class SmartTravelApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartTravelApplication.class, args);
    }
}

































