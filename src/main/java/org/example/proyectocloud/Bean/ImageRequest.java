package org.example.proyectocloud.Bean;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageRequest {
    private String name;
    private String type; // "public" or "private"
    private Integer userId; // Required for private images, null for public images
    private String disco;
    private String description;
    private String version ;
    private String os;
    private Integer imageSize;
}