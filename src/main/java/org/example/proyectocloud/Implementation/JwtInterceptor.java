package org.example.proyectocloud.Implementation;

import org.example.proyectocloud.DTO.TokenProvider;
import org.example.proyectocloud.Dao.AuthDao;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;

public class JwtInterceptor implements ClientHttpRequestInterceptor {

    private final TokenProvider tokenProvider;

    public JwtInterceptor(TokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body,
                                        ClientHttpRequestExecution execution) throws IOException {
        String token = tokenProvider.getToken();
        if (token != null && !token.isEmpty()) {
            request.getHeaders().add("Authorization", "Bearer " + token);
        }
        return execution.execute(request, body);
    }
}
