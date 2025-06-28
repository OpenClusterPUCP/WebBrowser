/*
==============================================================================
| ARCHIVO: sketch-list.js
==============================================================================
| DESCRIPCIÓN:
| Script principal para la gestión y listado de sketches. Maneja la tabla
| interactiva y las operaciones CRUD sobre los sketches del usuario.
==============================================================================
| CONTENIDO PRINCIPAL:
| 1. INICIALIZACIÓN
|    - Configuración de DataTables
|    - Event listeners y handlers
|    - Setup de observadores
|    - Inicialización de componentes
|
| 2. GESTIÓN DE DATOS
|    - Carga de sketches
|    - Formateo de fechas
|    - Manejo de estados
|    - Operaciones CRUD
|
| 3. INTERFAZ DE USUARIO
|    - Renderizado de tabla
|    - Tooltips y elementos UI
|    - Responsive design
|    - Gestión del sidebar
|
| 4. OPERACIONES DE SKETCH
|    - Visualización
|    - Edición
|    - Eliminación
|    - Navegación
|
| 5. DEPENDENCIAS
|    - jQuery 3.7.0
|    - DataTables
|    - Bootstrap 5.3.2
|    - SweetAlert2
|    - Material Dashboard
|    - FontAwesome
==============================================================================
*/

$(document).ready(async function() {

    // ==================
    // VARIABLES::
    // ==================
    let table;
    let flavorCache = {};


    // ==================
    // DATATABLES:
    // ==================
    async function loadSketches() {
        try {
            const response = await fetch('/User/api/sketch/list');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Respuesta del servidor:', result); // Para debugging
            
            if (result.status !== 'success' || !result.content) {
                throw new Error(result.message || 'Error al cargar los sketches');
            }
    
            return result.content;
        } catch (error) {
            console.error('Error cargando sketches:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudieron cargar los sketches',
                confirmButtonText: 'Entendido',
                customClass: {
                    confirmButton: 'btn bg-gradient-primary'
                },
                buttonsStyling: false
            });
            return [];
        }
    }

    async function loadFlavors() {
        try {
            const response = await fetch('/User/api/sketch/resources/flavors');
            if (!response.ok) throw new Error('Error cargando flavors');
            const data = await response.json();
            console.log('Respuesta del servidor de flavors:', data);

            if (data.status === 'success' && Array.isArray(data.content)) {
                data.content.forEach(flavor => {
                    flavorCache[flavor.id] = {
                        vcpus: Number(flavor.vcpus) || 0,
                        ram: Number(flavor.ram) || 0,
                        disk: Number(flavor.disk) || 0
                    };
                });
                console.log('Cache de flavors después de conversión:', flavorCache);
            }
        } catch (error) {
            console.error('Error cargando flavors:', error);
        }
    }

    function formatDate(dateString) {
        if (!dateString) return 'No disponible';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Función helper para truncar texto
    function truncateText(text, maxLength = 50) {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength)}...`;
    }

    // Inicialización de DataTable
    async function initializeTable() {
        await loadFlavors();
        const sketches = await loadSketches();
        console.log('Sketches cargados:', sketches);

        table = $('#sketchesTable').DataTable({
            data: sketches,
            columns: [
                { 
                    data: 'id',
                    render: function(data, type) {
                        // Para ordenamiento, retornar solo el número
                        if (type === 'sort') {
                            return parseInt(data);
                        }
                        // Para visualización, retornar el formato con #
                        return `<span class="fw-semibold">#${String(data)}</span>`;
                    },
                    type: 'num'
                },
                { 
                    data: 'name',
                    render: function(data, type) {
                        if (type === 'display') {
                            const truncated = truncateText(data, 30);
                            if (data.length > 30) {
                                return `<span class="text-truncate" 
                                             data-bs-toggle="tooltip" 
                                             data-bs-placement="top" 
                                             title="${data.replace(/"/g, '&quot;')}">${truncated}</span>`;
                            }
                            return `<span class="fw-semibold text-dark">${data}</span>`;
                        }
                        return data;
                    }
                },
                { 
                    data: 'description',
                    render: function(data, type) {
                        if (type === 'display') {
                            if (!data) return '<span class="text-muted">N/A</span>';
                            
                            const truncated = truncateText(data, 50);
                            if (data.length > 50) {
                                return `
                                    <span class="text-truncate cursor-pointer" 
                                          data-bs-toggle="tooltip"
                                          data-bs-placement="top"
                                          data-bs-html="true"
                                          title="${data.replace(/"/g, '&quot;')}">${truncated}</span>`;
                            }
                            return `<span>${data}</span>`;
                        }
                        return data;
                    }
                },
                {
                    data: null,
                    title: 'VCPUs',
                    className: 'text-start',
                    render: function(data) {
                        let totalVCPUs = 0;
                        if (data.vms && Array.isArray(data.vms)) {
                            data.vms.forEach(vm => {
                                if (vm.flavor_id && flavorCache[vm.flavor_id]) {
                                    totalVCPUs += Number(flavorCache[vm.flavor_id].vcpus) || 0;
                                }
                            });
                        }
                        return `<span class="text-muted">${totalVCPUs}</span>`;
                    }
                },
                {
                    data: null,
                    title: 'RAM',
                    className: 'text-start',
                    render: function(data) {
                        let totalRAM = 0;
                        if (data.vms && Array.isArray(data.vms)) {
                            data.vms.forEach(vm => {
                                if (vm.flavor_id && flavorCache[vm.flavor_id]) {
                                    totalRAM += Number(flavorCache[vm.flavor_id].ram) || 0;
                                }
                            });
                        }
                        const ramInGB = (totalRAM / 1000).toFixed(3);
                        const formattedRAM = parseFloat(ramInGB).toString();
                        
                        return `<span class="text-muted">${formattedRAM} GB</span>`;
                    }
                },
                {
                    data: null,
                    title: 'Disco',
                    className: 'text-start',
                    render: function(data) {
                        let totalDisk = 0;
                        if (data.vms && Array.isArray(data.vms)) {
                            data.vms.forEach(vm => {
                                if (vm.flavor_id && flavorCache[vm.flavor_id]) {
                                    totalDisk += Number(flavorCache[vm.flavor_id].disk) || 0;
                                }
                            });
                        }
                        return `<span class="text-muted">${totalDisk} GB</span>`;
                    }
                },
                { 
                    data: 'vm_count',
                    render: data => `<span class="text-muted">${data}</span>`
                },
                { 
                    data: 'created_at',
                    render: data => `<span class="text-muted">${formatDate(data)}</span>`
                },
                { 
                    data: 'updated_at',
                    render: data => `<span class="text-muted">${formatDate(data)}</span>`
                },
                {
                    data: null,
                    orderable: false,
                    className: 'text-center',
                    render: data => `
                        <div class="btn-group">
                            <button class="mb-0 btn btn-link text-dark action-btn view-sketch" data-id="${data.id}" title="Ver">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="mb-0 btn btn-link text-dark action-btn edit-sketch" data-id="${data.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="mb-0 btn btn-link text-dark action-btn delete-sketch" data-id="${data.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `
                }
            ],
            language: {
                lengthMenu: "Mostrar _MENU_ sketchs por página",
                zeroRecords: "No se encontraron resultados",
                info: "Mostrando _START_ a _END_ de _TOTAL_ sketchs",
                infoEmpty: "Mostrando 0 a 0 de 0 sketchs",
                infoFiltered: "(filtrado de _MAX_ sketchs totales)",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior"
                },
                search: "Buscar:",
                loadingRecords: "Cargando...",
                processing: "Procesando..."
            },
            responsive: false,
            pageLength: 5,
            lengthMenu: [[5, 10, 25, 50], [5, 10, 25, 50]],
            dom: '<"row mb-3"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                '<"row"<"col-sm-12 table-responsive"tr>>' +
                '<"row table-footer"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            order: [[0, 'desc']],
            orderCellsTop: true,
            scrollX: true,
            scrollCollapse: true,
            autoWidth: false,
            drawCallback: function() {
                // Inicializar tooltips después de cada redibujado de la tabla
                const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.map(function (tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl, {
                        trigger: 'hover',
                        container: 'body'
                    });
                });
            }
        });
    }

    // Ajustar la tabla cuando cambie el tamaño de la ventana
    const resizeObserver = new ResizeObserver(entries => {
        table.columns.adjust();
    });

    // Inicializar tabla
    await initializeTable();

    // Event handlers
    $('#sketchesTable').on('click', '.view-sketch', function() {
        const id = $(this).data('id');
        window.location.href = `/User/sketch/${id}`;
    });

    $('#sketchesTable').on('click', '.edit-sketch', function() {
        const id = $(this).data('id');
        window.location.href = `/User/sketch/edit/${id}`;
    });

    $('#sketchesTable').on('click', '.delete-sketch', async function() {
        const id = $(this).data('id');
        const sketchName = $(this).closest('tr').find('td:nth-child(2)').text();
        
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Se eliminará el sketch "${sketchName}"`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn bg-gradient-danger me-3',
                cancelButton: 'btn bg-gradient-secondary'
            },
            buttonsStyling: false
        });
    
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/User/api/sketch/${id}`, {
                    method: 'DELETE'
                });
                
                console.log('Respuesta raw del servidor del:', response); 
                const data = await response.json();
                console.log('Respuesta del servidor del:', data); // Para debugging
                console.log('Estado de la respuesta data:', data.data); // Para debugging
                console.log('Estado de la respuesta data content:', data.data.content); // Para debugging

                if (response.ok && data.success === true) {
                    // Remove row from DataTable
                    table.row($(this).closest('tr')).remove().draw();
    
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: 'El sketch ha sido eliminado correctamente',
                        confirmButtonText: 'Aceptar',
                        customClass: {
                            confirmButton: 'btn bg-gradient-primary'
                        },
                        buttonsStyling: false
                    });
                } else {
                    throw new Error(data.message || 'Error al eliminar el sketch');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message,
                    confirmButtonText: 'Entendido',
                    customClass: {
                        confirmButton: 'btn bg-gradient-primary'
                    },
                    buttonsStyling: false
                });
            }
        }
    });


    // Observar cambios en el contenedor de la tabla
    resizeObserver.observe(document.querySelector('.table-responsive'));

    // Ajuste inicial
    table.columns.adjust();


    // ==================
    // NAVEGACIÓN:
    // ==================

    // Referencias de elementos DOM
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuToggle = document.querySelector('.menu-toggle');
   
    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        mainContent.classList.toggle('full-width');
    }
    
    sidebarToggle.addEventListener('click', toggleSidebar);
    menuToggle.addEventListener('click', toggleSidebar);

    // Botón de crear nuevo sketch
    document.getElementById('btnCreateSketch').addEventListener('click', function() {
        window.location.href = '/User/sketch/creator';
    });


});