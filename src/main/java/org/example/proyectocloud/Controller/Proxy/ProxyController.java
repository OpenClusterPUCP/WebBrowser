package org.example.proyectocloud.Controller.Proxy;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RestController
@RequestMapping("/api/grafana")
public class ProxyController {

    private final RestTemplate restTemplate;


    public ProxyController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/dashboard/{uid}")
    public ResponseEntity<String> proxyGrafanaDashboard(
            @PathVariable String uid,
            @RequestParam(defaultValue = "1") int panelId,
            HttpServletRequest request
    ) {
        // este host debe ser localhost porque usamos túnel SSH
        String grafanaUrl = "http://localhost:3000/d-solo/" + uid + "?orgId=1&theme=light&panelId=" + panelId;

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.TEXT_HTML));

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(grafanaUrl, HttpMethod.GET, entity, String.class);
        return ResponseEntity.ok().body(response.getBody());
    }




}
