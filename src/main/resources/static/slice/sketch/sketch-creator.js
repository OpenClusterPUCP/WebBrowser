/*
==============================================================================
| ARCHIVO: sketch-creator.js
==============================================================================
| DESCRIPCIÓN:
| Implementa la lógica principal para crear y gestionar las topologías de red
| en el frontend (topology-creator.html), mediante su visualización
| y la manipulación de los elementos de red.
==============================================================================
| CONTENIDO PRINCIPAL:
| 1. CONFIGURACIÓN E INICIALIZACIÓN
|    - Importación de dependencias y datos
|    - Inicialización de variables globales
|    - Configuración de la librería para la gráfica de topologías
|
| 2. GESTIÓN DE MODALES/POP-UPS
|    - Creación/Edición de VMs
|    - Creación/Edición de Enlaces
|    - Gestión de las Plantillas de Topología
|    - Despliegue
|
| 3. OPERACIONES CRUD
|    - Creación de VMs y Enlaces
|    - Edición de elementos existentes
|    - Eliminación de elemntos
|
| 4. FUNCIONES DE TOPOLOGÍA
|    - Generación de topologías predefinidas (Lineal, Anillo, Malla, Estrella)
|    - Organización automática del layout
|    - Exportación/Importación de topologías
|    - Despliegue de Slices
|
| 5. UTILIDADES/HELPERS
|    - Generación de UUIDs
|    - Generación de MACs
|    - Mensajes breves de los elementos en la gráfica
|    - Helpers para poder manipular datos
==============================================================================
*/

// ===================== IMPORTACIONES =====================
import { TopologyManager, VM, Link, Interface, Flavor, Image, Slice, VisVM, VisLink } from './classes.js';

// ===================== VARIABLES GLOBALES =====================
let network = null;
let topologyManager = null;
let visDataset = {
    nodes: new vis.DataSet(),
    edges: new vis.DataSet()
};
let nodeTooltips = new Map();
let edgeTooltips = new Map();
const container = document.getElementById('network-container');
const tooltip = document.getElementById('customTooltip');
let addVMModal = null;
let addLinkModal = null;
let saveSketchModal = null;
let templateModal = null;
let BACKEND_IP = 'localhost';
let BACKEND_PORT = 5001;
let AVAILABLE_IMAGES = [];
let AVAILABLE_FLAVORS = [];
window.addLinearTopology = () => showTemplateModal('linear');
window.addRingTopology = () => showTemplateModal('ring');
window.addMeshTopology = () => showTemplateModal('mesh');
window.addStarTopology = () => showTemplateModal('star');

// ===================== CONFIGURACIÓN PARA LA GRÁFICA DE TOPOLOGÍAS =====================
const options = {
    manipulation: {
        enabled: true,
        initiallyActive: true,
        addNode: function(nodeData, callback) {
            window.currentNetworkCallback = callback;
            window.currentNodeData = {
                ...nodeData,
                x: nodeData.x,
                y: nodeData.y
            };
            window.isEditMode = false;
            showAddVMModal(callback);
        },
        addEdge: function(edgeData, callback) {
            if (edgeData.from === edgeData.to) {
                Swal.fire({
                    title: 'Acción No Permitida',
                    text: 'No se pueden crear enlaces que conecten una VM consigo misma',
                    icon: 'warning',
                    confirmButtonText: 'Entendido',
                    customClass: {
                        confirmButton: 'btn bg-gradient-primary'
                    },
                    buttonsStyling: false
                });
                callback(null);
                return;
            }
            window.currentNetworkCallback = callback;
            window.currentEdgeData = edgeData;
            showAddLinkModal();
        },  
        editNode: undefined,
        editEdge: false,
        deleteNode: function(nodeData, callback) {
            const nodeId = nodeData.nodes[0];
            if(nodeId === undefined || nodeId === null) {
                callback(null)
            }
            handleDeleteVM(nodeId);
            callback(nodeData);
            setTimeout(() => {
                network.selectNodes([])
            }, 0);
        },
        deleteEdge: function(edgeData, callback) {
            const edgeId = edgeData.edges[0];
            handleDeleteLink(edgeId);
            callback(edgeData);
            setTimeout(() => {
                network.selectNodes([])
            }, 0);
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
        image: '/slice/sketch/host.png',
        size: 30,
        shadow: {
            enabled: true,
            color: 'rgba(7, 7, 7, 0.41)',
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
            multi: true,        
            bold: '16px arial',    
        },
        fixed: false,
        chosen: {                
            node: function(values, id, selected, hovering) {
                values.shadowSize = 15;
                values.shadowX = 7;
                values.shadowY = 7;
            }
        },
        title: undefined,
    },
    edges: {
        width: 2,
        length: 130,
        color: {
            color: '#000000',      
            highlight: '#cb0c9f',  
            hover: '#cb0c9f',    
            opacity: 0.8
        },
        title: undefined,
        shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.5)',
            size: 21,
            x: 5,
            y: 5
        },
        smooth: {                  
            enabled: true,
            type: 'dynamic',
            roundness: 0.8
        },
        font: {
            size: 15,
            face: 'Roboto',
            align: 'middle',
            strokeWidth: 3,
            strokeColor: '#ffffff',
            multi: true
        },
        arrows: {
            to: {
                enabled: false
            }
        },
        chosen: {
            edge: function(values, id, selected, hovering) {
                if (hovering) {
                    values.width = 3;
                    values.color = '#e91e63';
                    values.shadow = {
                        enabled: true,
                        color: '#e91e63',
                        size: 15,
                        x: 3,
                        y: 3
                    };
                    values.font = {
                        size: 16,
                        strokeWidth: 5,
                        bold: true,
                        zIndex: 999,
                    };
                } else {
                    values.width = 2;
                    values.color = '#344767';
                    values.shadow = {
                        enabled: true,
                        color: 'rgba(0, 0, 0, 0.5)',
                        size: 10,
                        x: 3,
                        y: 3
                    };
                    values.font = {
                        size: 14,
                        strokeWidth: 3,
                        bold: true,
                        zIndex: 0,
                    };
                }
            },
            label: function(values, id, selected, hovering) {
                if (hovering) {
                    values.size = 16;
                    values.strokeWidth = 5;
                } else {
                    values.size = 14;
                    values.strokeWidth = 3;
                }
            }
        }
    },
};

// ===================== INICIALIZACIÓN =====================
document.addEventListener('DOMContentLoaded', async function() {
    // Inicialización de la data de flavors e images
    await loadResources();
    // Inicialización de la red/topología
    topologyManager = new TopologyManager();
    network = new vis.Network(
        container,
        visDataset,
        options
    );
    // Listeners
    network.on('doubleClick', function(params) {
        if (params.nodes && params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            showEditVMModal(nodeId);
            return;
        }
        if (params.edges && params.edges.length > 0) {
            const edgeId = params.edges[0];
            showEditLinkModal(edgeId);
            return;
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

    // Inicialización de los modales/pop-ups
    initializeModals();
});

// ===================== MODALES/POP-UPS =====================
function initializeModals() {
    addVMModal = new bootstrap.Modal(document.getElementById('addVMModal'));
    addLinkModal = new bootstrap.Modal(document.getElementById('addLinkModal'));
    templateModal = new bootstrap.Modal(document.getElementById('templateModal'));
    saveSketchModal = new bootstrap.Modal(document.getElementById('saveSketchModal'));
    populateSelects();
    setupModalEvents();
}

function populateSelects() {
    const imageSelect = document.getElementById('vmImage');
    const flavorSelect = document.getElementById('vmFlavor');

    imageSelect.innerHTML = '<option value="" selected disabled>----</option>';
    flavorSelect.innerHTML = '<option value="" selected disabled>----</option>';

    console.log(AVAILABLE_IMAGES, 'available_images')
    console.log(AVAILABLE_FLAVORS, 'available_flavors')

    if (AVAILABLE_IMAGES && AVAILABLE_IMAGES.length > 0) {
        AVAILABLE_IMAGES.forEach((image, index) => {
            const option = document.createElement('option');
            option.value = image.id;
            option.textContent = image.name;
            imageSelect.appendChild(option);
            if (index === 0) {
                console.log('Setting default image:', image.id);
                imageSelect.value = image.id;
            }
        });
    } else {
        console.error('No hay imágenes: ', AVAILABLE_IMAGES);
    }

    if (AVAILABLE_FLAVORS && AVAILABLE_FLAVORS.length > 0) {
        AVAILABLE_FLAVORS.forEach((flavor, index) => {
            const option = document.createElement('option');
            option.value = flavor.id;
            option.textContent = flavor.name;
            flavorSelect.appendChild(option);
            if (index === 0) {
                flavorSelect.value = flavor.id;
            }
        });
    } else {
        console.error('No hay flavors: ', AVAILABLE_FLAVORS);
    }
}

function setupModalEvents() {
    document.getElementById('vmFlavor').addEventListener('change', updateFlavorDetails);
    document.getElementById('vmSubmitButton').onclick = function() {
        const form = document.getElementById('addVMForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (window.isEditMode) {
            handleEditVM();
        } else {
            handleCreateVM();
        }
    };
    document.getElementById('linkSubmitButton').onclick = function() {
        if (window.isEditMode) {
            handleEditLink();
        } else {
            handleCreateLink();
        }
    };
    document.getElementById('templateSubmitButton').onclick = createTemplateTopology;
}

function resetModalState() {
    const form = document.getElementById('addVMForm');
    form.reset();
    
    document.getElementById('flavorRAM').textContent = '-';
    document.getElementById('flavorCPUs').textContent = '-';
    document.getElementById('flavorDisk').textContent = '-';
}

function showAddVMModal() {
    hideTooltip()
    document.querySelector('#addVMModal .modal-title').innerHTML = `
        <i class="material-symbols-rounded me-2">computer</i>
        Agregar Máquina Virtual`;
    resetModalState();
    window.isEditMode = false;
    addVMModal.show();
}

function showAddLinkModal() {
    hideTooltip()
    document.querySelector('#addLinkModal .modal-title').innerHTML = `
        <i class="material-symbols-rounded me-2">link</i>
        Agregar Enlace de Red`;

    document.getElementById('addLinkForm').reset();
    window.isEditMode = false;
    addLinkModal.show();
}

function showEditVMModal(vmId) {
    hideTooltip()
    const vm = topologyManager.vms.get(vmId);
    if (!vm) return;

    window.currentNodeData = {
        id: vmId,
        x: visDataset.nodes.get(vmId).x,
        y: visDataset.nodes.get(vmId).y
    };

    window.isEditMode = true;

    document.querySelector('#addVMModal .modal-title').innerHTML = `
        <i class="material-symbols-rounded me-2">edit</i>
        Editar Máquina Virtual`;

    document.getElementById('vmName').value = vm.name;
    document.getElementById('vmImage').value = vm.image_id;
    document.getElementById('vmFlavor').value = vm.flavor_id;
    
    updateFlavorDetails();

    const interfaces = Array.from(topologyManager.interfaces.values());
    const vmInterfaces = interfaces.filter(iface => iface.vm_id === vm.id);
    const hasExternal = vmInterfaces.some(iface => iface.external_access === true);
    const checkbox = document.getElementById('vmExternalAccess');
    checkbox.checked = hasExternal;

    addVMModal.show();
}

function showEditLinkModal(linkId) {
    hideTooltip()
    const link = topologyManager.links.get(linkId);
    if (!link) return;

    window.currentEdgeData = {
        id: linkId,
        ...visDataset.edges.get(linkId)
    };
    window.isEditMode = true;

    document.querySelector('#addLinkModal .modal-title').innerHTML = `
        <i class="material-symbols-rounded me-2">edit</i>
        Editar Enlace de Red`;

    document.getElementById('linkName').value = link.name;

    addLinkModal.show();
}


function updateFlavorDetails() {
    const flavorId = document.getElementById('vmFlavor').value;
    const flavor = AVAILABLE_FLAVORS.find(f => f.id === parseInt(flavorId));
    
    if (flavor) {
        document.getElementById('flavorRAM').textContent = `${flavor.ram} MB`;
        document.getElementById('flavorCPUs').textContent = flavor.vcpus;
        document.getElementById('flavorDisk').textContent = `${flavor.disk} GB`;
    }
}


// ===================== CREACIÓN DE VMs =====================
window.handleCreateVM = function() {
    const form = document.getElementById('addVMForm');
    const imageSelect = document.getElementById('vmImage');
    const flavorSelect = document.getElementById('vmFlavor');
    
    if (!imageSelect.value || !flavorSelect.value) {
        form.reportValidity();
        return;
    }

    const flavor = AVAILABLE_FLAVORS.find(flavor => flavor.id === parseInt(flavorSelect.value));
    const image = AVAILABLE_IMAGES.find(image => image.id === parseInt(imageSelect.value));
    const vmName = document.getElementById('vmName').value;
    const defaultName = `VM-${topologyManager.vms.size + 1}`;
    const vmData = {
        id: topologyManager.generateUUID(),
        name: vmName || defaultName,
        label: vmName || defaultName,
        image_id: imageSelect.value,
        flavor_id: flavorSelect.value,
    };
    const vmObject = new VM(
        vmData.id,
        vmData.name,
        vmData.image_id,
        vmData.flavor_id,
    );
    const tooltipContent = `<b>Nombre:</b> ${vmData.name}
    <b>Imagen:</b> ${image.name}
    <b>Flavor:</b> ${flavor.name}
    <b>Acceso externo:</b> ${document.getElementById('vmExternalAccess').checked ? 'Sí' : 'No'}`;


    topologyManager.addVM(vmObject,undefined);
    visDataset.nodes.add({
        ...topologyManager.visNodes.get(vmObject.id),
        x: window.currentNodeData.x,
        y: window.currentNodeData.y,
        title: undefined
    });

    nodeTooltips.set(vmObject.id, tooltipContent);
    if (document.getElementById('vmExternalAccess').checked) {
        const interfaceData = {
            id: topologyManager.generateUUID(),
            name: 'exth',
            vm_id: vmData.id,
            link_id: null,
            mac_address: null,
            external_access: true
        };
        topologyManager.addInterface(interfaceData);
    }

    updateResourceInfo();
    
    console.log(topologyManager)

    addVMModal.hide();

    if (window.currentNetworkCallback) {  
        window.currentNetworkCallback(window.currentNodeData);
        window.currentNetworkCallback = null;  
        window.currentNodeData = null;
    }
}

// ===================== CREACIÓN DE ENLACES =====================
window.handleCreateLink = function() {
    const edgeData = window.currentEdgeData;
    if (!edgeData) return;

    const linkName = document.getElementById('linkName').value;
    const defaultName = `Enlace-${topologyManager.links.size + 1}`;
    const linkData = {
        id: topologyManager.generateUUID(),
        name: linkName || defaultName
    };
    const sourceVM = topologyManager.vms.get(edgeData.from);
    const targetVM = topologyManager.vms.get(edgeData.to);
    
    if (!sourceVM || !targetVM) {
        return;
    }

    const sourceInterface = {
        id: topologyManager.generateUUID(),
        name: `if-${topologyManager.getVMInterfacesCount(sourceVM.id) + 1}`,
        vm_id: sourceVM.id,
        link_id: linkData.id,
        mac_address: null,
        external_access: false
    };
    const targetInterface = {
        id: topologyManager.generateUUID(),
        name: `if-${topologyManager.getVMInterfacesCount(targetVM.id) + 1}`,
        vm_id: targetVM.id,
        link_id: linkData.id,
        mac_address: null,
        external_access: false
    };

    topologyManager.addLink(linkData, sourceVM, targetVM);
    topologyManager.addInterface(sourceInterface);
    topologyManager.addInterface(targetInterface);

    const tooltipContent = `<b>Nombre:</b> ${linkName || defaultName}`;
    edgeTooltips.set(linkData.id, tooltipContent);

    const edgeVisData = {
        id: linkData.id,
        from: edgeData.from,
        to: edgeData.to,
        label: linkData.name,
        title: undefined,
    };

    visDataset.edges.add(edgeVisData);

    console.log(topologyManager)
    addLinkModal.hide();

    if (window.currentNetworkCallback) {
        window.currentNetworkCallback(edgeVisData);
        window.currentNetworkCallback = null;
        window.currentEdgeData = null;
    }
}

// ===================== EDICIÓN DE VMs =====================
window.handleEditVM = function() {
    const vmId = window.currentNodeData.id;
    const vm = topologyManager.vms.get(vmId);
    if (!vm) return;

    const form = document.getElementById('addVMForm');
    const imageSelect = document.getElementById('vmImage');
    const flavorSelect = document.getElementById('vmFlavor');
    
    if (!imageSelect.value || !flavorSelect.value) {
        form.reportValidity();
        return;
    }

    const newName = document.getElementById('vmName').value || vm.name;
    const newImageId = imageSelect.value;
    const newFlavorId = flavorSelect.value;
    const newExternalAccess = document.getElementById('vmExternalAccess').checked;
    const flavor = AVAILABLE_FLAVORS.find(f => f.id === parseInt(newFlavorId));
    const image = AVAILABLE_IMAGES.find(i => i.id === parseInt(newImageId));

    vm.name = newName;
    vm.image_id = newImageId;
    vm.flavor_id = newFlavorId;

    const tooltipContent = `<b>Nombre:</b> ${vm.name}
    <b>Imagen:</b> ${image.name}
    <b>Flavor:</b> ${flavor.name}
    <b>Acceso externo:</b> ${newExternalAccess ? 'Sí' : 'No'}`;

    nodeTooltips.set(vmId, tooltipContent);

    const visData = {
        id: vm.id,
        label: vm.name,
        title: undefined
    };
    topologyManager.visNodes.set(vm.id, new VisVM(vm, undefined));
    visDataset.nodes.update(visData);

    const hasExternal = topologyManager.hasExternalAccess(vm.id);
    if (newExternalAccess && !hasExternal) {
        const interfaceData = {
            id: topologyManager.generateUUID(),
            name: 'exth',
            vm_id: vm.id,
            link_id: null,
            mac_address: null,
            external_access: true
        };
        topologyManager.addInterface(interfaceData);
    } else if (!newExternalAccess && hasExternal) {
        topologyManager.removeExternalAccess(vm.id);
    }

    updateResourceInfo();

    console.log(topologyManager)
    addVMModal.hide();
    window.currentNodeData = null;
}

// ===================== EDICIÓN DE ENLACES =====================
window.handleEditLink = function() {
    const linkId = window.currentEdgeData.id;
    const link = topologyManager.links.get(linkId);
    if (!link) return;

    const newName = document.getElementById('linkName').value;
    const defaultName = link.name;

    link.name = newName || defaultName;

    const tooltipContent = `<b>Nombre:</b> ${linkName || defaultName}`;
    edgeTooltips.set(linkData.id, tooltipContent);

    const visData = {
        id: linkId,
        label: link.name,
        title: undefined,
        from: window.currentEdgeData.from,
        to: window.currentEdgeData.to
    };

    topologyManager.visEdges.set(link.id, new VisLink(link,visData.from, visData.to));
    visDataset.edges.update(visData);

    addLinkModal.hide();
    window.currentEdgeData = null;
    window.isEditMode = false;
}

// ===================== ELIMINACIÓN D ELEMENTOS =====================
function handleDeleteVM(vmId) {
    const vm = topologyManager.vms.get(vmId);
    if (!vm) return;

    const vmInterfaces = Array.from(topologyManager.interfaces.values())
        .filter(iface => iface.vm_id === vmId);

    vmInterfaces.forEach(iface => {
        if (iface.link_id) {
            const link = topologyManager.links.get(iface.link_id);
            if (link) {
                topologyManager.links.delete(link.id);
                topologyManager.visEdges.delete(link.id);
                visDataset.edges.remove(link.id);
                Array.from(topologyManager.interfaces.values())
                    .filter(i => i.link_id === link.id)
                    .forEach(i => topologyManager.interfaces.delete(i.id));
            }
        }
        topologyManager.interfaces.delete(iface.id);
        nodeTooltips.delete(vmId);
    });

    topologyManager.vms.delete(vmId);
    topologyManager.visNodes.delete(vmId);
    visDataset.nodes.remove(vmId);
    updateResourceInfo();
    network.disableEditMode();
    network.enableEditMode();
}

function handleDeleteLink(linkId) {
    const link = topologyManager.links.get(linkId);
    if (!link) return;

    Array.from(topologyManager.interfaces.values())
        .filter(iface => iface.link_id === linkId)
        .forEach(iface => {
            topologyManager.interfaces.delete(iface.id);
        });

    topologyManager.links.delete(linkId);
    topologyManager.visEdges.delete(linkId);
    visDataset.edges.remove(linkId);
    network.disableEditMode();
    network.enableEditMode();
    edgeTooltips.delete(linkId);
    console.log(topologyManager)
}

// ===================== GUARDADO DE SKETCHs =====================

// Manejo de mensajes de error:

function showErrorAlert(error) {
    let errorMessage = '';
    let errorDetails = [];

    try {
        // Parse the error object
        let errorData = null;
        
        if (typeof error === 'object' && error.response) {
            // If error comes from API response
            errorData = error.response;
        } else if (error.message && error.message.includes('{')) {
            // If error message contains JSON
            const jsonStr = error.message.substring(
                error.message.indexOf('{'),
                error.message.lastIndexOf('}') + 1
            );
            errorData = JSON.parse(jsonStr);
        } else {
            errorMessage = error.message || 'Error desconocido';
        }

        // If we have parsed data, extract message and details
        if (errorData) {
            errorMessage = errorData.message || 'Error desconocido';
            
            // Handle details that could be array or string
            if (errorData.details) {
                if (Array.isArray(errorData.details)) {
                    errorDetails = errorData.details;
                } else {
                    errorDetails = [errorData.details];
                }
            }
        }

        // Create HTML content for SweetAlert
        const detailsHtml = errorDetails.length > 0
            ? `
                <div class="text-start text-danger small mt-3">
                    <hr class="my-2">
                    ${errorDetails.map(detail => `
                        <p class="mb-1 d-flex align-items-start">
                            <i class="fas fa-exclamation-circle me-2 mt-1"></i>
                            <span>${detail}</span>
                        </p>
                    `).join('')}
                </div>
            `
            : '';

        return Swal.fire({
            icon: 'error',
            title: 'Error',
            html: `
                <p class="mb-2">${errorMessage}</p>
                ${detailsHtml}
            `,
            customClass: {
                icon: 'border-0',
                confirmButton: 'btn btn-danger',
                htmlContainer: 'text-left'
            },
            buttonsStyling: false
        });
    } catch (parseError) {
        console.error('Error parsing error message:', parseError);
        // Fallback for unparseable errors
        return Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error desconocido',
            customClass: {
                icon: 'border-0',
                confirmButton: 'btn btn-danger'
            },
            buttonsStyling: false
        });
    }
}


window.saveSketch = async function() {
    const form = document.getElementById('saveSketchForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const sketchName = document.getElementById('sketchName').value;
    const sketchDescription = document.getElementById('sketchDescription').value;

    const sketchData = {
        name: sketchName,
        description: sketchDescription,
        topology_info: {
            vms: Array.from(topologyManager.vms.values()).map(vm => ({
                id: vm.id,
                name: vm.name,
                image_id: parseInt(vm.image_id),
                flavor_id: parseInt(vm.flavor_id)
            })),
            links: Array.from(topologyManager.links.values()).map(link => ({
                id: link.id,
                name: link.name
            })),
            interfaces: Array.from(topologyManager.interfaces.values()).map(iface => ({
                id: iface.id,
                name: iface.name,
                vm_id: iface.vm_id,
                link_id: iface.link_id,
                mac_address: iface.mac_address,
                external_access: iface.external_access
            }))
        },
        topology_graph: {
            nodes: Array.from(topologyManager.visNodes.values()).map(node => ({
                id: node.id,
                label: node.label,
                title: nodeTooltips.get(node.id) || node.title
            })),
            edges: Array.from(topologyManager.visEdges.values()).map(edge => ({
                id: edge.id,
                from: visDataset.edges.get(edge.id)?.from,
                to: visDataset.edges.get(edge.id)?.to,
                label: edge.label
            }))
        }
    };

    try {
        Swal.fire({
            title: 'Guardando sketch...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('/User/api/sketch/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sketchData)
        });

        const result = await response.json();
        console.log("result", result);
        console.log("status", result.status);

        if (response.ok && result.success === true) {
            saveSketchModal.hide();

            Swal.fire({
                icon: 'success',
                title: '¡Sketch guardado!',
                text: result.message,
                confirmButtonText: 'Ver mis sketches',
                showCancelButton: false,
                customClass: {
                    confirmButton: 'btn bg-gradient-primary',
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/User/sketch/list';
                }
            });
        } else {
            throw {
                message: result.message || 'Error al crear el sketch',
                details: result.details || [],
                response: result
            };
        }

    } catch (error) {
        console.error('Error al guardar el sketch:', error);
        await showErrorAlert(error);
    }
}

window.showSaveSketchModal = function() {
    if (!validateTopology()) return;

    saveSketchModal.show();
}

window.showSuccessMessage = function(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade position-fixed top-0 end-0 m-3 text-white';
    alertDiv.style.cssText = `
        z-index: 9999;
        animation: slideIn 0.5s ease forwards, pulse 1.5s ease-in-out infinite;
        transform: translateX(100%);
        box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.12);
    `;

    if (!document.getElementById('alertAnimationStyles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'alertAnimationStyles';
        styleSheet.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
            .alert-exit {
                animation: slideOut 0.5s ease forwards !important;
            }
            .alert {
                transition: all 0.3s ease;
            }
            .alert:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 25px rgba(0,0,0,0.18), 0 8px 8px rgba(0,0,0,0.15);
            }
        `;
        document.head.appendChild(styleSheet);
    }

    alertDiv.innerHTML = `
        <i class="material-symbols-rounded me-2">check_circle</i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 10);

    setTimeout(() => {
        alertDiv.classList.add('alert-exit');
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    }, 5500);
}

// ===================== PLANTILLAS DE TOPOLOGÍAS / SUBTOPOLOGÍAS =====================
function showTemplateModal(type) {
    hideTooltip()
    const modal = new bootstrap.Modal(document.getElementById('templateModal'));
    const title = document.querySelector('#templateModal .modal-title');
    const submitButton = document.getElementById('templateSubmitButton');
    const imageSelect = document.getElementById('templateImage');
    const flavorSelect = document.getElementById('templateFlavor');
    
    imageSelect.innerHTML = '';
    flavorSelect.innerHTML = '';
    
    AVAILABLE_IMAGES.forEach((image, index) => {
        const option = document.createElement('option');
        option.value = image.id;
        option.textContent = image.name;
        imageSelect.appendChild(option);
        if (index === 0) imageSelect.value = image.id;
    });
    
    AVAILABLE_FLAVORS.forEach((flavor, index) => {
        const option = document.createElement('option');
        option.value = flavor.id;
        option.textContent = flavor.name;
        flavorSelect.appendChild(option);
        if (index === 0) flavorSelect.value = flavor.id;
    });
    
    const initialFlavor = AVAILABLE_FLAVORS[0];
    const details = document.getElementById('templateFlavorDetails');
    details.textContent = `RAM: ${initialFlavor.ram}MB | vCPUs: ${initialFlavor.vcpus} | Disco: ${initialFlavor.disk}GB`;
    
    
    flavorSelect.addEventListener('change', () => {
        const flavor = AVAILABLE_FLAVORS.find(f => f.id === parseInt(flavorSelect.value));
        const details = document.getElementById('templateFlavorDetails');
        if (flavor) {
            details.textContent = `RAM: ${flavor.ram}MB | vCPUs: ${flavor.vcpus} | Disco: ${flavor.disk}GB`;
        } else {
            details.textContent = 'RAM: - | vCPUs: - | Disco: -';
        }
    });

    switch(type) {
        case 'linear': title.innerHTML = '<i class="material-symbols-rounded me-2">linear_scale</i>Topología Lineal'; break;
        case 'ring': title.innerHTML = '<i class="material-symbols-rounded me-2">radio_button_unchecked</i>Topología en Anillo'; break;
        case 'mesh': title.innerHTML = '<i class="material-symbols-rounded me-2">grid_4x4</i>Topología en Malla'; break;
        case 'star': title.innerHTML = '<i class="material-symbols-rounded me-2">star</i>Topología en Estrella'; break;
    }

    submitButton.onclick = () => createTemplateTopology(type);
    modal.show();
}

function createTemplateTopology(type) {
    const vmCount = parseInt(document.getElementById('templateVMCount').value);
    const imageId = document.getElementById('templateImage').value;
    const flavorId = document.getElementById('templateFlavor').value;

    if (!vmCount || !imageId || !flavorId) {
        Swal.fire({
            title: 'Datos Incompletos',
            text: 'Por favor complete todos los campos',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    if (isNaN(vmCount) || vmCount < 2) {
        Swal.fire({
            title: 'Datos Incorrectos',
            text: 'Por favor ingrese un número válido de VMs (Min: 2)',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    if (vmCount > 10) {
        Swal.fire({
            title: 'Datos Incorrectos',
            text: 'Por favor ingrese un número válido de VMs (Máx: 10)',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    switch(type) {
        case 'linear': createLinearTopology(vmCount, imageId, flavorId); break;
        case 'ring': createRingTopology(vmCount, imageId, flavorId); break;
        case 'mesh': createMeshTopology(vmCount, imageId, flavorId); break;
        case 'star': createStarTopology(vmCount, imageId, flavorId); break;
    }

    document.getElementById('templateVMCount').value = 2;

    bootstrap.Modal.getInstance(document.getElementById('templateModal')).hide();
}

function createTemplateVM(x, y, imageId, flavorId) {
    const vmId = topologyManager.generateUUID();
    const vmName = `VM-${topologyManager.vms.size + 1}`;
    const vm = new VM(vmId, vmName, imageId, flavorId);
    
    // Obtener la información para el tooltip
    const image = AVAILABLE_IMAGES.find(img => img.id === parseInt(imageId));
    const flavor = AVAILABLE_FLAVORS.find(f => f.id === parseInt(flavorId));
    const tooltipContent = `<b>Nombre:</b> ${vmName}
<b>Imagen:</b> ${image.name}
<b>Flavor:</b> ${flavor.name}
<b>Acceso externo:</b> No`;

    // Guardar el tooltip content en el Map
    nodeTooltips.set(vmId, tooltipContent);
        
    topologyManager.addVM(vm, undefined);

    visDataset.nodes.add({
        ...topologyManager.visNodes.get(vmId),
        x: x,
        y: y,
        title: undefined  // Asegurarse que el título nativo está deshabilitado
    });

    return vmId;
}

function createTemplateLink(sourceId, targetId) {
    const linkId = topologyManager.generateUUID();
    const linkName = `Enlace-${topologyManager.links.size + 1}`;
    const linkData = {
        id: linkId,
        name: linkName
    };
    const sourceInterface = {
        id: topologyManager.generateUUID(),
        name: `if-${topologyManager.getVMInterfacesCount(sourceId) + 1}`,
        vm_id: sourceId,
        link_id: linkId,
        mac_address: null,
        external_access: false
    };
    const targetInterface = {
        id: topologyManager.generateUUID(),
        name: `if-${topologyManager.getVMInterfacesCount(targetId) + 1}`,
        vm_id: targetId,
        link_id: linkId,
        mac_address: null,
        external_access: false
    };

    topologyManager.addLink(linkData, topologyManager.vms.get(sourceId), topologyManager.vms.get(targetId));
    topologyManager.addInterface(sourceInterface);
    topologyManager.addInterface(targetInterface);

    const tooltipContent = `<b>Nombre:</b> ${linkName || defaultName}`;
    edgeTooltips.set(linkData.id, tooltipContent);

    visDataset.edges.add({
        id: linkId,
        from: sourceId,
        to: targetId,
        label: linkName,
        title: undefined,
    });
}

function createLinearTopology(vmCount, imageId, flavorId) {
    const centerY = 0;
    const spacing = 200;
    const startX = -(vmCount - 1) * spacing / 2;
    const vmIds = [];
    
    for (let i = 0; i < vmCount; i++) {
        const x = startX + (i * spacing);
        vmIds.push(createTemplateVM(x, centerY, imageId, flavorId));
    }

    for (let i = 0; i < vmCount - 1; i++) {
        createTemplateLink(vmIds[i], vmIds[i + 1]);
    }

    updateResourceInfo();
    arrangeTopology();
}

function createRingTopology(vmCount, imageId, flavorId) {
    const radius = vmCount * 50;
    const vmIds = [];
    
    for (let i = 0; i < vmCount; i++) {
        const angle = (2 * Math.PI * i) / vmCount;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        vmIds.push(createTemplateVM(x, y, imageId, flavorId));
    }

    for (let i = 0; i < vmCount; i++) {
        createTemplateLink(vmIds[i], vmIds[(i + 1) % vmCount]);
    }

    updateResourceInfo();
    arrangeTopology();
}

function createMeshTopology(vmCount, imageId, flavorId) {
    const radius = vmCount * 50;
    const vmIds = [];
    
    for (let i = 0; i < vmCount; i++) {
        const angle = (2 * Math.PI * i) / vmCount;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        vmIds.push(createTemplateVM(x, y, imageId, flavorId));
    }

    for (let i = 0; i < vmCount; i++) {
        for (let j = i + 1; j < vmCount; j++) {
            createTemplateLink(vmIds[i], vmIds[j]);
        }
    }

    updateResourceInfo();
    arrangeTopology();
}

function createStarTopology(vmCount, imageId, flavorId) {
    const radius = vmCount * 50;
    const vmIds = [];
    const centerId = createTemplateVM(0, 0, imageId, flavorId);
    vmIds.push(centerId);

    for (let i = 1; i < vmCount; i++) {
        const angle = (2 * Math.PI * (i - 1)) / (vmCount - 1);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        vmIds.push(createTemplateVM(x, y, imageId, flavorId));
    }

    for (let i = 1; i < vmCount; i++) {
        createTemplateLink(centerId, vmIds[i]);
    }

    updateResourceInfo();
    arrangeTopology();
}

// ===================== ACCIONES RÁPIDAS =====================

function arrangeTopology() {
    if (!network || visDataset.nodes.length === 0) return;

    network.setOptions({ physics: { enabled: true } });
    network.stabilize(80);
    
    setTimeout(() => {
        network.setOptions({ physics: { enabled: false } });
        // Final fit
        network.fit({
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });
    }, 800);
}

window.autoArrangeTopology = function() {
    arrangeTopology();
}

window.clearTopology = function() {
    visDataset.nodes.clear();
    visDataset.edges.clear();
    topologyManager.vms.clear();
    topologyManager.links.clear();
    topologyManager.interfaces.clear();
    topologyManager.visNodes.clear();
    topologyManager.visEdges.clear();
    nodeTooltips.clear();
    edgeTooltips.clear();
    updateResourceInfo();
    network.fit({
        animation: {
            duration: 500,
            easingFunction: 'easeInOutQuad'
        }
    });
}

// ===================== IMPORTAR Y EXPORTAR | FUNCIONES ÚTILES =====================
window.exportTopology = function() {
    if (!topologyManager || topologyManager.vms.size === 0) {
        Swal.fire({
            title: 'Topología Vacía',
            text: 'No hay topología para exportar',
            icon: 'warning',
            confirmButtonText: 'Entendido',
            customClass: {
                confirmButton: 'btn bg-gradient-primary'
            },
            buttonsStyling: false
        });
        return;
    }

    const exportData = {
        topology_info: {
            vms: Array.from(topologyManager.vms.values()).map(vm => ({
                id: vm.id,
                name: vm.name,
                image_id: vm.image_id,
                flavor_id: vm.flavor_id
            })),
            links: Array.from(topologyManager.links.values()).map(link => ({
                id: link.id,
                name: link.name
            })),
            interfaces: Array.from(topologyManager.interfaces.values()).map(iface => ({
                id: iface.id,
                name: iface.name,
                vm_id: iface.vm_id,
                link_id: iface.link_id,
                mac_address: iface.mac_address,
                external_access: iface.external_access
            }))
        },
        topology_graph: {
            nodes: Array.from(topologyManager.visNodes.values()).map(node => ({
                id: node.id,
                label: node.label,
                title: nodeTooltips.get(node.id) || node.title,
            })),
            edges: Array.from(topologyManager.visEdges.values()).map(edge => ({
                id: edge.id,
                from: visDataset.edges.get(edge.id).from,
                to: visDataset.edges.get(edge.id).to,
                label: edge.label
            }))
        }
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `topology-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

window.importTopology = function() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);

                clearTopology();

                importedData.topology_info.vms.forEach(vmData => {
                    const vm = new VM(
                        vmData.id,
                        vmData.name,
                        vmData.image_id,
                        vmData.flavor_id
                    );
                    // Crear tooltip para la VM
                    const image = AVAILABLE_IMAGES.find(img => img.id === parseInt(vm.image_id));
                    const flavor = AVAILABLE_FLAVORS.find(flav => flav.id === parseInt(vm.flavor_id));
                    const hasExternal = importedData.topology_info.interfaces.some(
                        iface => iface.vm_id === vm.id && iface.external_access
                    );

                    const tooltipContent = `<b>Nombre:</b> ${vm.name}
<b>Imagen:</b> ${image ? image.name : 'Desconocida'}
<b>Flavor:</b> ${flavor ? flavor.name : 'Desconocido'}
<b>Acceso externo:</b> ${hasExternal ? 'Sí' : 'No'}`;

                    // Guardar tooltip en el Map
                    nodeTooltips.set(vm.id, tooltipContent);
                    topologyManager.vms.set(vm.id, vm);
                });


                importedData.topology_info.links.forEach(linkData => {
                    const link = new Link(
                        linkData.id,
                        linkData.name
                    );
                    topologyManager.links.set(link.id, link);

                    // Crear tooltip para el enlace
                    const tooltipContent = `<b>Nombre:</b> ${link.name}`;
                    edgeTooltips.set(link.id, tooltipContent);
                });

                const vmsWithExternalAccess = new Set();
                importedData.topology_info.interfaces.forEach(ifaceData => {
                    if (ifaceData.external_access) {
                        vmsWithExternalAccess.add(ifaceData.vm_id);
                    }
                });

                importedData.topology_info.interfaces.forEach(ifaceData => {
                    const iface = new Interface(
                        ifaceData.id,
                        ifaceData.name,
                        ifaceData.vm_id,
                        ifaceData.link_id,
                        ifaceData.mac_address,
                        ifaceData.external_access
                    );
                    topologyManager.interfaces.set(iface.id, iface);

                    

                });

                const nodes = importedData.topology_info.vms.map(vm => {
                    const image = AVAILABLE_IMAGES.find(img => img.id === parseInt(vm.image_id));
                    const flavor = AVAILABLE_FLAVORS.find(flav => flav.id === parseInt(vm.flavor_id));
                    const hasExternal = vmsWithExternalAccess.has(vm.id);

                    const title = `<b>Nombre:</b> ${vm.name}
    <b>Imagen:</b> ${image ? image.name : vm.image_id}
    <b>Flavor:</b> ${flavor ? flavor.name : vm.flavor_id}
    <b>Acceso externo:</b> ${hasExternal ? 'Sí' : 'No'}`;

                    return {
                        id: vm.id,
                        label: vm.name,
                        title: undefined
                    };
                });

                const edges = importedData.topology_graph.edges;

                nodes.forEach(node => {
                    topologyManager.visNodes.set(node.id, new VisVM(
                        topologyManager.vms.get(node.id),
                        undefined
                    ));
                });

                edges.forEach(edge => {
                    topologyManager.visEdges.set(edge.id, new VisLink(
                        topologyManager.links.get(edge.id),
                        edge.from,
                        edge.to
                    ));
                });

                visDataset.nodes.add(nodes);
                visDataset.edges.add(edges);

                updateResourceInfo();

                setTimeout(() => {
                    arrangeTopology();
                }, 700);
                
            } catch (error) {
                console.error('Error :(:', error);
            }
        };
        
        reader.readAsText(file);
    };
    
    fileInput.click();
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

function validateTopology() {
    if (!topologyManager || topologyManager.vms.size === 0) {
        Swal.fire({
            title: 'Topología Vacía',
            text: 'Por favor añade elementos a tu sketch antes de guardarlo',
            icon: 'warning',
            confirmButtonText: 'Entendido',
            customClass: {
                confirmButton: 'btn bg-gradient-primary'
            },
            buttonsStyling: false
        });
        return false;
    }
    return true;
}

function updateResourceInfo() {
    let totalVCPUs = 0;
    let totalRAM = 0;
    let totalDisk = 0;

    // Iterate through all VMs in topology manager
    topologyManager.vms.forEach(vm => {
        // Find the flavor for this VM
        const flavor = AVAILABLE_FLAVORS.find(f => f.id === parseInt(vm.flavor_id));
        if (flavor) {
            totalVCPUs += Number(flavor.vcpus) || 0;
            totalRAM += Number(flavor.ram) || 0;
            totalDisk += Number(flavor.disk) || 0;
        }
    });


    const ramInGB = (totalRAM / 1000).toFixed(3);
    const formattedRAM = parseFloat(ramInGB).toString();

    // Update the DOM elements
    document.getElementById('sketchVCPUs').textContent = totalVCPUs;
    document.getElementById('sketchRAM').textContent = `${formattedRAM} GB`;
    document.getElementById('sketchDisk').textContent = `${totalDisk} GB`;
}

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

export { network, topologyManager };