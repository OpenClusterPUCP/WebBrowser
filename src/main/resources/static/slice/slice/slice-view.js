/* 
==============================================================================
| ARCHIVO: slice-view.js
==============================================================================
| DESCRIPCIÓN:
| Implementa la visualización y gestión de los Slices desplegados. Te permite 
| ver detalles de la topología, estado de VMs y recursos asignados.
==============================================================================
| CONTENIDO PRINCIPAL:
| 1. CONFIGURACIÓN E INICIALIZACIÓN
|    - Importación de dependencias y datos
|    - Inicialización de variables globales
|    - Configuración de Vis.js Network
|    - Carga inicial de datos del Slice
|
| 2. VISUALIZACIÓN DE DATOS
|    - Renderizado de topología
|    - Actualización de información de red
|    - Gestión de interfaces y enlaces
|    - Tooltips y etiquetas informativas
|
| 3. GESTIÓN DE MODALES
|    - Detalles de VMs
|    - Información de enlaces
|    - Acceso a consola VNC
|    - Confirmaciones de acciones
|
| 4. OPERACIONES DE SLICE
|    - Detención de Slice
|    - Acceso a VMs (Cliente noVNC usando websockets)
|    - Exportación de topología
|    - Organización visual del layout
|
| 5. UTILIDADES/HELPERS
|    - Generación de tooltips
|    - Verificación de acceso externo
|    - Formateo de datos para visualización
|    - Helpers para manipulación del DOM
==============================================================================
*/

// ===================== VARIABLES GLOBALES =====================
let network = null;
let visDataset = {
    nodes: new vis.DataSet(),
    edges: new vis.DataSet()
};
let contextMenu;
let currentContextNode = null;
let nodeTooltips = new Map();
let edgeTooltips = new Map();
let tooltip =  document.getElementById('customTooltip');
let container = document.getElementById('network-container');
let SLICE_DATA = null;
let BACKEND_IP = 'localhost';
let BACKEND_PORT = 5001;
let AVAILABLE_IMAGES = [];
let AVAILABLE_FLAVORS = [];
let GATEWAY_URL = 'http://localhost:9000';

// ===================== CONFIGURACIÓN DE VIS.JS =====================
const options = {
    manipulation: {
        enabled: false
    },
    interaction: {
        hover: true,
        tooltipDelay: 300,
        zoomView: true,
        dragView: true,
        navigationButtons: true,
        keyboard: {
            enabled: true,
            speed: { x: 5, y: 5, zoom: 0.008 },
            bindToWindow: false
        }
    },
    physics: {
        enabled: false,
    },
    interaction: {
        hover: true,
        tooltipDelay: 300,
        zoomView: true,
        dragView: true,
        navigationButtons: true,
        zoomSpeed: 0.5,
        keyboard: {
            enabled: true,
            speed: { 
                x: 5, 
                y: 5, 
                zoom: 0.008  
            },
            bindToWindow: false
        }
    },
    nodes: {
        shape: 'image',
        image: '/slice/slice/host.png',
        size: 30,
        shadow: {
            enabled: true,
            color: '#fb8c00',
            size: 26,
            x: 6,
            y: 6
        },
        font: {
            size: 16,
            color: '#000000',
            face: 'Roboto',
            strokeWidth: 4,
            strokeColor: '#ffffff',
            
        },
        chosen: {
            node: function(values, id, selected, hovering) {
                if (hovering || selected) {
                    values.shadow = true;
                    values.shadowColor = '#fb8c00';
                    values.shadowSize = 36;
                }
            }
        },
        fixed: false,
        title: undefined
    },
    edges: {
        width: 2,
        color: {
            color: '#000000',
            highlight: '#fb8c00',
            hover: '#fb8c00',
            opacity: 0.8
        },
        shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.5)',
            size: 21,
            x: 5,
            y: 5
        },
        smooth: {
            enabled: true,
            type: 'dynamic'
        },
        font: {
            size: 15,
            face: 'Roboto',
            strokeWidth: 3,
            strokeColor: '#ffffff',
            
        },
        title: undefined,
    }
};

// ===================== INICIALIZACIÓN =====================
document.addEventListener('DOMContentLoaded', function() {

    contextMenu = document.getElementById('contextMenu');
    document.getElementById('sliceDescriptionBtn').addEventListener('click', showSliceDetail);
    getSliceData(true);
    const vmModal = document.getElementById('vmInfoModal');
    if (vmModal) {
        vmModal.addEventListener('hidden.bs.modal', function () {
            cleanupTooltips('vmInfoModal');
        });
    }
});

async function getSliceData(flag){
    await loadResources();
    const sliceId = document.getElementById('slice-data').dataset.sliceId;
    if (!sliceId) {
        Swal.fire({
            title: 'Error',
            text: 'No se proporcionó un ID de Slice',
            icon: 'error',
            confirmButtonText: 'Volver',
            customClass: {
                confirmButton: 'btn bg-gradient-primary'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/';
            }
        });
        return;
    }

    let data = null;

    try {
        Swal.fire({
            title: 'Cargando',
            text: 'Obteniendo información de la Slice...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/User/api/slice/${sliceId}`);
        data = await response.json();
        
        await new Promise(resolve => setTimeout(resolve, 600));

        console.log("Respuesta: ", data);

        if (data.status === 'success') {
            SLICE_DATA = data;

            console.log('Slice data: ', SLICE_DATA.content);
            
            container = document.getElementById('network-container');
            if (!container) {
                console.error('Container no se encontró!');
                return;
            }

            if(flag){
                visDataset = {
                    nodes: new vis.DataSet(),
                    edges: new vis.DataSet()
                };
            }

            try {

                if(flag){
                    network = new vis.Network(container, visDataset, options);
                }

                
                loadSliceData(SLICE_DATA.content,flag);
                
                network.on('doubleClick', function(params) {
                    network.selectNodes([]);
                    if (params.nodes.length > 0) {
                        const vmId = params.nodes[0];
                        showVMInfo(vmId);
                    } else if (params.edges.length > 0) {
                        const linkId = params.edges[0];
                        showLinkInfo(linkId);
                    }
                });

                network.once('afterDrawing', function() {
                    if(flag){
                        network.fit();
                    }
                });

            
                network.on("hoverNode", function (params) {
                    const nodeId = params.node;
                    const tooltipContent = nodeTooltips.get(nodeId);
            
                    if (tooltipContent) {
                        tooltip.innerHTML = tooltipContent;
                        
                        positionTooltip(tooltip, params.event);
                        
                        tooltip.classList.remove("animate__fadeOutDown");
                        tooltip.classList.add("animate__delay-2s");
                        tooltip.classList.add("animate__jackInTheBox");
                        tooltip.style.display = "block";
                    }
                });
                
                network.on("blurNode", function () {
                    tooltip.classList.remove("animate__jackInTheBox");
                    tooltip.classList.add("animate__fadeOut");
                    tooltip.style.display = "none";
                });
                
                container.addEventListener("mousemove", function (event) {
                    if (tooltip.style.display === "block") {
                        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                        
                        const x = event.clientX + 10;
                        const y = event.clientY + 10;
                        
                        tooltip.style.position = 'fixed';
                        tooltip.style.left = `${x}px`;
                        tooltip.style.top = `${y}px`;
                    }
                });
            
                network.on("hoverEdge", function (params) {
                    const edgeId = params.edge;
                    const tooltipContent = edgeTooltips.get(edgeId);
                    if (tooltipContent) {
                        tooltip.innerHTML = tooltipContent;
                        
                        positionTooltip(tooltip, params.event);
            
                        tooltip.classList.remove("animate__rotateOut");
                        tooltip.classList.add("animate__delay-2s");
                        tooltip.classList.add("animate__jackInTheBox");
                        tooltip.style.display = "block";
                    }
                });
            
                network.on("blurEdge", function () {
                    tooltip.classList.remove("animate__jackInTheBox");
                    tooltip.classList.add("animate__fadeOut");
                    tooltip.style.display = "none";
                });

                

                if (network) {

                    const contextMenu = document.getElementById('contextMenu');
                    const ctxVNCButton = document.getElementById('ctxVNCButton');
                    const ctxRestartButton = document.getElementById('ctxRestartButton');
                    const ctxToggleButton = document.getElementById('ctxToggleButton');
                    
                    if (ctxVNCButton) {
                        const newVNCButton = ctxVNCButton.cloneNode(true);
                        ctxVNCButton.parentNode.replaceChild(newVNCButton, ctxVNCButton);
                    }
                    if (ctxRestartButton) {
                        const newRestartButton = ctxRestartButton.cloneNode(true);
                        ctxRestartButton.parentNode.replaceChild(newRestartButton, ctxRestartButton);
                    }
                    if (ctxToggleButton) {
                        const newToggleButton = ctxToggleButton.cloneNode(true);
                        ctxToggleButton.parentNode.replaceChild(newToggleButton, ctxToggleButton);
                    }

                    network.on('click', function(params) {
                        if (!params.event.target.closest('#contextMenu')) {
                            hideContextMenu();
                        }
                    });
                    
                    network.on('dragStart', function(params) {
                        hideContextMenu();
                    });
                    

                    if (container.contextMenuListener) {
                        container.removeEventListener('contextmenu', container.contextMenuListener);
                    }

                    container.contextMenuListener = function(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        const pointer = {
                            x: event.offsetX,
                            y: event.offsetY
                        };
                        
                        const nodeId = network.getNodeAt(pointer);
                        console.log("Click derecho en nodo:", nodeId);
                        
                        if (nodeId) {
                            const vm = SLICE_DATA.content.topology_info.vms.find(v => v.id === nodeId);
                            if (vm) {
                                showContextMenu(vm, event);
                            }
                        } else {
                            hideContextMenu();
                        }
                    };

                    container.addEventListener('contextmenu', container.contextMenuListener);

                    document.getElementById('ctxVNCButton')?.addEventListener('click', function() {
                        if (currentContextNode) {
                            openVNCConsole(currentContextNode.id);
                            hideContextMenu();
                        }
                    });

                    document.getElementById('ctxRestartButton')?.addEventListener('click', function() {
                        if (currentContextNode) {
                            restartVM(currentContextNode.id);
                            hideContextMenu();
                        }
                    });

                    document.getElementById('ctxToggleButton')?.addEventListener('click', function() {
                        if (currentContextNode) {
                            toggleVMState(currentContextNode.id);
                            hideContextMenu();
                        }
                    });
                }

                document.addEventListener('click', function(e) {
                    // Solo ocultar si el click NO fue en el menú contextual o sus elementos
                    if (!e.target.closest('#contextMenu') && !e.target.closest('.vis-network')) {
                        hideContextMenu();
                    }
                });
                
                Swal.close();

            } catch (error) {
                console.error('Error :c : ', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error al inicializar la visualización del Slice',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    customClass: {
                        confirmButton: 'btn bg-gradient-primary'
                    },
                    buttonsStyling: false
                });
            }
        } else {
            throw new Error('Error al cargar la data del Slice');
        }
    } catch (error) {
        let errorMessage = 'Error al cargar la Slice';
        try {
            errorMessage = data.message || errorMessage;
        } catch (e) {

        }
        console.error('Error :c : ', error);
        Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'btn bg-gradient-primary'
            },
            buttonsStyling: false
        });
    }
}

// ===================== DATA DEL SLICE =====================
function loadSliceData(data,flag) {
    updateNetworkInfo(data.network_config, data.slice_info);
    loadTopologyVisualization(data.topology_info,data.slice_info,flag);
    updateSliceResources(SLICE_DATA);
}

function updateNetworkInfo(networkConfig, sliceInfo) {
    document.getElementById('sliceName').textContent = sliceInfo.name;
    document.getElementById('sliceId').textContent = sliceInfo.id;
    document.getElementById('sliceStatus').textContent = sliceInfo.status;
    document.getElementById('externalNetwork').textContent = networkConfig.network;
    document.getElementById('VlanId').textContent = networkConfig.svlan_id;
    document.getElementById('networkRangeStart').textContent = networkConfig.dhcp_range[0];
    document.getElementById('networkRangeEnd').textContent = networkConfig.dhcp_range[1];
    document.getElementById('infrastructure').textContent = sliceInfo.infrastructure;

    if (sliceInfo.infrastructure === 'OpenStack') {
        // Colorcito
        document.getElementById('infrastructure').classList.add('text-primary');

        // Mostrar OS ID en lugar de información de red
        document.getElementById('externalNetworkLabel').textContent = 'ID del Proyecto OS:';
        document.getElementById('projectoOSLabel').style.display = 'block';
        document.getElementById('projectoOSId').textContent = sliceInfo.os_id || 'N/A';

        // Ocultar campos de VLAN y rango de red
        document.getElementById('networkRangeContainer').style.display = 'none';
        document.getElementById('svlanLabel').style.display = 'none';
        document.getElementById('redLabel').style.display = 'none';
    } else {
        // Colorcito
        document.getElementById('infrastructure').classList.add('text-success');

        // Para otras infraestructuras, mostrar la información de red normal
        document.getElementById('externalNetworkLabel').textContent = 'Red Externa:';
        document.getElementById('externalNetwork').textContent = networkConfig.network;
        document.getElementById('VlanId').textContent = networkConfig.svlan_id;
        document.getElementById('networkRangeStart').textContent = networkConfig.dhcp_range[0];
        document.getElementById('networkRangeEnd').textContent = networkConfig.dhcp_range[1];
        
        // Mostrar campos de VLAN y rango de red
        document.getElementById('vlanContainer').style.display = 'block';
        document.getElementById('networkRangeContainer').style.display = 'block';
    }

    const stopSliceBtn = document.querySelector('[onclick="stopSlice()"]');
    if (stopSliceBtn) {
        if (sliceInfo.status === 'stopped') {
            stopSliceBtn.style.pointerEvents = 'none';
            stopSliceBtn.style.opacity = '0.25';
            stopSliceBtn.classList.remove('bg-gradient-danger');
            stopSliceBtn.classList.add('bg-gradient-secondary');
            stopSliceBtn.title = 'La Slice ya está detenida';
        } else {
            stopSliceBtn.style.pointerEvents = 'auto';
            stopSliceBtn.style.opacity = '1';
            stopSliceBtn.classList.remove('bg-gradient-secondary');
            stopSliceBtn.classList.add('bg-gradient-danger');
            stopSliceBtn.title = 'Detener Slice';
        }
    }

    const restartSliceBtn = document.querySelector('[onclick="restartSlice()"]');

    if (restartSliceBtn) {
        if (sliceInfo.status === 'stopped') {
            restartSliceBtn.style.pointerEvents = 'none';
            restartSliceBtn.style.opacity = '0.25';
            restartSliceBtn.classList.remove('btn-orange');
            restartSliceBtn.classList.add('btn-secondary');
            restartSliceBtn.title = 'La Slice ya está detenida';
        } else {
            restartSliceBtn.style.pointerEvents = 'auto';
            restartSliceBtn.style.opacity = '1';
            restartSliceBtn.classList.remove('btn-secondary');
            restartSliceBtn.classList.add('btn-orange');
            restartSliceBtn.title = 'Reiniciar Slice';
        }
    }

    const statusBadge = document.getElementById('sliceStatus');
    statusBadge.textContent = sliceInfo.status === 'running' ? 'En ejecución' : sliceInfo.status === 'stopped' ? 'Detenido' : 'Desconocido';
    statusBadge.className = `badge bg-gradient-${sliceInfo.status === 'running' ? 'warning' : sliceInfo.status === 'stopped' ? 'danger' : 'info'} mt-2`;
}

function loadTopologyVisualization(topology,sliceInfo,flag) {

    // Guardar posiciones actuales si flag es false
    let oldPositions = {};
    let oldEdgeShapes = {};
    if (!flag && network) {
        oldPositions = network.getPositions();
        // Guardar formas de los enlaces
        visDataset.edges.forEach(edge => {
            const edgeData = network.body.edges[edge.id];
            if (edgeData) {
                oldEdgeShapes[edge.id] = {
                    smooth: {
                        type: edgeData.options.smooth.type,
                        roundness: edgeData.options.smooth.roundness,
                        enabled: edgeData.options.smooth.enabled
                    }
                };
            }
        });
    }

    visDataset.nodes.clear();
    visDataset.edges.clear();
    
    const isStopped = sliceInfo.status === 'stopped';

    topology.vms.forEach(vm => {
        try {
            console.log(vm)
            // Configurar estilo especial para VMs pausadas
            const isPaused = vm.status === 'paused' || vm.status === 'stopped';
            const tooltipContent = generateVMTooltip(vm);
            nodeTooltips.set(vm.id, tooltipContent);
            const nodeConfig = {
                id: vm.id,
                label: vm.name,
                title: undefined,
                size: 30,
                // Aplicar estilos condicionales si está pausada
                font: {
                    ...options.nodes.font,
                    color: '#000000',
                    strokeWidth: isPaused ? 3 : 4,
                    strokeColor: '#ffffff'
                },
                shadow: {
                    enabled: true,
                    color: isPaused ? '#F44335' : '#fb8c00',
                    size: isPaused ? 30 : 32,
                    x: isPaused ? 7 : 6,
                    y: isPaused ? 7 : 6
                },
                chosen: {
                    node: function(values, id, selected, hovering) {
                        if (hovering || selected) {
                            values.shadow = true;
                            values.shadowColor = isPaused ? "#F44335" : '#fb8c00';
                            values.shadowSize = 36;
                        }
                    }
                },
            };
            
            // Restaurar posición anterior si existe
            if (!flag && oldPositions[vm.id]) {
                nodeConfig.x = oldPositions[vm.id].x;
                nodeConfig.y = oldPositions[vm.id].y;
                nodeConfig.fixed = true;
                console.log(`Restaurando posición para VM ${vm.id}:`, {
                    x: nodeConfig.x.toFixed(2),
                    y: nodeConfig.y.toFixed(2)
                });
            }

            visDataset.nodes.add(nodeConfig);
        } catch (error) {
            console.error('Error: ', error);
        }
    });


    let addedEdges = 0;
    const processedLinks = new Set();
    
    topology.interfaces.forEach(iface => {
        if (iface.link_id && !processedLinks.has(iface.link_id)) {
            const pairedInterface = topology.interfaces.find(i => 
                i.link_id === iface.link_id && i.vm_id !== iface.vm_id
            );
            
            if (pairedInterface) {
                const link = topology.links.find(l => l.id === iface.link_id);
                try {
                    const tooltipContent = generateLinkTooltip(link, [iface, pairedInterface]);
                    edgeTooltips.set(iface.link_id, tooltipContent);
                    const edgeConfig = {
                        id: iface.link_id,
                        from: iface.vm_id,
                        to: pairedInterface.vm_id,
                        label: link ? link.name : '',
                        title: undefined,
                        color: {
                            color: '#000000',
                            highlight: isStopped ? "#F44335" : '#fb8c00',
                            hover: isStopped ? "#F44335" : '#fb8c00',
                            opacity: 0.8,
                        }
                    };

                    // Restaurar forma del enlace si existe
                    if (!flag && oldEdgeShapes[iface.link_id]) {
                        edgeConfig.smooth = oldEdgeShapes[iface.link_id].smooth;
                    }

                    visDataset.edges.add(edgeConfig);
                    addedEdges++;
                    processedLinks.add(iface.link_id);
                } catch (error) {
                    console.error('Error: ', error);
                }
            }
        }
    });
    
    if (flag) {
        arrangeTopology();
    } else {
        // Asegurar que las posiciones se mantengan por un momento antes de liberar
        setTimeout(() => {
            const nodes = visDataset.nodes.get();
            nodes.forEach(node => {
                if (oldPositions[node.id]) {
                    network.moveNode(node.id, oldPositions[node.id].x, oldPositions[node.id].y);
                }
                visDataset.nodes.update({
                    id: node.id,
                    fixed: false
                });
            });
        }, 100);
    }
}

// ===================== VISUALIZACIÓN DE INFORMACIÓN =====================
function showVMInfo(vmId) {
    hideTooltip()
    const vm = SLICE_DATA.content.topology_info.vms.find(v => v.id === vmId);
    if (!vm) {
        console.error('VM no encontrada: ', vmId);
        return;
    }

    try {
        let vmInfoModal = bootstrap.Modal.getInstance(document.getElementById('vmInfoModal'));
        if (!vmInfoModal) {
            vmInfoModal = new bootstrap.Modal(document.getElementById('vmInfoModal'));
        }

        const imageFound = AVAILABLE_IMAGES.find(img => img.id === vm.image_id);
        const flavorFound = AVAILABLE_FLAVORS.find(f => f.id === vm.flavor_id);
        const image = imageFound || { name: vm.image_id };
        const flavor = flavorFound || {
            name: vm.flavor_id,
            ram: "-",
            vcpus: "-",
            disk: "-"
        };

        const isOpenStack = SLICE_DATA.content.slice_info.infrastructure === 'OpenStack';

        // Información básica
        document.getElementById('vmModalId').textContent = vm.id;
        document.getElementById('vmModalName').textContent = vm.name;
        document.getElementById('vmModalImage').textContent = image.name;
        document.getElementById('vmModalFlavorName').textContent = flavor.name;
        
        // Mostrar u ocultar OS ID según la infraestructura
        const osIdContainer = document.getElementById('vmModalOsIdContainer');
        if (isOpenStack) {
            document.getElementById('vmModalOsId').textContent = vm.os_id || 'N/A';
            osIdContainer.style.display = 'block';
        } else {
            osIdContainer.style.display = 'none';
        }

        const instanceContainer = document.getElementById('vmModalInstanceContainer');
        if (isOpenStack) {
            document.getElementById('vmModalInstance').textContent = vm.os_instance_name || 'N/A';
            instanceContainer.style.display = 'block';
        } else {
            instanceContainer.style.display = 'none';
        }
        
        // Status badge
        document.getElementById('vmModalStatus').innerHTML = 
            `<span class="badge bg-gradient-${vm.status === 'running' ? 'warning' : 'danger'}">
                ${vm.status === 'running' ? 'En ejecución' : 'Apagado'}
             </span>`;

        // External access badge
        const hasExtAccess = hasExternalAccess(vm.id);
        document.getElementById('vmModalExternalAccess').innerHTML = 
            `<span class="badge bg-gradient-${hasExtAccess ? 'info' : 'secondary'}">
                ${hasExtAccess ? 'Con acceso externo' : 'Sin acceso externo'}
             </span>`;

        // Physical server y información adicional
        document.getElementById('vmModalPhysicalServer').textContent = 
            `${vm.physical_server.name} (ID: ${vm.physical_server.id})`;
        
        // Mostrar u ocultar QEMU PID según la infraestructura
        const qemuPidContainer = document.getElementById('vmModalQemuPidContainer');
        if (isOpenStack) {
            qemuPidContainer.style.display = 'none';
        } else {
            document.getElementById('vmModalQemuPid').textContent = vm.qemu_pid || 'N/A';
            qemuPidContainer.style.display = 'block';
        }
        
        document.getElementById('vmModalVncDisplay').textContent = vm.vnc_display ?? 'N/A';
        
        // SSH Info
        let sshIp = 'N/A';
        const vmInterfaces = SLICE_DATA.content.topology_info.interfaces.filter(i => i.vm_id === vmId);
        if (vmInterfaces && vmInterfaces.length > 0) {
            const externalInterface = vmInterfaces.find(iface => iface.external_access);
            if (externalInterface && externalInterface.ip) {
                sshIp = externalInterface.ip;
            }
        }
        document.getElementById('vmModalSshIp').textContent = sshIp;

        // Resources
        document.getElementById('vmModalRAM').textContent = `${flavor.ram} MB`;
        document.getElementById('vmModalCPUs').textContent = flavor.vcpus;
        document.getElementById('vmModalDisk').textContent = `${flavor.disk} GB`;

        const interfaces = SLICE_DATA.content.topology_info.interfaces.filter(i => i.vm_id === vmId);
        const interfacesBody = document.getElementById('vmModalInterfaces');
        interfacesBody.innerHTML = '';
        
        interfaces.forEach(iface => {
            const link = SLICE_DATA.content.topology_info.links.find(l => l.id === iface.link_id);
            const connectedVM = iface.external_access ? null : 
                SLICE_DATA.content.topology_info.vms.find(v => {
                    return SLICE_DATA.content.topology_info.interfaces.some(i => 
                        i.link_id === iface.link_id && i.vm_id === v.id && i.vm_id !== vmId
                    );
                });
            
            // Usar 'name' en lugar de 'tap_name' para OpenStack
            const interfaceName = isOpenStack ? iface.name : iface.tap_name;

            // Security Group info (puedes guardar el id en iface.security_group_id si lo tienes)
            let sgBtn = `
                <button class="mb-0 btn btn-link text-dark action-btn manage-sg" 
                    title="Gestionar"
                    onclick="openInterfaceSGModal(
                        ${iface.id},
                        '${iface.os_id ? iface.os_id : ''}',
                        '${isOpenStack ? (iface.name || '') : ''}',
                        '${!isOpenStack ? (iface.tap_name || '') : ''}',
                        '${iface.mac_address || ''}'
                    )">
                    <i class="fas fa-gear me-4"></i>
                </button>
            `;
            
            // Generar tooltip SOLO para la columna de interfaz
            let interfaceTooltip = `ID: ${iface.id}`;
            if (isOpenStack && iface.os_id) {
                interfaceTooltip += `\nOS ID: ${iface.os_id}`;
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-xs ps-4">
                    <p class="text-secondary mb-0 text-x cursor-help" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top" 
                    data-bs-html="true"
                    title="${interfaceTooltip.replace(/\n/g, '<br>')}">${interfaceName}</p>
                </td>
                <td class="text-xs ps-4">
                    <p class="text-secondary mb-0 text-x">${iface.mac_address}</p>
                </td>
                <td class="text ps-4">
                    ${iface.external_access ? 
                        '<span class="badge bg-gradient-info">Externo</span>' : 
                        `<span class="badge bg-gradient-secondary">${link ? link.name : '-'}</span>`
                    }
                </td>
                <td class="text-x ps-4">
                    ${connectedVM ? connectedVM.name : (iface.external_access ? 'Red Externa' : '-')}
                </td>
                <td class="text-x ps-4 text-center">
                    ${sgBtn}
                </td>
            `;
            interfacesBody.appendChild(row);
        });

        // Actualizar estado del botón de apagado/encendido
        const toggleButton = document.getElementById('vmToggleButton');
        const toggleIcon = document.getElementById('vmToggleIcon');
        const toggleText = document.getElementById('vmToggleText');
        
        if (vm.status === 'paused') {
            toggleButton.classList.remove('bg-gradient-danger');
            toggleButton.classList.add('bg-gradient-warning');
            toggleIcon.textContent = 'play_arrow';
            toggleText.textContent = 'Encender VM';
        } else {
            toggleButton.classList.remove('bg-gradient-warning');
            toggleButton.classList.add('bg-gradient-danger');
            toggleIcon.textContent = 'pause';
            toggleText.textContent = 'Apagar VM';
        }

        const isSliceStopped = SLICE_DATA.content.slice_info.status === 'stopped';
        
        toggleButton.setAttribute('data-vm-id', vm.id);
        
        // Agregar botón de reinicio
        const restartButton = document.getElementById('vmRestartButton');
        if (isSliceStopped || vm.status !== 'running') {
            restartButton.classList.remove('btn-orange');
            restartButton.classList.add('btn-secondary');
            restartButton.style.pointerEvents = 'none';
            restartButton.style.opacity = '0.25';
            restartButton.title = 'Solo se puede reiniciar una VM mientras la Slice está en ejecución';
        } else {
            restartButton.classList.remove('btn-secondary');
            restartButton.classList.add('btn-orange');
            restartButton.style.pointerEvents = 'auto';
            restartButton.style.opacity = '1';
            restartButton.title = 'Reiniciar VM';
            restartButton.setAttribute('data-vm-id', vm.id);
        }
        
        // Deshabilitar botones si la slice está detenida
        if (isSliceStopped) {
            toggleButton.classList.add('bg-gradient-secondary');
            toggleButton.style.pointerEvents = 'none';
            toggleButton.style.opacity = '0.25';
        } else {
            toggleButton.style.pointerEvents = 'auto';
            toggleButton.style.opacity = '1';
        }

        // Actualizar botón de consola VNC
        const vncButton = document.getElementById('vmVNCButton');
        
        if (isSliceStopped || vm.status !== 'running') {
            vncButton.classList.remove('bg-gradient-info');
            vncButton.classList.add('bg-gradient-secondary');
            vncButton.style.pointerEvents = 'none';
            vncButton.style.opacity = '0.25';
            vncButton.title = 'Solo se puede acceder a la consola VNC mientras la VM y Slice están en ejecución';
        } else {
            vncButton.classList.remove('bg-gradient-secondary');
            vncButton.classList.add('bg-gradient-info');
            vncButton.style.pointerEvents = 'auto';
            vncButton.style.opacity = '1';
            vncButton.title = 'Abrir consola VNC';
            vncButton.setAttribute('data-vm-id', vm.id);
            vncButton.onclick = () => openVNCConsole(vm.id);
        }

        setTimeout(() => {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('#vmInfoModal [data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                // Destruir tooltip existente si existe
                const existingTooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
                if (existingTooltip) {
                    existingTooltip.dispose();
                }
                // Crear nuevo tooltip
                return new bootstrap.Tooltip(tooltipTriggerEl, {
                    trigger: 'hover',
                    container: 'body',
                    html: true
                });
            });
        }, 100);

        vmInfoModal.show();

    } catch (error) {
        console.error('Error: ', error);
    }
}

function generateVMTooltip(vm) {
    const imageFound = AVAILABLE_IMAGES.find(img => img.id === vm.image_id);
    const flavorFound = AVAILABLE_FLAVORS.find(f => f.id === vm.flavor_id);
    const imageName = imageFound ? imageFound.name 
        : vm.image_id;
    const flavorName = flavorFound ? flavorFound.name : vm.flavor_id;
    
    return `<b>ID:</b> ${vm.id}
    <b>Nombre:</b> ${vm.name}
    <b>Imagen:</b> ${imageName}
    <b>Flavor:</b> ${flavorName}
    <b>Servidor Físico:</b> ${vm.physical_server.name}
    <b>Acceso externo:</b> ${hasExternalAccess(vm.id) ? 'Sí' : 'No'}`;
}

function generateLinkTooltip(link, interfaces) {
    const vm1 = SLICE_DATA.content.topology_info.vms.find(v => v.id === interfaces[0].vm_id);
    const vm2 = SLICE_DATA.content.topology_info.vms.find(v => v.id === interfaces[1].vm_id);
    
    return `<b> ID:</b> ${link.id}
    <b>Nombre:</b> ${link.name}
    <b>Conexión:</b> ${vm1.name} ↔ ${vm2.name}
    <b>Interface 1:</b> ${interfaces[0].tap_name} (${interfaces[0].mac_address})
    <b>Interface 2:</b> ${interfaces[1].tap_name} (${interfaces[1].mac_address})
    `;
}

function cleanupTooltips(modalId) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll(`#${modalId} [data-bs-toggle="tooltip"]`));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        const existingTooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
        if (existingTooltip) {
            existingTooltip.dispose();
        }
    });
}

function hasExternalAccess(vmId) {
    return Array.from(SLICE_DATA.content.topology_info.interfaces.values())
        .some(iface => iface.vm_id === vmId && iface.external_access);
}

function showLinkInfo(linkId) {
    hideTooltip()
    const link = SLICE_DATA.content.topology_info.links.find(l => l.id === linkId);
    if (!link) {
        console.error('Link no encontrado: ', linkId);
        return;
    }

    try {
        let linkInfoModal = bootstrap.Modal.getInstance(document.getElementById('linkInfoModal'));
        if (!linkInfoModal) {
            linkInfoModal = new bootstrap.Modal(document.getElementById('linkInfoModal'));
        }

        const isOpenStack = SLICE_DATA.content.slice_info.infrastructure === 'OpenStack';

        // Información básica
        document.getElementById('linkModalId').textContent = link.id;
        document.getElementById('linkModalName').textContent = link.name;
        document.getElementById('linkModalCVLAN').textContent = `CVLAN: ${link.cvlan_id}`;

        // Mostrar u ocultar OS ID según la infraestructura
        const linkOsIdContainer = document.getElementById('linkModalOsIdContainer');
        if (isOpenStack) {
            document.getElementById('linkModalOsId').textContent = link.os_id || 'N/A';
            linkOsIdContainer.style.display = 'block';
        } else {
            linkOsIdContainer.style.display = 'none';
        }

        // Obtener interfaces conectadas
        const connectedInterfaces = SLICE_DATA.content.topology_info.interfaces.filter(i => i.link_id === link.id);
        const vms = SLICE_DATA.content.topology_info.vms;

        // Lista de VMs conectadas para mostrar en "Conecta:"
        const connectedVMs = connectedInterfaces.map(iface => {
            const vm = vms.find(v => v.id === iface.vm_id);
            return vm ? vm.name : 'Unknown VM';
        });
        document.getElementById('linkModalConnects').textContent = connectedVMs.join(' ⟷ ');

        // Actualizar tabla de interfaces
        const interfacesBody = document.getElementById('linkModalInterfaces');
        interfacesBody.innerHTML = '';

        connectedInterfaces.forEach(iface => {
            const vm = vms.find(v => v.id === iface.vm_id);
            // Usar 'name' en lugar de 'tap_name' para OpenStack
            const interfaceName = isOpenStack ? iface.name : iface.tap_name;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-md ps-4">
                    <p class="text-secondary mb-0">${vm ? vm.name : '-'}</p>
                </td>
                <td class="text-md ps-4">
                    <p class="text-secondary mb-0">${iface.mac_address}</p>
                </td>
                <td class="text-md ps-4">
                    <span class="badge bg-gradient-secondary">${interfaceName}</span>
                </td>
            `;
            interfacesBody.appendChild(row);
        });

        linkInfoModal.show();

    } catch (error) {
        console.error('Error mostrando información del enlace: ', error);
    }
}

function hideTooltip() {
    network.selectNodes([]);
    const tooltip = document.getElementById('customTooltip');
    if (tooltip) {
        tooltip.classList.remove("animate__jackInTheBox");
        tooltip.classList.add("animate__fadeOut");
        tooltip.style.display = "none";
    }
}

function showSliceDetail() {
    hideTooltip()
    try {
        const sliceInfo = SLICE_DATA.content.slice_info;
        const networkConfig = SLICE_DATA.content.network_config;
        const topology = SLICE_DATA.content.topology_info;
        const isOpenStack = sliceInfo.infrastructure === 'OpenStack';

        // Información básica
        document.getElementById('sliceModalId').textContent = sliceInfo.id;
        document.getElementById('sliceModalName').textContent = sliceInfo.name;
        document.getElementById('sliceModalDescription').textContent = sliceInfo.description == null ? "N/A" : sliceInfo.description;
        document.getElementById('sliceModalInfrastructure').textContent = sliceInfo.infrastructure;
        
        // Mostrar u ocultar OS ID según la infraestructura
        const sliceOsIdContainer = document.getElementById('sliceModalOsIdContainer');
        if (isOpenStack) {
            document.getElementById('sliceModalOsId').textContent = sliceInfo.os_id || 'N/A';
            sliceOsIdContainer.style.display = 'block';
        } else {
            sliceOsIdContainer.style.display = 'none';
        }
        
        // Status badge
        const statusBadge = document.getElementById('sliceModalStatus');
        statusBadge.textContent = sliceInfo.status === 'running' ? 'En ejecución' : 'Detenido';
        statusBadge.className = `badge bg-gradient-${sliceInfo.status === 'running' ? 'warning' : 'danger'}`;

        // Contadores
        document.getElementById('sliceModalVMCount').textContent = topology.vms.length;
        document.getElementById('sliceModalInterfaceCount').textContent = topology.interfaces.length;
        document.getElementById('sliceModalLinkCount').textContent = topology.links.length;
        const uniqueWorkers = new Set(
            topology.vms.map(vm => vm.physical_server.id)
        );
        document.getElementById('sliceModalWorkerCount').textContent = uniqueWorkers.size;

        // Mostrar u ocultar configuración de red según la infraestructura y tipo de infraestructura
        const networkConfigCard = document.getElementById('networkConfigCard');
        if (isOpenStack) {
            document.getElementById('sliceModalInfrastructure').classList.add('text-primary');
            networkConfigCard.style.display = 'none';
        } else {
            document.getElementById('sliceModalInfrastructure').classList.add('text-success');
            networkConfigCard.style.display = 'block';
            
            // Network Config (solo para no-OpenStack)
            document.getElementById('sliceModalBridgeName').textContent = networkConfig.slice_bridge_name;
            document.getElementById('sliceModalSVLAN').textContent = networkConfig.svlan_id;
            document.getElementById('sliceModalNetwork').textContent = networkConfig.network;
            document.getElementById('sliceModalDHCPInterface').textContent = networkConfig.dhcp_interface;
            document.getElementById('sliceModalGatewayInterface').textContent = networkConfig.gateway_interface;
            document.getElementById('sliceModalPatchInt').textContent = networkConfig.patch_ports.int_side;
            document.getElementById('sliceModalPatchSlice').textContent = networkConfig.patch_ports.slice_side;
            document.getElementById('sliceModalDHCPStart').textContent = networkConfig.dhcp_range[0];
            document.getElementById('sliceModalDHCPEnd').textContent = networkConfig.dhcp_range[1];
        }

    } catch (error) {
        console.error('Error mostrando detalles del slice:', error);
    }
}


// ===================== ACCIONES =====================

function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function arrangeTopology() {
    if (!network || visDataset.nodes.length === 0) return;

    network.setOptions({
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -15000,  
                centralGravity: 0.3,          
                springLength: 150,          
                springConstant: 0.08,      
                damping: 0.09
            },
            repulsion: {
                nodeDistance: 150           
            },
            solver: 'barnesHut',
            stabilization: {
                enabled: true,
                iterations: 100,              
                updateInterval: 25,
                onlyDynamicEdges: false,
                fit: true
            }
        },
        layout: {
            improvedLayout: true,
            randomSeed: 42
        }
    });

    network.stabilize(150);

    setTimeout(() => {
        const positions = network.getPositions();
        const nodeIds = Object.keys(positions);
        
        nodeIds.forEach((nodeId, i) => {
            const pos = positions[nodeId];
            let overlapping = true;
            let attempts = 0;
            const maxAttempts = 20;
            
            while (overlapping && attempts < maxAttempts) {
                overlapping = nodeIds.some((otherId, j) => {
                    if (i === j) return false;
                    const otherPos = positions[otherId];
                    const dx = pos.x - otherPos.x;
                    const dy = pos.y - otherPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance < 100; 
                });
                
                if (overlapping) {
                    const angle = 2 * Math.PI * Math.random();
                    pos.x += Math.cos(angle) * 25; // Reducido de 50 a 25
                    pos.y += Math.sin(angle) * 25; // Reducido de 50 a 25
                    network.moveNode(nodeId, pos.x, pos.y);
                }
                attempts++;
            }
        });

        network.setOptions({ physics: { enabled: false } });
        
        network.fit({
            animation: {
                duration: 500,
                easingFunction: 'easeOutQuad'
            }
        });
    }, 500);
}

window.autoArrangeTopology = function() {
    arrangeTopology();
}

window.toggleVMState = async function (vmId) {
    const vm = SLICE_DATA.content.topology_info.vms.find(v => v.id === parseInt(vmId));
    if (!vm) return;

    const isPaused = vm.status === 'paused';
    const endpoint = `/User/api/slice/vm/${vmId}/${isPaused ? 'resume' : 'pause'}`;

    // Confirmación inicial
    const result = await Swal.fire({
        title: isPaused ? '¿Encender VM?' : '¿Apagar VM?',
        text: isPaused ? 
            'La máquina virtual se encenderá y estará disponible nuevamente.' : 
            'La máquina virtual se apagará. Sus datos en disco se mantendrán intactos, pero puede que la configuración realizada no persista.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: isPaused ? 'Sí, encender' : 'Sí, apagar',
        cancelButtonText: 'Cancelar',
        customClass: {
            confirmButton: `btn bg-gradient-${isPaused ? 'warning' : 'danger'}`,
            cancelButton: 'btn bg-gradient-secondary ms-2'
        },
        buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
        Swal.fire({
            title: isPaused ? 'Encendiendo VM...' : 'Apagando VM...',
            text: 'Por favor espere...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(endpoint, {
            method: 'POST'
        });

        const data = await response.json();

        console.log('Respuesta: ', data);

        if (data.status === 'success') {
            
            closeAllModals();

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: data.message,
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });

            // Actualizar datos del slice después de un breve delay
            setTimeout(() => {
                getSliceData(false);
            }, 1000);

        } else {
            throw {
                message: data.message || 'Ocurrió un error',
                details: data.details || [],
                response: data
            };
        }
    } catch (error) {
        console.error('Error:', error);
        await showErrorAlert(error);
    }
}

function closeAllModals() {
    // Obtener todos los modales activos
    const modals = ['vmInfoModal', 'linkInfoModal', 'sliceDetailModal'].map(id => {
        const element = document.getElementById(id);
        return element ? bootstrap.Modal.getInstance(element) : null;
    }).filter(modal => modal !== null);

    // Cerrar cada modal
    modals.forEach(modal => {
        try {
            modal.hide();
        } catch (error) {
            console.warn(`Error cerrando modal: ${error}`);
        }
    });
}

async function openVNCConsole(vmId) {
    if (!vmId) {
        console.error('VM ID no proporcionada para la consola VNC');
        return;
    }

    try {
        Swal.fire({
            title: 'Conectando...',
            text: 'Estableciendo conexión con la consola VNC',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 1. Obtener el token
        const tokenResponse = await fetch(`/User/api/vnc/vm/${vmId}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const tokenData = await tokenResponse.json();
        console.log('Token Response:', tokenData);

        if (tokenData.status !== 'success') {
            throw new Error(tokenData.message || 'Error al obtener token VNC');
        }

        // 2. Usar la URL proporcionada directamente por el backend
        const vncUrl = tokenData.content.url;
        if (!vncUrl) {
            throw new Error('URL de VNC no proporcionada por el servidor');
        }

        // 3. Abrir la ventana VNC con la URL completa
        const fullVncUrl = `/VNC/vm/${vmId}?token=${tokenData.content.token}`;
        const vncWindow = window.open(fullVncUrl, '_blank');
        
        Swal.close();

    } catch (error) {
        console.error('Error VNC:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo establecer la conexión VNC: ' + (error.message || 'Error desconocido'),
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'btn bg-gradient-primary'
            },
            buttonsStyling: false
        });
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


window.exportTopology = function() {
    const nodes = visDataset.nodes.get();
    const edges = visDataset.edges.get();
    
    const topology = {
        topology_info: {
            vms: [],
            links: [],
            interfaces: []
        },
        topology_graph: {
            nodes: [],
            edges: []
        }
    };

    const vmIdMap = {};
    const linkIdMap = {};
    
    nodes.forEach((node, index) => {
        const newVmId = generateUUID();
        vmIdMap[node.id] = newVmId;
        const originalVM = SLICE_DATA.content.topology_info.vms.find(v => v.id === node.id);
        const hasExtAccess = hasExternalAccess(node.id);
        const vm = {
            id: newVmId,
            name: `VM-${index + 1}`,
            physical_server: {
                id: originalVM.physical_server.id,
                name: originalVM.physical_server.name
            },
            image_id: originalVM.image_id,
            flavor_id: originalVM.flavor_id
        };
        const graphNode = {
            id: newVmId,
            label: `VM-${index + 1}`,
            title: generateVMTooltip(vm)
        };

        topology.topology_info.vms.push(vm);
        topology.topology_graph.nodes.push(graphNode);

        if (hasExtAccess) {
            const exthInterface = {
                id: generateUUID(),
                name: "exth",
                vm_id: newVmId,
                link_id: null,
                mac_address: null,
                external_access: true
            };
            topology.topology_info.interfaces.push(exthInterface);
        }
    });

    edges.forEach((edge, index) => {
        const newLinkId = generateUUID();
        linkIdMap[edge.id] = newLinkId;
        const link = {
            id: newLinkId,
            name: `Enlace-${index + 1}`
        };
        const graphEdge = {
            id: newLinkId,
            from: vmIdMap[edge.from],
            to: vmIdMap[edge.to],
            label: `Enlace-${index + 1}`
        };

        topology.topology_info.links.push(link);
        topology.topology_graph.edges.push(graphEdge);
    });

    nodes.forEach(node => {
        const vmId = vmIdMap[node.id];
        const connectedEdges = edges.filter(e => e.from === node.id || e.to === node.id);
        let ifCount = 0;

        connectedEdges.forEach(edge => {
            ifCount++;
            const interfaceInfo = {
                id: generateUUID(),
                name: `if-${ifCount}`,
                vm_id: vmId,
                link_id: linkIdMap[edge.id],
                mac_address: null,
                external_access: false
            };
            topology.topology_info.interfaces.push(interfaceInfo);
        });
    });

    const dataStr = JSON.stringify(topology, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `topology-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

window.refreshSliceInfo = function() {
    getSliceData(false);
}

window.restartSlice = function() {
    Swal.fire({
        title: '¿Reiniciar Slice?',
        text: 'Todas las VMs serán reiniciadas. Este proceso puede tomar un tiempo.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, reiniciar',
        cancelButtonText: 'Cancelar',
        customClass: {
            confirmButton: 'btn btn-orange',
            cancelButton: 'btn bg-gradient-secondary ms-2'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            const sliceId = SLICE_DATA.content.slice_info.id;
            
            Swal.fire({
                title: 'Reiniciando Slice',
                text: 'Por favor espera mientras se reinician todas las VMs...',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            fetch(`/User/api/slice/${sliceId}/restart`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Respuesta: ', data);

                if (data.status === 'success') {
                    const successMessage = data.message || 'Slice reiniciada correctamente';
                    Swal.fire({
                        title: 'Éxito',
                        text: successMessage,
                        icon: 'success',
                        timer: 2000,
                        timerProgressBar: true,
                        showConfirmButton: false
                    });
                    
                    // Actualizar información después de un breve delay
                    setTimeout(() => {
                        getSliceData(false);
                    }, 1500);
                } else {
                    throw {
                        message: data.message || 'Error al reiniciar la Slice',
                        details: data.details || [],
                        response: data
                    };
                }
            })
            .catch(async error => {
                console.error('Error:', error);
                await showErrorAlert(error);
            });
        }
    });
}

window.stopSlice = function() {
    Swal.fire({
        title: '¿Detener Slice?',
        text: '¿Estás seguro de que deseas detener esta Slice? Todas las VMs serán apagadas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, detener',
        cancelButtonText: 'Cancelar',
        customClass: {
            confirmButton: 'btn bg-gradient-danger',
            cancelButton: 'btn bg-gradient-secondary ms-2'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            const sliceId = SLICE_DATA.content.slice_info.id;

            Swal.fire({
                title: 'Deteniendo Slice',
                text: 'Por favor espera mientras se detiene la Slice...',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            fetch(`/User/api/slice/${sliceId}/stop`, {
                method: 'POST'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Respuesta: ', data);

                    if (data.status === 'success') {
                        const successMessage = data.message || 'Slice detenida correctamente';
                        Swal.fire({
                            title: 'Éxito',
                            text: successMessage,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                            timerProgressBar: true
                        });

                        // Actualizar información después de un breve delay
                        setTimeout(() => {
                            getSliceData(false);
                        }, 1500);
                    } else {
                        throw {
                            message: data.message || 'Error al detener la Slice',
                            details: data.details || [],
                            response: data
                        };
                    }
                })
                .catch(async error => {
                    console.error('Error:', error);
                    await showErrorAlert(error);
                });
        }
    });
}


window.restartVM = async function(vmId) {
    const vm = SLICE_DATA.content.topology_info.vms.find(v => v.id === parseInt(vmId));
    if (!vm) return;

    // Confirmación inicial
    const result = await Swal.fire({
        title: '¿Reiniciar VM?',
        text: 'La máquina virtual se reiniciará. Este proceso puede tomar unos segundos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, reiniciar',
        cancelButtonText: 'Cancelar',
        customClass: {
            confirmButton: 'btn btn-orange',
            cancelButton: 'btn bg-gradient-secondary ms-2'
        },
        buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
        Swal.fire({
            title: 'Reiniciando VM...',
            text: 'Por favor espere...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/User/api/slice/vm/${vmId}/restart`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.status === 'success') {
            const successMessage = data.message || 'VM reiniciada correctamente';
            Swal.fire({
                title: 'Éxito',
                text: successMessage,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                timerProgressBar: true
            });

            // Actualizar información después de un breve delay
            setTimeout(() => {
                getSliceData(false);
            }, 1500);
        } else {
            throw {
                message: data.message || 'Error al reiniciar la VM',
                details: data.details || [],
                response: data
            };
        }
    } catch (error) {
        console.error('Error:', error);
        await showErrorAlert(error);
    }
}

function updateSliceResources(sliceData) {
    let totalVCPUs = 0;
    let totalRAM = 0;
    let totalDisk = 0;

    sliceData.content.topology_info.vms.forEach(vm => {
        const flavor = AVAILABLE_FLAVORS.find(f => f.id === parseInt(vm.flavor_id));
        if (flavor) {
            totalVCPUs += Number(flavor.vcpus) || 0;
            totalRAM += Number(flavor.ram) || 0;
            totalDisk += Number(flavor.disk) || 0;
        }
    });

    const ramInGB = (totalRAM / 1000).toFixed(3);
    const formattedRAM = parseFloat(ramInGB).toString();

    document.getElementById('sliceModalVCPUs').textContent = totalVCPUs;
    document.getElementById('sliceModalRAM').textContent = `${formattedRAM} GB`;
    document.getElementById('sliceModalDisk').textContent = `${totalDisk} GB`;
}

// Función para cargar los recursos desde el backend
async function loadResources() {
    try {
        // Cargar flavors
        const flavorsResponse = await fetch('/User/api/sketch/resources/flavors');
        const flavorsData = await flavorsResponse.json();
        if (flavorsData.status === 'success') {
            AVAILABLE_FLAVORS = flavorsData.content;
        }

        // Cargar imágenes
        const imagesResponse = await fetch('/User/api/sketch/resources/images');
        const imagesData = await imagesResponse.json();
        if (imagesData.status === 'success') {
            AVAILABLE_IMAGES = imagesData.content;
        }

        console.log('Recursos cargados:', { flavors: AVAILABLE_FLAVORS, images: AVAILABLE_IMAGES });

    } catch (error) {
        console.error('Error cargando recursos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los recursos necesarios',
            confirmButtonText: 'Entendido',
            customClass: {
                confirmButton: 'btn bg-gradient-primary'
            },
            buttonsStyling: false
        });
    }
}

function showContextMenu(vm, event) {
    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;

    event.preventDefault();
    event.stopPropagation(); // Evitar propagación
    
    hideTooltip();
    currentContextNode = vm;
    
    const x = event.clientX;
    const y = event.clientY;
    
    // Remover clases de animación existentes
    contextMenu.classList.remove('animate__fadeOut');
    contextMenu.classList.add('animate__animated', 'animate__jackInTheBox');
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;

    // Asegurarse que el menú no se salga de la ventana
    const rect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
        contextMenu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > viewportHeight) {
        contextMenu.style.top = `${y - rect.height}px`;
    }

    // Actualizar estado de los botones
    const toggleButton = document.getElementById('ctxToggleButton');
    const toggleIcon = document.getElementById('ctxToggleIcon');
    const toggleText = document.getElementById('ctxToggleText');

    if (vm.status === 'running') {
        toggleIcon.textContent = 'pause';
        toggleText.textContent = 'Apagar VM';
    } else {
        toggleIcon.textContent = 'play_arrow';
        toggleText.textContent = 'Encender VM';
    }

    // Deshabilitar botones si el slice está detenido
    const isSliceStopped = SLICE_DATA.content.slice_info.status === 'stopped';
    const buttons = contextMenu.getElementsByTagName('button');
    Array.from(buttons).forEach(button => {
        const buttonId = button.id;
        
        if (isSliceStopped) {
            // Si el slice está detenido, deshabilitar todos los botones
            button.classList.add('disabled');
            button.style.opacity = '0.5';
            button.style.pointerEvents = 'none';
        } else {
            // Si el slice está running, verificar cada botón individualmente
            if (buttonId === 'ctxToggleButton') {
                // El botón de toggle siempre debe estar habilitado si el slice está running
                button.classList.remove('disabled');
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto';
            } else {
                // Para los otros botones (reinicio y VNC), solo habilitar si la VM está running
                if (vm.status === 'running') {
                    button.classList.remove('disabled');
                    button.style.opacity = '1';
                    button.style.pointerEvents = 'auto';
                } else {
                    button.classList.add('disabled');
                    button.style.opacity = '0.5';
                    button.style.pointerEvents = 'none';
                }
            }
        }
    });
}

// Manejo de mensajes de error:

// Manejo de mensajes de error:

function showErrorAlert(error) {
        let errorMessage = '';
        let errorDetails = [];
        console.log('Error recibido:', error);
        
        // LOGS ADICIONALES PARA DEBUG
        console.log('Tipo de error:', typeof error);
        console.log('error.message existe:', !!error.message);
        console.log('error.message valor:', error.message);
        console.log('error.message incluye {:', error.message ? error.message.includes('{') : 'N/A');
        console.log('error.response existe:', !!error.response);
        
        try {
            let errorData = null;
            
            // Caso 1: Error con response object directo
            if (typeof error === 'object' && error.response) {
                console.log('🔍 CASO 1: Error con response object directo');
                console.log('error.response:', error.response);
                
                // NUEVO: Verificar si response.message contiene JSON
                if (error.response.message && error.response.message.includes('{')) {
                    console.log('🔍 CASO 1B: Response.message contiene JSON');
                    let jsonStr = error.response.message;
                    console.log('JSON string desde response.message:', jsonStr);
                    
                    // Aplicar la misma lógica de parsing
                    if (jsonStr.includes('POST request for') || jsonStr.includes('GET request for')) {
                        const jsonMatch = jsonStr.match(/": "(\{.*?\})<EOL>"/);
                        
                        if (jsonMatch && jsonMatch[1]) {
                            jsonStr = jsonMatch[1];
                            console.log('JSON extraído desde response (antes de limpiar):', jsonStr);
                            
                            // Limpiar caracteres de escape y marcadores <EOL>
                            jsonStr = jsonStr
                                .replace(/<EOL>/g, '')
                                .replace(/\\u00([0-9a-fA-F]{2})/g, (match, hex) => {
                                    return String.fromCharCode(parseInt(hex, 16));
                                })
                                .replace(/\\\"/g, '"')
                                .replace(/\\n/g, '\n')
                                .trim();
                            
                            console.log('JSON después de limpieza desde response:', jsonStr);
                            
                            try {
                                errorData = JSON.parse(jsonStr);
                                console.log('JSON parseado exitosamente desde response:', errorData);
                            } catch (parseErr) {
                                console.error('Error parseando JSON desde response:', parseErr);
                                errorData = error.response;
                            }
                        } else {
                            console.log('No se encontró patrón JSON en response.message');
                            errorData = error.response;
                        }
                    } else {
                        errorData = error.response;
                    }
                } else {
                    errorData = error.response;
                }
            } 
            // Caso 2: Error con message que contiene JSON anidado
            else if (error.message && error.message.includes('{')) {
                console.log('🔍 CASO 2: Error con message que contiene JSON anidado');
                let jsonStr = error.message;
                console.log('Mensaje original caso 2:', jsonStr);
                
                // Si el mensaje contiene "POST request for" o "GET request for"
                if (jsonStr.includes('POST request for') || jsonStr.includes('GET request for')) {
                    console.log('🔍 CASO 2A: Contiene POST/GET request');
                    // Buscar el JSON que está entre ": "{...}<EOL>"
                    const jsonMatch = jsonStr.match(/": "(\{.*?\})<EOL>"/);
                    
                    if (jsonMatch && jsonMatch[1]) {
                        jsonStr = jsonMatch[1];
                        console.log('JSON extraído caso 2 (antes de limpiar):', jsonStr);
                        
                        // Limpiar caracteres de escape y marcadores <EOL>
                        jsonStr = jsonStr
                            .replace(/<EOL>/g, '')  // Remover marcadores <EOL>
                            .replace(/\\u00([0-9a-fA-F]{2})/g, (match, hex) => {
                                return String.fromCharCode(parseInt(hex, 16));
                            })
                            .replace(/\\\"/g, '"')    // Reemplazar \" con "
                            .replace(/\\n/g, '\n')    // Reemplazar \n literales
                            .trim();
                        
                        console.log('JSON después de limpieza caso 2:', jsonStr);
                        
                        // Intentar parsear el JSON limpio
                        try {
                            errorData = JSON.parse(jsonStr);
                            console.log('JSON parseado exitosamente caso 2:', errorData);
                        } catch (parseErr) {
                            console.error('Error parseando JSON extraído caso 2:', parseErr);
                            console.error('JSON que se intentó parsear caso 2:', jsonStr);
                            
                            // Extracción manual como fallback
                            try {
                                const messageMatch = jsonStr.match(/"message":\s*"([^"]+)"/);
                                const detailsMatch = jsonStr.match(/"details":\s*\[\s*"([^"]+)"\s*\]/);
                                
                                if (messageMatch) {
                                    errorMessage = messageMatch[1];
                                    if (detailsMatch) {
                                        errorDetails = [detailsMatch[1]];
                                    }
                                    console.log('Extracción manual exitosa caso 2:', { errorMessage, errorDetails });
                                } else {
                                    errorMessage = 'Error de comunicación con el servidor';
                                }
                            } catch (manualErr) {
                                console.error('Error en extracción manual caso 2:', manualErr);
                                errorMessage = 'Error de comunicación con el servidor';
                            }
                        }
                    } else {
                        console.error('No se encontró el patrón JSON en el mensaje caso 2');
                        // Fallback: extraer manualmente del mensaje original
                        try {
                            // Buscar patrones directamente en el mensaje original
                            const messagePattern = /No tienes suficientes recursos disponibles[^"]+/;
                            const detailsPattern = /L[íi]mite de slices[^"]+/;
                            
                            const messageMatch = jsonStr.match(messagePattern);
                            const detailsMatch = jsonStr.match(detailsPattern);
                            
                            if (messageMatch) {
                                errorMessage = messageMatch[0];
                            }
                            if (detailsMatch) {
                                errorDetails = [detailsMatch[0]];
                            }
                            
                            if (!errorMessage) {
                                errorMessage = 'Error de comunicación con el servidor';
                            }
                        } catch (fallbackErr) {
                            console.error('Error en fallback caso 2:', fallbackErr);
                            errorMessage = 'Error de comunicación con el servidor';
                        }
                    }
                } else {
                    console.log('🔍 CASO 2B: JSON directo en message');
                    // Para casos donde el JSON está directamente en el mensaje
                    const startIndex = jsonStr.indexOf('{');
                    const endIndex = jsonStr.lastIndexOf('}') + 1;
                    if (startIndex !== -1 && endIndex > startIndex) {
                        jsonStr = jsonStr.substring(startIndex, endIndex);
                        
                        try {
                            errorData = JSON.parse(jsonStr);
                            console.log('JSON parseado directamente caso 2B:', errorData);
                        } catch (parseErr) {
                            console.error('Error parseando JSON directo caso 2B:', parseErr);
                            errorMessage = 'Error de comunicación con el servidor';
                        }
                    }
                }
            } 
            // Caso 3: Error simple con mensaje directo
            else {
                console.log('🔍 CASO 3: Error simple con mensaje directo');
                errorMessage = error.message || 'Error desconocido';
            }

            // Procesar los datos del error si se pudo parsear
            if (errorData && errorData.message) {
                console.log('✅ Procesando errorData.message:', errorData.message);
                errorMessage = errorData.message;
                
                // Manejar detalles que pueden ser array o string
                if (errorData.details) {
                    if (Array.isArray(errorData.details)) {
                        errorDetails = errorData.details;
                    } else {
                        errorDetails = [errorData.details];
                    }
                    console.log('✅ Detalles procesados:', errorDetails);
                }
            }

            // Si no tenemos mensaje, usar uno por defecto
            if (!errorMessage) {
                errorMessage = 'Se produjo un error inesperado';
            }

            console.log('🎯 Mensaje final procesado:', errorMessage);
            console.log('🎯 Detalles finales procesados:', errorDetails);

            // Crear HTML para los detalles (diseño centrado con icono de círculo rojo)
            const detailsHtml = errorDetails.length > 0
                ? `
                    <div class="mt-3">
                        <hr class="my-2">
                        ${errorDetails.map(detail => `
                            <p class="mb-2 d-flex align-items-center justify-content-center text-danger">
                                <i class="fas fa-exclamation-circle me-2 text-danger"></i>
                                <span class="small">${detail}</span>
                            </p>
                        `).join('')}
                    </div>
                `
                : '';

            return Swal.fire({
                icon: 'error',
                title: 'Error en la Operación',
                html: `
                    <div class="text-center">
                        <p class="mb-2 text-dark">${errorMessage}</p>
                        ${detailsHtml}
                    </div>
                `,
                customClass: {
                    icon: 'border-0',
                    confirmButton: 'btn btn-danger',
                    htmlContainer: 'text-center'
                },
                buttonsStyling: false,
                confirmButtonText: 'Entendido',
                width: '500px'
            });
            
        } catch (parseError) {
            console.error('Error crítico parseando mensaje de error:', parseError);
            return Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Se produjo un error al procesar la respuesta del servidor',
                customClass: {
                    icon: 'border-0',
                    confirmButton: 'btn btn-danger'
                },
                buttonsStyling: false,
                confirmButtonText: 'Entendido'
            });
        }
    }
// ==========
// JWT Token
// ==========

function getAuthToken() {
    try {
        // Obtener desde meta tag
        const tokenMeta = document.querySelector('meta[name="jwt-token"]');
        if (tokenMeta && tokenMeta.content && tokenMeta.content.trim() !== '') {
            console.log('Token obtenido desde meta tag');
            return tokenMeta.content.trim();
        }

        // Obtener desde variable global si está disponible
        if (typeof window.jwtToken !== 'undefined' && window.jwtToken) {
            console.log('Token obtenido desde variable global');
            return window.jwtToken;
        }

        // Intentar desde localStorage como fallback
        const localToken = localStorage.getItem('jwtToken');
        if (localToken) {
            console.log('Token obtenido desde localStorage');
            return localToken;
        }

        console.warn('No se encontró token JWT en ninguna fuente');
        return null;
    } catch (error) {
        console.error('Error obteniendo token de autenticación:', error);
        return null;
    }
}

// ===========
// UTILIDADES
// ===========

// Función genérica para posicionar tooltips
function positionTooltip(tooltip, event, offset = { x: 15, y: -10 }) {
    if (!tooltip) return;

    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'block';
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let mouseX, mouseY;
    
    if (event.pointer && event.pointer.DOM) {
        const canvas = event.pointer.DOM.target;
        const canvasRect = canvas.getBoundingClientRect();
        
        mouseX = event.clientX || (canvasRect.left + event.pointer.DOM.x);
        mouseY = event.clientY || (canvasRect.top + event.pointer.DOM.y);
    } else {

        mouseX = event.clientX;
        mouseY = event.clientY;
    }
    
    let finalX = mouseX + offset.x;
    let finalY = mouseY + offset.y;
    
    if (finalX + tooltipRect.width > viewportWidth) {
        finalX = mouseX - tooltipRect.width - offset.x;
    }
    
    if (finalY + tooltipRect.height > viewportHeight) {
        finalY = mouseY - tooltipRect.height - offset.y;
    }
    
    if (finalX < 0) finalX = 5;
    if (finalY < 0) finalY = 5;
    
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${finalX}px`;
    tooltip.style.top = `${finalY}px`;
    tooltip.style.visibility = 'visible';
    tooltip.style.zIndex = '9999';
}

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu && contextMenu.style.display !== 'none') {
        contextMenu.classList.remove('animate__jackInTheBox');
        contextMenu.classList.add('animate__fadeOut');
        setTimeout(() => {
            contextMenu.style.display = 'none';
            currentContextNode = null;
        }, 1000);
    }
}


// ===================
// SECURITY GROUPS
// ===================

if (!document.getElementById('interfaceSGModal')) {
    $('body').append(`
        <div class="modal fade" id="interfaceSGModal" tabindex="-1" aria-labelledby="interfaceSGModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content border-0">
                    <div class="modal-header bg-gradient-success px-4">
                        <h5 class="modal-title text-white" id="interfaceSGModalLabel">
                            <i class="fas fa-shield me-2"></i>
                            Gestionar Security Group de la Interfaz
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4" id="interfaceSGModalBody">
                        <div class="text-center text-muted">Cargando información...</div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

// Función para abrir el modal y cargar la info de la interfaz y su SG
window.openInterfaceSGModal = async function(interfaceId, osId = '', name = '', tapName = '', mac = '') {
    const $body = $('#interfaceSGModalBody');
    $body.html('<div class="text-center text-muted">Cargando información...</div>');

    try {
        // 1. Obtener SG asignado a la interfaz
        const sgResp = await fetch(`${GATEWAY_URL}/get-security-group-by-interface/${interfaceId}`);
        const sgData = await sgResp.json();
        if (!sgData || sgData.status !== 'success') throw new Error(sgData.message || 'Error al obtener SG');

        const assignedSG = sgData.content && sgData.content.id ? sgData.content : null;

        // 2. Obtener lista de SGs disponibles
        const listResp = await fetch(`${GATEWAY_URL}/list-security-groups`);
        const listData = await listResp.json();
        console.log('Lista de SGs:', listData);
        if (!listData || listData.status !== 'success'){
            showErrorAlert(listData);
            throw new Error(listData.message || 'Error al listar SGs');
        } 

        const availableSGs = listData.content || [];

        let html = `
        <div class="mb-3">
            <div class="card border-0 mb-0">
                <div class="card-body py-3 px-4">
                    <div class="d-flex flex-wrap justify-content-center align-items-center gap-2">
                        <span class="badge bg-gradient-success text-white fs-6 px-3 py-2">
                            <i class="fas fa-network-wired me-2"></i> ID <span class="fw-bold">#${interfaceId}</span>
                        </span>
                        ${osId ? `
                        <span class="badge bg-gradient-secondary text-success fs-6 px-3 py-2">
                            <i class="fas fa-hashtag me-1"></i> OS ID: <span class="fw-bold">${osId}</span>
                        </span>
                        ` : ''}
                        ${name ? `
                        <span class="badge bg-gradient-success text-white fs-6 px-3 py-2">
                            <i class="fas fa-tag me-1"></i> Interfaz: <span class="fw-bold">${name}</span>
                        </span>
                        ` : ''}
                        ${tapName ? `
                        <span class="badge bg-gradient-success text-white fs-6 px-3 py-2">
                            <i class="fas fa-terminal me-1"></i> Interfaz: <span class="fw-bold">${tapName}</span>
                        </span>
                        ` : ''}
                        <span class="badge bg-gradient-success text-white fs-6 px-3 py-2">
                            <i class="fas fa-ethernet me-1"></i> MAC: <span class="fw-bold">${mac || '-'}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;

        if (assignedSG) {
            html += `
                <div class="card border mb-3">
                    <div class="card-body py-3">
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="fw-bold text-success"><i class="fas fa-shield-alt me-1"></i>#${assignedSG.id} ${assignedSG.name}</span>
                                <div class="text-secondary small mt-1">${assignedSG.description || '<span class="text-muted">Sin descripción</span>'}</div>
                                <div class="text-secondary small mt-1 text-bold">N° de Reglas: ${assignedSG.rule_count ?? 0}</div>
                            </div>
                            <div>
                                <button class="mb-0 btn btn-link text-dark action-btn view-rules me-2" title="Ver reglas" onclick="window.open('/User/securityGroup/${assignedSG.id}', '_blank')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="mb-0 btn btn-link text-dark action-btn unassign-sg" title="Desasociar Security Group" onclick="removeSGFromInterface(${interfaceId}, ${assignedSG.id})">
                                    <i class="fas fa-unlink"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="mb-2">
                    <label for="selectSG" class="form-label fw-bold">Asignar Security Group</label>
                    <select id="selectSG" class="form-select" style="width:100%;">
                        <option value="">Selecciona un Security Group...</option>
                        ${availableSGs.map(sg => `
                            <option value="${sg.id}" data-desc="${sg.description || ''}">
                                ${sg.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="modal-footer px-4 mt-3">
                
                    <button class="btn btn-success" id="btnAssignSG" ${availableSGs.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-plus me-1"></i>Asignar
                    </button>
                </div>
            `;
        }

        $body.html(html);

        // Inicializar select2 si hay SGs disponibles
        if (!assignedSG && availableSGs.length > 0) {
            // Inicializar Select2 bonito
            $('#selectSG').select2({
                theme: 'bootstrap-5',
                placeholder: 'Busca y selecciona un grupo',
                allowClear: false,
                width: '100%',
                dropdownParent: $('#interfaceSGModal'),
                minimumResultsForSearch: 0,
                templateResult: formatSGOption,
                templateSelection: formatSGSelection,
                escapeMarkup: function(markup) { return markup; }
            }).on('select2:open', function() {
                document.querySelector('.select2-search__field').focus();
            });
        }

        // Templates para opciones y selección
        function formatSGOption(sg) {
            if (!sg.id) return sg.text;
            const $sg = $(sg.element);
            const desc = $sg.data('desc');
            return $(`
                <div class="d-flex align-items-start p-2">
                    <i class="fas fa-shield-alt text-success mt-1 me-3"></i>
                    <div>
                        <div class="fw-semibold"><span class="text-bold">#${sg.id}</span> ${sg.text.replace(/^\[\d+\]\s*/, '')}</div>
                        ${desc ? `<small class="text-muted d-block">${desc}</small>` : ''}
                    </div>
                </div>
            `);
        }
        function formatSGSelection(sg) {
            if (!sg.id) return sg.text;
            return $(`
                <div class="d-flex align-items-center">
                    <i class="fas fa-shield-alt text-success me-2"></i>
                    <span class="fw-semibold">${sg.text}</span>
                </div>
            `);
        }

        // Asignar SG
        $('#btnAssignSG').off('click').on('click', async function() {
            const sgId = $('#selectSG').val();
            if (!sgId) return;
            $(this).prop('disabled', true).text('Asignando...');
            // Mostrar SweetAlert de carga
            Swal.fire({
                title: 'Asignando Security Group...',
                text: 'Por favor espera...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            try {
                const resp = await fetch(`${GATEWAY_URL}/assign-security-group`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ interface_id: interfaceId, security_group_id: sgId })
                });
                const result = await resp.json();
                Swal.close();
                if (result.status === 'success') {
                    Swal.fire({ icon: 'success', title: 'Asignado', text: 'Security Group asignado correctamente', timer: 1200, showConfirmButton: false, timerProgressBar: true });
                    $('#interfaceSGModal').modal('hide');
                } else {
                    showErrorAlert(result)
                    throw new Error(result.message || 'Error al asignar');
                }
            } catch (err) {
                console.log('Error al asignar SG:', err);
            }
            $(this).prop('disabled', false).html('<i class="fas fa-plus me-1"></i>Asignar');
        });

    } catch (err) {
        $body.html(`<div class="alert alert-danger">Error: ${err.message}</div>`);
    }

    $('#interfaceSGModal').modal('show');
};

// Quitar SG de la interfaz (usando endpoint real)
window.removeSGFromInterface = async function(interfaceId, sgId) {
    Swal.fire({
        icon: 'warning',
        title: '¿Quitar Security Group?',
        text: '¿Estás seguro de desasociar el Security Group de esta interfaz?',
        showCancelButton: true,
        confirmButtonText: 'Sí, quitar',
        cancelButtonText: 'Cancelar',
        customClass: {
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-secondary ms-2'
        },
        buttonsStyling: false
    }).then(async (result) => {
        if (result.isConfirmed) {
            // Mostrar SweetAlert de carga
            Swal.fire({
                title: 'Desasociando Security Group...',
                text: 'Por favor espera...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            try {
                const resp = await fetch(`${GATEWAY_URL}/unassign-security-group`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ interface_id: interfaceId, security_group_id: sgId })
                });
                const data = await resp.json();
                Swal.close();
                if (data.status === 'success') {
                    Swal.fire({ icon: 'success', title: 'Removido', text: 'Security Group desasociado', timer: 1200, showConfirmButton: false, timerProgressBar: true });
                    $('#interfaceSGModal').modal('hide');
                } else {
                    showErrorAlert(result)
                    throw new Error(data.message || 'Error al remover');
                }
            } catch (err) {
                console.log('Error al quitar SG:', err);
            }
        }
    });
};


