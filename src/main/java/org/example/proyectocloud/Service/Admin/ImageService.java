package org.example.proyectocloud.Service.Admin;

import com.fasterxml.jackson.core.JsonProcessingException;
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

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
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
     * Crea una nueva imagen
     * @param token Token de autorización
     * @param imageRequest Metadatos de la imagen
     * @param file El archivo de imagen a subir (opcional)
     * @return Información de la imagen creada o detalles del error
     */
    public Object createImage(String token, ImageRequest imageRequest, MultipartFile file) {
        log.info("Creando nueva imagen con nombre: {}", imageRequest.getName());
        String url = API_GATEWAY_URL + "/Admin/images/create";

        try {
            String boundary = "----" + System.currentTimeMillis();

            // Configurar la conexión
            URL apiUrl = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) apiUrl.openConnection();
            connection.setDoOutput(true);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

            // Agregar token de autorización
            if (token != null && !token.isEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer " + token);
            } else {
                log.warn("Token de autorización no proporcionado o vacío");
            }

            connection.setChunkedStreamingMode(1024 * 1024); // Tamaño del buffer de streaming en bytes (1MB)

            try (OutputStream output = connection.getOutputStream();
                 PrintWriter writer = new PrintWriter(new OutputStreamWriter(output, StandardCharsets.UTF_8), true)) {

                // Parte 1: Datos JSON
                writer.append("--").append(boundary).append("\r\n");
                writer.append("Content-Disposition: form-data; name=\"imageData\"\r\n");
                writer.append("Content-Type: application/json\r\n\r\n");
                writer.append(new ObjectMapper().writeValueAsString(imageRequest)).append("\r\n");

                // Parte 2: Archivo
                if (file != null && !file.isEmpty()) {
                    writer.append("--").append(boundary).append("\r\n");
                    writer.append("Content-Disposition: form-data; name=\"file\"; filename=\"")
                            .append(file.getOriginalFilename()).append("\"\r\n");
                    writer.append("Content-Type: ").append(file.getContentType()).append("\r\n\r\n");
                    writer.flush();

                    // Transmitir el archivo en bloques
                    try (InputStream inputStream = file.getInputStream()) {
                        byte[] buffer = new byte[8192]; // Buffer de 8KB
                        int bytesRead;
                        while ((bytesRead = inputStream.read(buffer)) != -1) {
                            output.write(buffer, 0, bytesRead);
                        }
                        output.flush();
                    }
                    writer.append("\r\n");
                }

                // Parte final: Cerrar el límite
                writer.append("--").append(boundary).append("--").append("\r\n");
            }

            // Obtener la respuesta
            int responseCode = connection.getResponseCode();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(
                            responseCode >= 400 ? connection.getErrorStream() : connection.getInputStream()))) {
                StringBuilder responseBody = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }

                // Procesar la respuesta
                ObjectMapper mapper = new ObjectMapper();
                if (responseCode >= 200 && responseCode < 300) {
                    return mapper.readValue(responseBody.toString(), LinkedHashMap.class);
                } else {
                    log.error("Error del servidor al crear imagen: código {} - respuesta {}", responseCode, responseBody);
                    try {
                        return mapper.readValue(responseBody.toString(), Map.class);
                    } catch (Exception e) {
                        return Collections.singletonMap("error", "Error al crear imagen: código " + responseCode + " - " + responseBody);
                    }
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Error al procesar JSON de imageRequest: {}", e.getMessage());
            return Collections.singletonMap("error", "Error al procesar datos de imagen: " + e.getMessage());
        } catch (IOException e) {
            log.error("Error de E/S al comunicarse con la API: {}", e.getMessage());
            return Collections.singletonMap("error", "Error de comunicación con el servidor: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error inesperado al crear imagen: {}", e.getMessage(), e);
            return Collections.singletonMap("error", "Error inesperado al crear imagen: " + e.getMessage());
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