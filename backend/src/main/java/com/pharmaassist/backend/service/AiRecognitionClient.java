package com.pharmaassist.backend.service;

import com.pharmaassist.backend.dto.ScanDtos.AiRecognitionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;

/**
 * Talks to the standalone Python AI microservice (see /ai-service) that hosts
 * the computer-vision medicine recognition model. Swap the mock model in
 * ai-service/main.py for a real trained model without touching this class.
 */
@Service
public class AiRecognitionClient {

    private final RestTemplate restTemplate;

    @Value("${app.ai-service.base-url}")
    private String aiServiceBaseUrl;

    public AiRecognitionClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public AiRecognitionResponse recognize(File imageFile) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(imageFile));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        return restTemplate.postForObject(
                aiServiceBaseUrl + "/recognize", requestEntity, AiRecognitionResponse.class);
    }
}
