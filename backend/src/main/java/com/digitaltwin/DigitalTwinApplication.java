package com.digitaltwin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class DigitalTwinApplication {

    public static void main(String[] args) {
        SpringApplication.run(DigitalTwinApplication.class, args);
    }

    // RestTemplate for communicating with Python ML Service
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
