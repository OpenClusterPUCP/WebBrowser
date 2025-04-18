package org.example.proyectocloud.Controller;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import jakarta.servlet.http.HttpSession;
import org.example.proyectocloud.Dao.AuthDao;
import org.example.proyectocloud.Service.SliceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.InputStream;
import java.util.LinkedHashMap;

@Controller
public class LoginController {
    @Autowired
    AuthDao authDao;
    @Autowired
    SliceService sliceService;


    //Visualizar vistas
    @GetMapping({"/", "/login", "/login/"})
    public String login(HttpSession session) {
        return "index";}



    //Servicios para extraer datos a las vistas



    //Extras
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
    @PostMapping("/Logearse")
    @ResponseBody
    public Object verToken(@RequestBody LinkedHashMap<String  , Object > credentials , HttpSession session){
        LinkedHashMap<String , Object >  response=  new LinkedHashMap<>();
        String jwtToken =  authDao.autenticarYObtenerJwt(credentials.get("username").toString() , credentials.get("password").toString());
        if(jwtToken.equals("ERROR_SERVICIO_NO_DISPONIBLE")){
            response.put("status" ,"error" );
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN).body(response);
        }else{
            session.setAttribute("jwtToken" , jwtToken);
            response.put("status" ,"ok" );
            return ResponseEntity
                    .status(HttpStatus.OK).body(response);
        }
    }

    @GetMapping("/testAdmin")
    @ResponseBody
    public Object consultaProtegidaAdmin(HttpSession session){
        LinkedHashMap<String , Object > response =  new LinkedHashMap<>();
        if(session.getAttribute("jwtToken") ==  null ){
            response.put("status" ,  "error");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }else{
            String jwt = session.getAttribute("jwtToken").toString();
            return sliceService.consumirApiProtegidaAdmin(jwt);
        }
    }

    @GetMapping("/testAlumno")
    @ResponseBody
    public Object consultaProtegidaAlumno(HttpSession session){
        LinkedHashMap<String , Object > response =  new LinkedHashMap<>();
        if(session.getAttribute("jwtToken") ==  null ){
            response.put("status" ,  "error");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }else{
            String jwt = session.getAttribute("jwtToken").toString();
            return sliceService.consumirApiProtegidaAlumno(jwt);
        }
    }


}
