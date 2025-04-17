package org.example.proyectocloud;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.InputStream;
import java.util.LinkedHashMap;

@Controller
public class LoginController {

    @GetMapping({"/", "/login", "/login/"})
    public String login() {
        return "index";
    }

    @GetMapping("/connectSsh")
    @ResponseBody
    public Object ssh (){
        LinkedHashMap<String , Object > response  =  new LinkedHashMap<>();

        String host = "10.20.12.137";
        String user = "ubuntu";
        String password = "server1";

        try {
            JSch jsch = new JSch();
            Session session = jsch.getSession(user, host, 5801);
            session.setPassword(password);

            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            ChannelExec channel = (ChannelExec) session.openChannel("exec");
            channel.setCommand("ls -la");
            channel.setErrStream(System.err);
            channel.setInputStream(null);

            InputStream in = channel.getInputStream();
            channel.connect();

            byte[] tmp = new byte[1024];
            while (true) {
                while (in.available() > 0) {
                    int i = in.read(tmp, 0, 1024);
                    if (i < 0) break;
                    System.out.print(new String(tmp, 0, i));
                }
                if (channel.isClosed()) break;
                Thread.sleep(1000);
            }

            channel.disconnect();
            session.disconnect();

        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }


}
