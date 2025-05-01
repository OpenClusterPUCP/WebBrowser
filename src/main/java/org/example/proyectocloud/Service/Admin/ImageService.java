package org.example.proyectocloud.Service.Admin;

import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.ImageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.*;

@Service
@Slf4j
public class ImageService {
    private static final Logger log = LoggerFactory.getLogger(ImageService.class);
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${api.gateway.url}")
    private String API_GATEWAY_URL;
    
    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }
    
    /**
     * Get all images for a specific user
     * @param token Authorization token
     * @param userId ID of the user to fetch images for
     * @return List of images or empty list in case of error
     */
    public Object getUserImages(String token, Integer userId) {
        log.info("Requesting images list for user ID: {}", userId);
        String url = API_GATEWAY_URL + "/Admin/images/list/" + userId;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    LinkedHashMap.class
            );
            try {
                LinkedHashMap<String, Object> json = response.getBody();
                if (json == null) {
                    return Collections.emptyList();
                }
                
                ArrayList<LinkedHashMap<String, Object>> imagesList = 
                    (ArrayList<LinkedHashMap<String, Object>>) json.get("content");
                
                log.debug("Retrieved {} images for user ID: {}", imagesList.size(), userId);
                
                return imagesList;
            } catch (Exception e) {
                log.error("Error deserializing images: {}", e.getMessage());
                return Collections.emptyList();
            }
        } catch (Exception ex) {
            log.error("Error consuming images API: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Create a new image
     * @param token Authorization token
     * @param imageRequest Image metadata
     * @param file The image file to upload (optional)
     * @return Created image information or error details
     */
    public Object createImage(String token, ImageRequest imageRequest, MultipartFile file) {
        log.info("Creating new image with name: {}", imageRequest.getName());
        String url = API_GATEWAY_URL + "/Admin/images/create";

        HttpHeaders headers = createAuthHeaders(token);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        
        // Add image request data
        ObjectMapper mapper = new ObjectMapper();
        try {
            String imageDataJson = mapper.writeValueAsString(imageRequest);
            HttpHeaders imageDataHeaders = new HttpHeaders();
            imageDataHeaders.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> imageDataEntity = new HttpEntity<>(imageDataJson, imageDataHeaders);
            body.add("imageData", imageDataEntity);
            
            // Add file if provided
            if (file != null && !file.isEmpty()) {
                HttpHeaders fileHeaders = new HttpHeaders();
                fileHeaders.setContentType(MediaType.valueOf(file.getContentType()));
                ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename();
                    }
                };
                HttpEntity<ByteArrayResource> fileEntity = new HttpEntity<>(fileResource, fileHeaders);
                body.add("file", fileEntity);
            }
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    LinkedHashMap.class
            );
            
            return response.getBody();
        } catch (HttpClientErrorException ex) {
            log.error("Error creating image: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            try {
                Map<String, Object> errorResponse = mapper.readValue(ex.getResponseBodyAsString(), Map.class);
                return errorResponse;
            } catch (Exception e) {
                return Collections.singletonMap("error", "Error creating image: " + ex.getMessage());
            }
        } catch (IOException e) {
            log.error("Error processing file or JSON: {}", e.getMessage());
            return Collections.singletonMap("error", "Error processing file: " + e.getMessage());
        } catch (Exception ex) {
            log.error("Error consuming image API: {}", ex.getMessage());
            return Collections.singletonMap("error", "Error creating image: " + ex.getMessage());
        }
    }
    
    /**
     * Delete an image
     * @param token Authorization token
     * @param imageId ID of the image to delete
     * @return Result of the deletion operation
     */
    public Object deleteImage(String token, Integer imageId) {
        log.info("Deleting image with ID: {}", imageId);
        String url = API_GATEWAY_URL + "/Admin/images/delete/" + imageId;

        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    LinkedHashMap.class
            );

            return response.getBody();
        } catch (HttpClientErrorException ex) {
            log.error("Error deleting image: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> errorResponse = mapper.readValue(ex.getResponseBodyAsString(), Map.class);
                return errorResponse;
            } catch (Exception e) {
                return Collections.singletonMap("error", "Error deleting image: " + ex.getMessage());
            }
        } catch (Exception ex) {
            log.error("Error consuming image API: {}", ex.getMessage());
            return Collections.singletonMap("error", "Error deleting image: " + ex.getMessage());
        }
    }
    public Object updateImage(String token, Integer imageId, String name,
                              String description, String state, Integer adminUserId) {
        log.info("Updating image with ID: {}, parameters: name={}, description={}, state={}",
                imageId, name, description, state);

        String url = API_GATEWAY_URL + "/Admin/images/update/" + imageId + "?idAdmin=" + adminUserId;

        HttpHeaders headers = createAuthHeaders(token);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("name", name);

        // Añadir descripción y estado solo si no son nulos
        if (description != null) {
            body.add("description", description);
        }

        if (state != null) {
            body.add("state", state);
        }

        HttpEntity<MultiValueMap<String, String>> requestEntity =
                new HttpEntity<>(body, headers);

        try {
            ResponseEntity<LinkedHashMap> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    LinkedHashMap.class
            );

            return response.getBody();
        } catch (HttpClientErrorException ex) {
            log.error("Error updating image: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> errorResponse = mapper.readValue(ex.getResponseBodyAsString(), Map.class);
                return errorResponse;
            } catch (Exception e) {
                return Collections.singletonMap("error", "Error updating image: " + ex.getMessage());
            }
        } catch (Exception ex) {
            log.error("Error consuming image API: {}", ex.getMessage());
            return Collections.singletonMap("error", "Error updating image: " + ex.getMessage());
        }
    }
}