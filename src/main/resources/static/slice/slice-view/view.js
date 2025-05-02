// ==============================================================================
// | ARCHIVO: view.js
// ==============================================================================
// | DESCRIPCIÓN:
// | Implementa la visualización y gestión de los Slices desplegados. Te permite 
// | ver detalles de la topología, estado de VMs y recursos asignados.
// ==============================================================================
// | CONTENIDO PRINCIPAL:
// | 1. CONFIGURACIÓN E INICIALIZACIÓN
// |    - Importación de dependencias y datos
// |    - Inicialización de variables globales
// |    - Configuración de Vis.js Network
// |    - Carga inicial de datos del Slice
// |
// | 2. VISUALIZACIÓN DE DATOS
// |    - Renderizado de topología
// |    - Actualización de información de red
// |    - Gestión de interfaces y enlaces
// |    - Tooltips y etiquetas informativas
// |
// | 3. GESTIÓN DE MODALES
// |    - Detalles de VMs
// |    - Información de enlaces
// |    - Acceso a consola VNC
// |    - Confirmaciones de acciones
// |
// | 4. OPERACIONES DE SLICE
// |    - Detención de Slice
// |    - Acceso a VMs (Cliente noVNC usando websockets)
// |    - Exportación de topología
// |    - Organización visual del layout
// |    - (Por implementar) Pausa de Slice / Reanudación de Slice
// |    - (Por implementar) Acco a VMs mediante SSH para Slices en AWS
// |
// | 5. UTILIDADES/HELPERS
// |    - Generación de tooltips
// |    - Verificación de acceso externo
// |    - Formateo de datos para visualización
// |    - Helpers para manipulación del DOM
// ==============================================================================


// ===================== IMPORTACIONES =====================
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
        image: '/slice/slice-view/host.png',
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
                window.location.href = '/topology-creator';
            }
        });
        return;
    }

    try {
        Swal.fire({
            title: 'Cargando',
            text: 'Obteniendo información de la Slice...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/slice/${sliceId}`); // Cambiar por URL del backend owo
        const data = await response.json();
        
        await new Promise(resolve => setTimeout(resolve, 700));

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
                        
                        // Get mouse position and container position
                        const mouseX = params.pointer.DOM.x;
                        const mouseY = params.pointer.DOM.y;
                        const containerRect = container.getBoundingClientRect();
                        
                        // Calculate position relative to page instead of container
                        const tooltipX = mouseX;
                        const tooltipY = mouseY;
                        
                        // Position tooltip with fixed offset from cursor
                        tooltip.style.position = 'fixed'; // Change to fixed positioning
                        tooltip.style.left = `${tooltipX + 15}px`; // Small offset from cursor
                        tooltip.style.top = `${tooltipY - 10}px`;
                        
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
                        tooltip.style.left = (event.pageX + 10) + "px";
                        tooltip.style.top = (event.pageY - 10) + "px";
                    }
                });
            
                // Add hover event for edges
                network.on("hoverEdge", function (params) {
                    const edgeId = params.edge;
                    const tooltipContent = edgeTooltips.get(edgeId);
                    if (tooltipContent) {
                        tooltip.innerHTML = tooltipContent;
                        
                        // Get mouse position and container position
                        const mouseX = params.pointer.DOM.x;
                        const mouseY = params.pointer.DOM.y;
                        const containerRect = container.getBoundingClientRect();
                        
                        // Calculate position relative to page instead of container
                        const tooltipX = mouseX;
                        const tooltipY = mouseY;
                        
                        // Position tooltip with fixed offset from cursor
                        tooltip.style.position = 'fixed'; // Change to fixed positioning
                        tooltip.style.left = `${tooltipX + 15}px`; // Small offset from cursor
                        tooltip.style.top = `${tooltipY - 10}px`;
                        
            
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
                    // Remover listener de click que oculta el menú
                    network.on('click', function(params) {
                        if (!params.event.target.closest('#contextMenu')) {
                            hideContextMenu();
                        }
                    });
                    
                    network.on('dragStart', function(params) {
                        hideContextMenu();
                    });
                
                    container.addEventListener('contextmenu', function(event) {
                        event.preventDefault();
                        event.stopPropagation(); // Evitar propagación
                        
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
                    });
                }

                document.addEventListener('click', function(e) {
                    // Solo ocultar si el click NO fue en el menú contextual o sus elementos
                    if (!e.target.closest('#contextMenu') && !e.target.closest('.vis-network')) {
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
                
                document.getElementById('ctxVNCButton')?.addEventListener('click', function() {
                    if (currentContextNode) {
                        openVNCConsole(currentContextNode.id);
                        hideContextMenu();
                    }
                });



                Swal.close();

            } catch (error) {
                console.error('Error :c : ', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Ocurrió un error al inicializar la visualización del Slice',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    customClass: {
                        confirmButton: 'btn bg-gradient-primary'
                    },
                    buttonsStyling: false
                });
            }
        } else {
            throw new Error('Ocurrió un error al cargar la data del Slice');
        }
    } catch (error) {
        console.error('Error :c : ', error);
        Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al cargar la data del Slice',
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
}

function updateNetworkInfo(networkConfig, sliceInfo) {
    document.getElementById('sliceName').textContent = sliceInfo.name;
    document.getElementById('sliceId').textContent = sliceInfo.id;
    document.getElementById('sliceStatus').textContent = sliceInfo.status;
    document.getElementById('externalNetwork').textContent = networkConfig.network;
    document.getElementById('VlanId').textContent = networkConfig.svlan_id;
    document.getElementById('networkRangeStart').textContent = networkConfig.dhcp_range[0];
    document.getElementById('networkRangeEnd').textContent = networkConfig.dhcp_range[1];
    document.getElementById('internalBridge').textContent = networkConfig.slice_bridge_name;

    /*const descriptionBtn = document.getElementById('sliceDescriptionBtn');
    if (descriptionBtn) {
        const existingTooltip = bootstrap.Tooltip.getInstance(descriptionBtn);
        if (existingTooltip) {
            existingTooltip.dispose();
        }

        new bootstrap.Tooltip(descriptionBtn, {
            title: `<div class="mb-2">
                      <span style="font-weight: 800; font-size: 1.1rem; color: #344767; text-transform: uppercase; letter-spacing: 0.02em; display: block; border-bottom: 2px solid #e91e63; padding-bottom: 8px; margin-bottom: 10px;">
                        Descripción de la Slice:
                      </span>
                    </div>
                    <div style="font-size: 0.875rem; line-height: 1.7; color: #344767;">
                      ${sliceInfo.description || 'Sin descripción disponible'}
                    </div>`,
            html: true,
            template: `
                <div class="tooltip" role="tooltip" style="max-width: none !important;">
                    <div class="tooltip-arrow"></div>
                    <div class="tooltip-inner bg-white text-dark p-4" 
                         style="max-width: none !important; 
                                width: 600px !important;
                                min-width: 400px !important;
                                font-size: 0.875rem; 
                                box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1);
                                border-radius: 0.5rem;">
                    </div>
                </div>
            `,
            trigger: 'hover click',
            offset: [0, 10],
            animation: true,
            placement: 'left'
        });
    }*/

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

        // Información básica
        document.getElementById('vmModalId').textContent = vm.id;
        document.getElementById('vmModalName').textContent = vm.name;
        document.getElementById('vmModalImage').textContent = image.name;
        document.getElementById('vmModalFlavorName').textContent = flavor.name;
        
        // Status badge
        document.getElementById('vmModalStatus').innerHTML = 
            `<span class="badge bg-gradient-${vm.status === 'running' ? 'warning' : 'danger'}">
                ${vm.status === 'running' ? 'En ejecución' : 'Detenido'}
             </span>`;

        // External access badge
        const hasExtAccess = hasExternalAccess(vm.id);
        document.getElementById('vmModalExternalAccess').innerHTML = 
            `<span class="badge bg-gradient-${hasExtAccess ? 'info' : 'secondary'}">
                ${hasExtAccess ? 'Con acceso externo' : 'Sin acceso externo'}
             </span>`;

        // Physical server y QEMU info
        document.getElementById('vmModalPhysicalServer').textContent = 
            `${vm.physical_server.name} (ID: ${vm.physical_server.id})`;
        document.getElementById('vmModalQemuPid').textContent = vm.qemu_pid || 'N/A';
        document.getElementById('vmModalVncDisplay').textContent = vm.vnc_display || 'N/A';

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
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-xs ps-4">
                    <p class="text-secondary mb-0 text-x">${iface.tap_name}</p>
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
            `;
            interfacesBody.appendChild(row);
        });

        // Actualizar estado del botón de pausa/reanudar
        const toggleButton = document.getElementById('vmToggleButton');
        const toggleIcon = document.getElementById('vmToggleIcon');
        const toggleText = document.getElementById('vmToggleText');
        
        if (vm.status === 'paused') {
            toggleButton.classList.remove('bg-gradient-danger');
            toggleButton.classList.add('bg-gradient-warning');
            toggleIcon.textContent = 'play_arrow';
            toggleText.textContent = 'Reanudar VM';
        } else {
            toggleButton.classList.remove('bg-gradient-warning');
            toggleButton.classList.add('bg-gradient-danger');
            toggleIcon.textContent = 'pause';
            toggleText.textContent = 'Pausar VM';
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
        
        // Deshabilitar botones si el slice está detenido
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
            vncButton.title = 'Solo se puede acceder a la consola VNC mientras la Slice está en ejecución';
        } else {
            vncButton.classList.remove('bg-gradient-secondary');
            vncButton.classList.add('bg-gradient-info');
            vncButton.style.pointerEvents = 'auto';
            vncButton.style.opacity = '1';
            vncButton.title = 'Abrir consola VNC';
            vncButton.setAttribute('data-vm-id', vm.id);
            vncButton.onclick = () => openVNCConsole(vm.id);
        }

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
    <b>Worker:</b> ${vm.physical_server.name}
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

        // Información básica
        document.getElementById('linkModalId').textContent = link.id;
        document.getElementById('linkModalName').textContent = link.name;
        document.getElementById('linkModalCVLAN').textContent = `CVLAN: ${link.cvlan_id}`;

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
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-md ps-4">
                    <p class="text-secondary mb-0">${vm ? vm.name : '-'}</p>
                </td>
                <td class="text-md ps-4">
                    <p class="text-secondary mb-0">${iface.mac_address}</p>
                </td>
                <td class="text-md ps-4">
                    <span class="badge bg-gradient-secondary">${iface.tap_name}</span>
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

        // Información básica
        document.getElementById('sliceModalId').textContent = sliceInfo.id;
        document.getElementById('sliceModalName').textContent = sliceInfo.name;
        document.getElementById('sliceModalDescription').textContent = sliceInfo.description == null ? "N/A" : sliceInfo.description;
        
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

        // Network Config
        document.getElementById('sliceModalBridgeName').textContent = networkConfig.slice_bridge_name;
        document.getElementById('sliceModalSVLAN').textContent = networkConfig.svlan_id;
        document.getElementById('sliceModalNetwork').textContent = networkConfig.network;
        document.getElementById('sliceModalDHCPInterface').textContent = networkConfig.dhcp_interface;
        document.getElementById('sliceModalGatewayInterface').textContent = networkConfig.gateway_interface;
        document.getElementById('sliceModalPatchInt').textContent = networkConfig.patch_ports.int_side;
        document.getElementById('sliceModalPatchSlice').textContent = networkConfig.patch_ports.slice_side;
        document.getElementById('sliceModalDHCPStart').textContent = networkConfig.dhcp_range[0];
        document.getElementById('sliceModalDHCPEnd').textContent = networkConfig.dhcp_range[1];

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
    const endpoint = isPaused ? 'resume-vm' : 'pause-vm';

    // Confirmación inicial
    const result = await Swal.fire({
        title: isPaused ? '¿Reanudar VM?' : '¿Pausar VM?',
        text: isPaused ? 
            'La máquina virtual se encenderá y estará disponible nuevamente.' : 
            'La máquina virtual se apagará. Sus datos en disco se mantendrán intactos, pero la configuración realizada no persistirá.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: isPaused ? 'Sí, reanudar' : 'Sí, pausar',
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
            title: isPaused ? 'Reanudando VM...' : 'Pausando VM...',
            text: 'Por favor espere...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/${endpoint}/${vmId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.status === 'success') {
            
            closeAllModals();

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: data.message,
                timer: 1500,
                showConfirmButton: false
            });

            // Actualizar datos del slice después de un breve delay
            setTimeout(() => {
                getSliceData(false);
            }, 1000);

        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${isPaused ? 'reanudando' : 'pausando'} VM: ${error.message}`
        });
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

        const startTime = Date.now();
        const response = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/vm-token/${vmId}`, {
            method: 'POST'
        });
        const data = await response.json();

        // Ensure minimum loading time of 1 second
        const elapsed = Date.now() - startTime;
        if (elapsed < 400) {
            await new Promise(resolve => setTimeout(resolve, 400 - elapsed));
        }

        if (data.status === 'success') {
            const token = data.content.token;
            const url = `http://${BACKEND_IP}:${BACKEND_PORT}/vm-vnc/${vmId}?token=${token}`;
            const newWindow = window.open(url, '_blank', 'noopener=yes,noreferrer=yes');
            if (newWindow) {
                window.focus();
            }
            Swal.close();
        } else {
            throw new Error(data.message || 'Error al obtener token VNC');
        }

    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: 'No se pudo establecer la conexión VNC: ' + error.message,
            icon: 'error',
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
        text: 'Todas las VMs serán detenidas y reiniciadas. Este proceso puede tomar unos minutos.',
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
            
            fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/restart-slice/${sliceId}`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        title: 'Éxito',
                        text: 'Slice reiniciada correctamente',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Actualizar información después de un breve delay
                    setTimeout(() => {
                        getSliceData(false);
                    }, 2000);
                } else {
                    throw new Error(data.message);
                }
            })
            .catch(error => {
                Swal.fire({
                    title: 'Error',
                    text: 'Ocurrió un error al reiniciar la slice: ' + error.message,
                    icon: 'error',
                    confirmButtonText: 'OK',
                    customClass: {
                        confirmButton: 'btn bg-gradient-primary'
                    },
                    buttonsStyling: false
                });
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
            
            $.ajax({
                url: `http://${BACKEND_IP}:${BACKEND_PORT}/stop-slice/${sliceId}`,
                method: 'POST',
                success: function(response) {
                    if (response.status === 'success') {
                        Swal.fire({
                            title: 'Éxito',
                            text: 'Slice detenida correctamente',
                            icon: 'success',
                            confirmButtonText: 'OK',
                            customClass: {
                                confirmButton: 'btn bg-gradient-primary'
                            },
                            buttonsStyling: false
                        });
                    }

                    setTimeout(() => {
                        getSliceData(false);
                    }
                    , 1000);

                },
                error: function(xhr, status, error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Ocurrió un error al detener la slice',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        customClass: {
                            confirmButton: 'btn bg-gradient-primary'
                        },
                        buttonsStyling: false
                    });
                }
            });
        }
    });
}

// Agregar al final del archivo view.js
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

        const response = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/restart-vm/${vmId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.status === 'success') {
            closeAllModals();

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: data.message,
                timer: 1500,
                showConfirmButton: false
            });

            // Actualizar datos del slice después de un breve delay
            setTimeout(() => {
                getSliceData(false);
            }, 1000);

        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error reiniciando VM: ${error.message}`
        });
    }
}

// Función para cargar los recursos desde el backend
async function loadResources() {
    try {
        // Cargar flavors
        const flavorsResponse = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/resources/flavors`);
        const flavorsData = await flavorsResponse.json();
        if (flavorsData.status === 'success') {
            AVAILABLE_FLAVORS = flavorsData.content;
        }

        // Cargar imágenes
        const imagesResponse = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/resources/images`);
        const imagesData = await imagesResponse.json();
        if (imagesData.status === 'success') {
            AVAILABLE_IMAGES = imagesData.content;
        }
    } catch (error) {
        console.error('Error cargando recursos:', error);
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
        toggleText.textContent = 'Pausar VM';
    } else {
        toggleIcon.textContent = 'play_arrow';
        toggleText.textContent = 'Reanudar VM';
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

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu && contextMenu.style.display !== 'none') {
        contextMenu.classList.remove('animate__jackInTheBox');
        contextMenu.classList.add('animate__fadeOut');
        setTimeout(() => {
            if(!contextMenu.classList.contains('animate__jackInTheBox')) {
                contextMenu.style.display = 'none';
                currentContextNode = null;
            }
        }, 1000);
    }
}