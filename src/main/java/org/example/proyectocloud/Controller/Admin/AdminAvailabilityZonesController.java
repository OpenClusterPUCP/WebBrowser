package org.example.proyectocloud.Controller.Admin;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.example.proyectocloud.Bean.UserInfo;
import org.example.proyectocloud.DTO.Admin.ServerDashboard;
import org.example.proyectocloud.DTO.Admin.Zones.GlobalResourceStatsDTO;
import org.example.proyectocloud.DTO.Admin.Zones.ServerInfoDTO;
import org.example.proyectocloud.DTO.Admin.Zones.ZoneDTO;
import org.example.proyectocloud.DTO.Admin.Zones.ZoneDetailDTO;
import org.example.proyectocloud.Service.Admin.PhysicalServerService;
import org.example.proyectocloud.Service.Admin.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador para las vistas relacionadas con la gestión de zonas de disponibilidad.
 * Se encarga de renderizar las páginas de listado y detalles de zonas de disponibilidad.
 */
@Controller
@RequestMapping("/Admin/availability-zones")
@Slf4j
public class AdminAvailabilityZonesController {

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private PhysicalServerService physicalServerService;


    /**
     * Muestra el listado de todas las zonas de disponibilidad.
     *
     * @param model Modelo para pasar datos a la vista
     * @param session Sesión HTTP para obtener el token JWT
     * @return Vista de listado de zonas de disponibilidad
     */
    @GetMapping("")
    public String listarZonasDisponibilidad(Model model, HttpSession session) {
        log.info("Cargando listado de zonas de disponibilidad");
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");

        if (userInfo == null || userInfo.getJwt() == null) {
            log.warn("No hay token disponible en sesión, redirigiendo al login");
            return "redirect:/login";
        }

        List<ZoneDTO> zones = zoneService.getAllZones(userInfo.getJwt());
        System.out.println(zones.size());
        GlobalResourceStatsDTO stats = zoneService.getGlobalStats(userInfo.getJwt());
        model.addAttribute("zones", zones);
        model.addAttribute("activeMenu", "zones");
        model.addAttribute("globalStats", stats);
        System.out.println(stats.getTotalCpu());

        return "AdminPages/AvailabilityZones";
    }


    @GetMapping("/{id}")
    public String verDetalleZona(@PathVariable Integer id, Model model, HttpSession session) {
        // Lógica para cargar datos de la zona
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        if (userInfo == null || userInfo.getJwt() == null) {
            log.warn("No hay token disponible en sesión, redirigiendo al login");
            return "redirect:/login";
        }

        ZoneDetailDTO detail = zoneService.getZoneDetailById(id, userInfo.getJwt());
        model.addAttribute("zone", detail);
        model.addAttribute("serversData", detail.getServers());
        model.addAttribute("slicesData", detail.getSlices());

        return "/AdminPages/AvailabilityZoneDetail";
    }

    @GetMapping("/{id}/monitoring")
    public String verMonitoreoZona(@PathVariable Integer id, Model model, HttpSession session) {

        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");

        //En base al id de la zona de disponibilidad consultamos a api gateway
        List<ServerInfoDTO> servers = physicalServerService.getServersByZone(id, userInfo.getJwt());

        List<String> ips = servers.stream()
                .map(ServerInfoDTO::getIp)
                .toList();

        String port = ""; // Inicializamos port de su máquina al que enlazaremos con el puerto 3000 de Grafana, esto permitirá monitorear varios a la vez
        String jobName = ""; // Inicializamos job
        if(id == 1){ // Zona de disponibilidad de Gabriel
            port = "3000";
            jobName = "vnrt-servers-gabriel";
        } else if (id == 2) { // Zona de disponibilidad de Sergio
            port = "3001";
            jobName = "vnrt-servers";
        } else if (id == 3) { // Zona de disponibilidad de Hineill
            port = "3002";
            jobName = "vnrt-servers-hineill";
        } else if (id == 4) { // Zona de disponibilidad de Denilson
            port = "3003";
            jobName = "prometheus";
        }else{
            // No se encuentra el ID, debería redirigirlo o salir la pantalla de no se encontró
        }

        // Paneles usados para resumen general
        Map<String, Integer> panelIds = new HashMap<>();
        panelIds.put("pressure", 323);
        panelIds.put("cpuBusy", 20);
        panelIds.put("sysLoad", 155);
        panelIds.put("ramUsed", 16);
        panelIds.put("rootFsUsed", 154);
        panelIds.put("cpuCores", 14);
        panelIds.put("uptime", 15);
        panelIds.put("rootFsTotal", 23);
        panelIds.put("ramTotal", 75);

        // Paneles usados para cada categoría
        Map<String, Integer> cpuPanels = Map.of("cpu", 3);
        Map<String, Integer> ramPanels = Map.of("ram", 78);
        Map<String, Integer> diskPanels = Map.of("disk", 152);
        Map<String, Integer> netPanels = Map.of("net", 74);

        String now = "now";
        String from = "now-24h"; // Últimas 24 horas

        // Construcción de listas por categoría
        List<ServerDashboard> resumenList = buildPanelList(ips, panelIds, from, now, port, jobName);
        List<ServerDashboard> cpuList = buildPanelList(ips, cpuPanels, from, now, port, jobName);
        List<ServerDashboard> ramList = buildPanelList(ips, ramPanels, from, now, port, jobName);
        List<ServerDashboard> diskList = buildPanelList(ips, diskPanels, from, now, port, jobName);
        List<ServerDashboard> networkList = buildPanelList(ips, netPanels, from, now, port, jobName);

        // Enviar datos al modelo
        model.addAttribute("zoneId", id);
        model.addAttribute("resumenList", resumenList);
        model.addAttribute("cpuList", cpuList);
        model.addAttribute("ramList", ramList);
        model.addAttribute("diskList", diskList);
        model.addAttribute("networkList", networkList);
        model.addAttribute("port", port);

        return "/AdminPages/AvailabilityZoneMonitoring";
    }

    // Método auxiliar para generar los paneles de cada servidor
    private List<ServerDashboard> buildPanelList(List<String> ips, Map<String, Integer> panelIds, String from, String to, String port, String jobName) {
        List<ServerDashboard> result = new ArrayList<>();

        for (String ip : ips) {
            Map<String, String> iframes = new HashMap<>();
            for (Map.Entry<String, Integer> entry : panelIds.entrySet()) {
                String iframe = String.format(
                        "http://localhost:%s/d-solo/rYdddlPWk/dashboard-vnrt-servers?" +
                                "orgId=1&from=%s&to=%s&timezone=browser&var-datasource=default" +
                                "&var-job=%s&var-nodename=server1&var-node=%s:9100" +
                                "&var-diskdevices=[a-z]+|nvme[0-9]+n[0-9]+|mmcblk[0-9]+&refresh=1m&panelId=%d&theme=light&__feature.dashboardSceneSolo",
                        port, from, to, jobName, ip, entry.getValue()
                );
                iframes.put(entry.getKey(), iframe);
            }
            result.add(new ServerDashboard(ip, iframes));
        }

        return result;
    }




}
