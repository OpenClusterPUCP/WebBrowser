/*
==============================================================================
| ARCHIVO: slice-list.js
==============================================================================
| DESCRIPCIÓN:
| Script principal para la gestión y visualización de slices. Maneja la tabla
| interactiva, despliegue de nuevas slices y operaciones relacionadas.
==============================================================================
| CONTENIDO PRINCIPAL:
| 1. INICIALIZACIÓN
|    - Configuración de DataTables
|    - Event listeners
|    - Inicialización de componentes
|
| 2. GESTIÓN DE DATOS
|    - Carga de slices
|    - Formateo de datos
|    - Manejo de estados
|    - Conversión de valores
|
| 3. INTERFAZ DE USUARIO
|    - Renderizado de tabla
|    - Gestión de modales
|    - Tooltips y elementos UI
|    - Animaciones y transiciones
|
| 4. OPERACIONES DE SLICE
|    - Despliegue de slices
|    - Selección de sketches
|    - Previsualizaciones
|    - Validaciones
|
| 5. DEPENDENCIAS
|    - jQuery 3.7.0
|    - DataTables
|    - Select2
|    - SweetAlert2
|    - Bootstrap 5.3.2
==============================================================================
*/

$(document).ready(async function() {
   
    // ==================
    // VARIABLES::
    // ==================
    let table;
    let AVAILABLE_FLAVORS = [];
    let pendingOperations = new Map(); // Mapa para controlar operaciones pendientes
    let pollTimer = null; // Timer para consultar estado de operaciones

    // ==================
    // DATATABLES:
    // ==================
    async function loadSlices() {
        try {
            const response = await fetch('/User/api/slice/list');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Respuesta del servidor:', result);
            
            if (result.status !== 'success' || !result.content) {
                throw new Error(result.message || 'Error al cargar los slices');
            }
    
            return result.content;
        } catch (error) {
            console.error('Error cargando slices:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudieron cargar los slices',
                confirmButtonText: 'Entendido',
                customClass: {
                    confirmButton: 'btn bg-gradient-primary'
                },
                buttonsStyling: false
            });
            return [];
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

    function getStatusBadge(status) {
        let badgeClass, statusText;
        switch(status.toLowerCase()) {
            case 'running':
                badgeClass = 'bg-warning';
                statusText = 'EN EJECUCIÓN';
                break;
            case 'stopped':
                badgeClass = 'bg-danger';
                statusText = 'DETENIDO';
                break;
            default:
                badgeClass = 'bg-secondary';
                statusText = status;
        }
        return `<div class="d-flex justify-content-center align-items-center w-100">
                <span class="badge ${badgeClass}" style="min-width: 124px !important; text-align: center; margin: 0 auto;">${statusText}</span>
            </div>`;
    }

    // Función helper para truncar texto
    function truncateText(text, maxLength = 50) {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength)}...`;
    }

    // Inicialización de DataTable
    async function initializeTable() {
        const slices = await loadSlices();
        table = $('#slicesTable').DataTable({
            data: slices,
            columns: [
                { 
                    data: 'id',
                    render: function(data, type) {
                        if (type === 'sort') {
                            return parseInt(data);
                        }
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
                    data: 'resources',
                    render: data => `<span>${data?.vcpus || '0'}</span>`
                },
                { 
                    data: 'resources',
                    render: data => {
                        const ramInGB = data?.ram ? Math.round(data.ram / 1000 * 1000) / 1000 : 0;
                        return `<span>${ramInGB} GB</span>`;
                    }
                },
                { 
                    data: 'resources',
                    render: data => `<span>${data?.disk || '0'} GB</span>`
                },
                { 
                    data: 'resources',
                    render: data => `<span>${data?.vm_count || '0'}</span>`
                },
                { 
                    data: 'created_at',
                    render: data => `<span class="text-muted">${formatDate(data)}</span>`
                },
                { 
                    data: 'status',
                    render: data => getStatusBadge(data),
                    className: 'text-center'
                },
                {
                    data: null,
                    orderable: false,
                    className: 'text-center',
                    render: data => `
                        <div class="btn-group">
                            <button class="mb-0 btn btn-link text-dark action-btn view-slice" 
                                    data-id="${data.id}" title="Visualizar y gestionar">
                                <i class="fas fa-gear"></i>
                            </button>
                        </div>
                    `
                }
            ],
            language: {
                lengthMenu: "Mostrar _MENU_ registros por página",
                zeroRecords: "No se encontraron resultados",
                info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                infoEmpty: "Mostrando 0 a 0 de 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totales)",
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

    $('.status-filter').on('click', function() {
        $('.status-filter').removeClass('active');
        $(this).addClass('active');

        const status = $(this).data('status');
        
        table.search('').columns().search('').draw();

        if (status !== 'all') {
            table.column(8).search(status === 'running' ? 'EJECUCIÓN' : 'DETENIDO', true, false).draw();
        } else {
            table.draw();
        }
    });

    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const selectedStatus = $('.status-filter.active').data('status');
        if (selectedStatus === 'all') return true;
        
        const statusCell = data[8];
        
        switch(selectedStatus) {
            case 'running':
                return statusCell.includes('EN EJECUCIÓN');
            case 'stopped':
                return statusCell.includes('DETENIDO');
            default:
                return true;
        }
    });

    // Handlers para el botón de acción
    $('#slicesTable').on('click', '.view-slice', function() {
        const id = $(this).data('id');
        window.location.href = `/User/slice/${id}`;
    });

    // Inicializar
    await initializeTable();

    const resizeObserver = new ResizeObserver(entries => {
        table.columns.adjust();
    });

    resizeObserver.observe(document.querySelector('.table-responsive'));

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


    // ==================
    // DESPLIEGUE DE SLICE:
    // ==================

    $('#btnDeploySlice').click(async function() {
        try {
            console.log('Abriendo modal de despliegue...');
            
            // Limpiar el formulario
            $('#deploySliceForm').trigger('reset');
            $('#deploySliceForm').removeClass('was-validated');
            $('#sketchPreview').addClass('d-none').removeClass('show');
            
            // Cargar los sketches
            await loadSketches();
            
            // Mostrar el modal
            $('#deploySliceModal').modal('show');
        } catch (error) {
            console.error('Error preparando el modal:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los sketches disponibles'
            });
        }
    });

    async function loadFlavors() {
        try {
            const response = await fetch('/User/api/sketch/resources/flavors');
            const result = await response.json();
            if (result.status === 'success') {
                AVAILABLE_FLAVORS = result.content;
                console.log('Flavors loaded:', AVAILABLE_FLAVORS);
            } else {
                throw new Error('Error cargando los flavors');
            }
        } catch (error) {
            console.error('Error cargando los flavors:', error);
            AVAILABLE_FLAVORS = [];
        }
    }

    async function loadSketches() {
        try {
            await loadFlavors();
            console.log('Cargando lista de sketches...');
            const response = await fetch('/User/api/sketch/list');
            const result = await response.json();
            console.log('Respuesta de sketches:', result);
            
            if (result.status === 'success' && result.content) {
                const select = $('#sketchSelect');
                
                // Inicializar Select2 si aún no está inicializado
                if (!select.data('select2')) {
                    select.select2({
                        theme: 'bootstrap-5',
                        placeholder: 'Busca y selecciona un sketch',
                        allowClear: false,
                        width: '100%',
                        dropdownParent: $('#deploySliceModal'),
                        minimumResultsForSearch: 0,
                        templateResult: formatSketchOption,
                        templateSelection: formatSketchSelection,
                        escapeMarkup: function(markup) {
                            return markup;
                        }
                    }).on('select2:open', function() {
                        document.querySelector('.select2-search__field').focus();
                    }).on('select2:clearing', function(e) {
                        e.preventDefault();
                        const self = $(this);
                        setTimeout(() => {
                            self.select2('close');
                        }, 0);
                    });
                }
    
                // Limpiar y agregar la opción placeholder
                select.empty().append('<option></option>');
                
                // Agregar las opciones
                result.content.forEach(sketch => {
                    const option = new Option(
                        sketch.name,
                        sketch.id,
                        false,
                        false
                    );
                    
                    // Agregar datos adicionales al option
                    $(option).data('description', sketch.description);
                    $(option).data('vm-count', sketch.topology_info?.vms?.length || 0);
                    
                    select.append(option);
                });
                
                select.trigger('change');
            }
        } catch (error) {
            console.error('Error cargando sketches:', error);
            throw error;
        }
    }

    function formatSketchOption(sketch) {
        if (!sketch.id) return sketch.text;
        
        const $sketch = $(sketch.element);
        const description = $sketch.data('description');
        
        return $(`
            <div class="d-flex align-items-start p-2">
                <i class="fas fa-file-code text-warning mt-1 me-3"></i>
                <div>
                    <div class="fw-semibold">${sketch.text}</div>
                    ${description ? 
                        `<small class="text-muted d-block">${truncateText(description, 100)}</small>` : 
                        ''}
                </div>
            </div>
        `);
    }
    
    function formatSketchSelection(sketch) {
        if (!sketch.id) return sketch.text;
        return $(`
            <div class="d-flex align-items-center">
                <i class="fas fa-file-code text-warning me-2"></i>
                <span class="fw-semibold">${sketch.text}</span>
            </div>
        `);
    }



    $('#sketchSelect').on('select2:select', async function(e) {
        console.log('Sketch seleccionado:', this.value);
        const preview = document.getElementById('sketchPreview');
        
        if (this.value) {
            try {
                // Cargar los detalles del sketch seleccionado
                const response = await fetch(`/User/api/sketch/${this.value}`);
                const result = await response.json();
                console.log('Detalles del sketch:', result);
    
                if (result.data.status === 'success' && result.data) {
                    const sketch = result.data.content;
                    
                    // Verificar si existe topology_info directamente en el sketch
                    if (!sketch.topology_info) {
                        throw new Error('La estructura del sketch no es válida');
                    }
    
                    // Calcular recursos totales
                    let totalVCPUs = 0;
                    let totalRAM = 0;
                    let totalDisk = 0;

                    sketch.topology_info.vms.forEach(vm => {
                        const flavor = AVAILABLE_FLAVORS.find(f => f.id === parseInt(vm.flavor_id));
                        if (flavor) {
                            totalVCPUs += Number(flavor.vcpus) || 0;
                            totalRAM += Number(flavor.ram) || 0;
                            totalDisk += Number(flavor.disk) || 0;
                        }
                    });

                    // Convertir RAM a GB con formato preciso
                    const ramInGB = (totalRAM / 1000).toFixed(3);
                    const formattedRAM = parseFloat(ramInGB).toString();

                    // Actualizar recursos
                    document.getElementById('sketchPreviewVCPUs').textContent = totalVCPUs;
                    document.getElementById('sketchPreviewRAM').textContent = `${formattedRAM} GB`;
                    document.getElementById('sketchPreviewDisk').textContent = `${totalDisk} GB`;

                    // Actualizar contadores
                    document.getElementById('vmCount').textContent = sketch.topology_info.vms?.length || 0;
                    document.getElementById('linkCount').textContent = sketch.topology_info.links?.length || 0;
                    document.getElementById('interfaceCount').textContent = sketch.topology_info.interfaces?.length || 0;
                    
                    // Almacenar la estructura para usarla en el despliegue
                    const structureToStore = {
                        topology_info: sketch.topology_info
                    };
                    this.options[this.selectedIndex].setAttribute('data-structure', JSON.stringify(structureToStore));
                    
                    // Mostrar el preview con animación
                    preview.classList.remove('d-none');
                    setTimeout(() => {
                        preview.classList.add('show');
                        preview.classList.add('sketch-preview-enter');
                    }, 50);
                } else {
                    throw new Error('No se pudo obtener la información del sketch');
                }
            } catch (error) {
                console.error('Error al cargar detalles del sketch:', error);
                preview.classList.add('d-none');
                preview.classList.remove('show', 'sketch-preview-enter');
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo cargar la vista previa del sketch'
                });
            }
        }
    });
    
    $('#sketchSelect').on('select2:clear', function() {
        const preview = document.getElementById('sketchPreview');
        preview.classList.remove('show');
        setTimeout(() => {
            preview.classList.add('d-none');
            preview.classList.remove('sketch-preview-enter');
        }, 300);
    });

    // Manejo de mensajes de error:

    function showErrorAlert(error) {
        let errorMessage = '';
        let errorDetails = [];

        try {
            let errorData = null;
            
            if (typeof error === 'object' && error.response) {
                errorData = error.response;
            } else if (error.message && error.message.includes('{')) {
                const jsonStr = error.message.substring(
                    error.message.indexOf('{'),
                    error.message.lastIndexOf('}') + 1
                );
                errorData = JSON.parse(jsonStr);
            } else {
                errorMessage = error.message || 'Error desconocido';
            }

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


    // Despliegue del Slice:

    window.deploySlice = async function() {
        const form = document.getElementById('deploySliceForm');
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        // Mostrar loading alert
        const loadingAlert = Swal.fire({
            title: 'Procesando Solicitud...',
            text: 'Por favor espere mientras se procesa su solicitud',
            iconHtml: '<i class="fas fa-spinner fa-spin text-warning"></i>',
            customClass: {
                icon: 'border-0',
                confirmButton: 'btn btn-warning',
                cancelButton: 'btn btn-secondary'
            },
            buttonsStyling: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
        });

        const selectedSketch = document.getElementById('sketchSelect');
        const structureData = selectedSketch.options[selectedSketch.selectedIndex].getAttribute('data-structure');
        const structure = JSON.parse(structureData);
        const sliceName = document.getElementById('sliceName').value;
        const sliceDescription = document.getElementById('sliceDescription').value || null;
    

        const convertDecimalValues = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(convertDecimalValues);
            }
            if (obj && typeof obj === 'object') {
                const newObj = {};
                for (const key in obj) {
                    const value = obj[key];
                    if (typeof value === 'string' && !isNaN(value)) {
                        // Convert string numbers to actual numbers
                        newObj[key] = parseFloat(value);
                    } else if (typeof value === 'object' && value !== null && 'Decimal' in value) {
                        // Handle Decimal objects from Python
                        newObj[key] = parseFloat(value.toString());
                    } else if (value && typeof value === 'object') {
                        newObj[key] = convertDecimalValues(value);
                    } else {
                        newObj[key] = value;
                    }
                }
                return newObj;
            }
            return obj;
        };

        const sliceData = {
            slice_info: {
                name: sliceName,
                description: sliceDescription,
                sketch_id: parseInt(selectedSketch.value),
            },
            topology_info: convertDecimalValues(structure.topology_info)
        };
    
        console.log('Datos a enviar:', sliceData);

        try {
            const response = await fetch('/User/api/slice/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sliceData)
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.status === 'success') {
                // Cerrar modal
                $('#deploySliceModal').modal('hide');

                // Cerrar el indicador de carga
                loadingAlert.close();

                // Si tenemos un operation_id, registrar la operación para seguimiento
                if (result.content?.operation_id) {
                    const operationId = result.content.operation_id;
                    console.log(`Registrando operación de despliegue ID: ${operationId}`);

                    // Añadir a las operaciones pendientes
                    addPendingOperation(operationId, {
                        type: 'DEPLOY_SLICE',
                        sliceName: sliceName,
                        userId: result.content.user_id || null,
                        startTime: new Date()
                    });

                    // Mostrar mensaje de operación encolada
                    Swal.fire({
                        icon: 'info',
                        title: 'Solicitud Encolada',
                        text: 'Su solicitud de despliegue ha sido encolada y está siendo procesada. Puede monitorear su progreso en el panel de operaciones.',
                        confirmButtonText: 'Entendido',
                        customClass: {
                            confirmButton: 'btn btn-warning'
                        },
                        buttonsStyling: false
                    });
                } else {
                    // Si no tenemos operation_id, mostrar mensaje de éxito tradicional
                    Swal.fire({
                        icon: 'success',
                        title: '¡Slice Desplegada!',
                        text: result.message || 'La slice se ha desplegado correctamente',
                        showCancelButton: true,
                        confirmButtonText: 'Ver Slice',
                        cancelButtonText: 'Cerrar',
                        customClass: {
                            confirmButton: 'btn btn-warning',
                            cancelButton: 'btn btn-secondary',
                            actions: 'gap-2'
                        },
                        buttonsStyling: false,
                        reverseButtons: true
                    }).then((resultAlert) => {
                        if (resultAlert.isConfirmed && result.details?.slice_id) {
                            window.location.href = `/User/slice/${result.details.slice_id}`;
                        }
                    });

                    // Actualizar la tablita uwu
                    const newSlices = await loadSlices();
                    table.clear().rows.add(newSlices).draw();
                }
            } else {
                throw {
                    message: result.message || 'Error al desplegar la Slice',
                    details: result.details || [],
                    response: result
                };
            }
        } catch (error) {
            console.error('Error:', error);
            await showErrorAlert(error);
        } finally {
            if (Swal.isVisible() && loadingAlert) {
                loadingAlert.close();
            }
        }
    };

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // ==================
    // MONITOREO DE OPERACIONES:
    // ==================

    /**
     * Añade una nueva operación al registro de operaciones pendientes
     */
    function addPendingOperation(operationId, operationData) {
        pendingOperations.set(operationId, {
            ...operationData,
            startTime: new Date(),
            lastChecked: new Date(),
            checkCount: 0
        });

        // Iniciar el poll si no está corriendo
        startPollingIfNeeded();

        // Mostrar indicador visual
        showPendingOperationsIndicator();
    }

    /**
     * Inicia el proceso de consulta periódica si hay operaciones pendientes
     */
    function startPollingIfNeeded() {
        if (pendingOperations.size > 0 && !pollTimer) {
            console.log('Iniciando monitoreo de operaciones pendientes');
            pollTimer = setInterval(checkPendingOperations, 5000); // Revisar cada 5 segundos
        }
    }

    /**
     * Detiene el proceso de consulta periódica si no hay operaciones pendientes
     */
    function stopPollingIfDone() {
        if (pendingOperations.size === 0 && pollTimer) {
            console.log('Deteniendo monitoreo, no hay operaciones pendientes');
            clearInterval(pollTimer);
            pollTimer = null;
            hidePendingOperationsIndicator();
        }
    }

    /**
     * Verifica el estado de todas las operaciones pendientes
     */
    async function checkPendingOperations() {
        console.log(`Verificando ${pendingOperations.size} operaciones pendientes...`);

        // Si no hay operaciones, detener el polling
        if (pendingOperations.size === 0) {
            stopPollingIfDone();
            return;
        }

        // Array para Promise.all
        const checkPromises = [];

        // Para cada operación, crear una promesa de verificación
        pendingOperations.forEach((opData, opId) => {
            const checkPromise = checkOperationStatus(opId, opData)
                .catch(err => {
                    console.error(`Error verificando operación ${opId}:`, err);
                    // Incrementar contador de errores
                    opData.errorCount = (opData.errorCount || 0) + 1;

                    // Si hay demasiados errores, considerar la operación como fallida
                    if (opData.errorCount > 5) {
                        console.warn(`Demasiados errores, marcando operación ${opId} como fallida`);
                        removePendingOperation(opId);

                        // Mostrar alerta al usuario
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: `No se pudo verificar el estado de la operación ${opId} después de varios intentos.`,
                            footer: 'La operación podría haberse completado pero no pudimos confirmar su estado.'
                        });
                    }

                    return null; // Para que Promise.all no falle
                });

            checkPromises.push(checkPromise);
        });

        // Esperar a que todas las verificaciones terminen
        await Promise.all(checkPromises);

        // Actualizar indicador
        updatePendingOperationsIndicator();

        // Si no quedan operaciones, detener el polling
        stopPollingIfDone();
    }

    /**
     * Verifica el estado de una operación específica
     */
    async function checkOperationStatus(operationId, opData) {
        console.log(`Verificando estado de operación ${operationId}...`);

        // Actualizar contador y última verificación
        opData.checkCount += 1;
        opData.lastChecked = new Date();

        try {
            const response = await fetch('/User/api/slice/operations/' + operationId + '/status');
            if (!response.ok) {
                throw new Error(`Error en respuesta del servidor: ${response.status}`);
            }

            const result = await response.json();
            console.log(`Estado de operación ${operationId}:`, result);

            // Guardar el último estado recibido
            opData.lastStatus = result.content?.operation_status;

            // Si la operación ya no está pendiente o en progreso
            if (opData.lastStatus === 'COMPLETED' ||
                opData.lastStatus === 'FAILED' ||
                opData.lastStatus === 'CANCELLED' ||
                opData.lastStatus === 'TIMEOUT') {

                // Eliminar de las operaciones pendientes
                removePendingOperation(operationId);

                // Si se completó correctamente
                if (opData.lastStatus === 'COMPLETED') {
                    handleCompletedOperation(operationId, result, opData);
                } else {
                    // Si falló
                    handleFailedOperation(operationId, result, opData);
                }
            } else {
                // Actualizar la UI para mostrar progreso
                updateOperationProgress(operationId, result, opData);
            }

        } catch (error) {
            console.error(`Error consultando estado de operación ${operationId}:`, error);
            throw error; // Re-lanzar para manejo en checkPendingOperations
        }
    }

    /**
     * Maneja una operación completada correctamente
     */
    function handleCompletedOperation(operationId, result, opData) {
        console.log(`Operación ${operationId} completada correctamente`);

        // Si tiene slice_id, podemos navegar a ella
        const sliceId = result.content?.slice_id;

        // Mostrar notificación apropiada según el tipo de operación
        let message = 'Operación completada exitosamente.';
        let icon = 'success';
        let showViewButton = false;

        switch (opData.type) {
            case 'DEPLOY_SLICE':
                message = `¡Slice "${opData.sliceName}" desplegada exitosamente!`;
                showViewButton = true;
                break;
            case 'STOP_SLICE':
                message = `Slice "${opData.sliceName}" detenida correctamente.`;
                break;
            case 'RESTART_SLICE':
                message = `Slice "${opData.sliceName}" reiniciada correctamente.`;
                showViewButton = true;
                break;
        }

        // Notificar al usuario
        Swal.fire({
            icon: icon,
            title: '¡Operación Completada!',
            text: message,
            showCancelButton: showViewButton,
            confirmButtonText: 'Aceptar',
            cancelButtonText: showViewButton ? 'Ver Slice' : null,
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: showViewButton ? 'btn btn-warning' : ''
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel && sliceId) {
                // Navegar a la slice
                window.location.href = `/User/slice/${sliceId}`;
            } else {
                // Actualizar la tabla de slices
                refreshSlicesTable();
            }
        });
    }

    /**
     * Maneja una operación que ha fallado
     */
    function handleFailedOperation(operationId, result, opData) {
        console.log(`Operación ${operationId} ha fallado:`, result);

        // Preparar mensaje de error apropiado
        let message = 'La operación no pudo completarse.';
        let details = result.content?.error || result.message || 'Error desconocido';

        switch (opData.type) {
            case 'DEPLOY_SLICE':
                message = `Error al desplegar slice "${opData.sliceName}".`;
                break;
            case 'STOP_SLICE':
                message = `Error al detener slice "${opData.sliceName}".`;
                break;
            case 'RESTART_SLICE':
                message = `Error al reiniciar slice "${opData.sliceName}".`;
                break;
        }

        // Notificar al usuario
        Swal.fire({
            icon: 'error',
            title: 'Error en la Operación',
            html: `
                <p>${message}</p>
                <div class="border-top border-light mt-3 pt-3">
                    <p class="mb-2 text-start text-danger small">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong>Detalles del error:</strong>
                    </p>
                    <p class="text-start text-muted small">${details}</p>
                </div>
            `,
            confirmButtonText: 'Entendido',
            customClass: {
                confirmButton: 'btn btn-danger'
            },
            buttonsStyling: false
        }).then(() => {
            // Actualizar la tabla de slices
            refreshSlicesTable();
        });
    }

    /**
     * Actualiza la UI para mostrar el progreso de una operación
     */
    function updateOperationProgress(operationId, result, opData) {
        const status = result.content?.operation_status;
        const statusMessage = result.content?.status_message || 'En proceso...';

        // Si tenemos un elemento donde mostrar el progreso
        const progressContainer = $('#operationsProgressContainer');
        if (progressContainer.length) {
            // Actualizar o añadir el elemento de progreso
            let progressItem = $(`#operation-${operationId}`);
            if (!progressItem.length) {
                // Crear nuevo elemento de progreso
                progressItem = $(`
                    <div id="operation-${operationId}" class="operation-progress-item mb-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="operation-name">${opData.type}: ${opData.sliceName || operationId}</span>
                            <span class="operation-status badge bg-primary">${status}</span>
                        </div>
                        <div class="progress mt-1" style="height: 10px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                                role="progressbar" style="width: 0%">
                            </div>
                        </div>
                        <p class="status-message text-muted small mt-1">${statusMessage}</p>
                    </div>
                `);
                progressContainer.append(progressItem);
            } else {
                // Actualizar elemento existente
                progressItem.find('.operation-status').text(status);
                progressItem.find('.status-message').text(statusMessage);

                // Actualizar barra de progreso según tiempo transcurrido
                const elapsedSeconds = (Date.now() - opData.startTime) / 1000;
                const progressPercent = Math.min(
                    Math.round(elapsedSeconds / 60 * 100), // Suponemos 1 minuto para completar
                    95  // Nunca llegamos al 100% hasta que termine
                );
                progressItem.find('.progress-bar').css('width', `${progressPercent}%`);
            }
        }
    }

    /**
     * Elimina una operación del registro de pendientes
     */
    function removePendingOperation(operationId) {
        pendingOperations.delete(operationId);

        // Si ya no hay operaciones pendientes, detener el polling
        stopPollingIfDone();

        // Eliminar elemento visual si existe
        $(`#operation-${operationId}`).fadeOut('slow', function() {
            $(this).remove();
        });
    }

    /**
     * Muestra el indicador de operaciones pendientes
     */
    function showPendingOperationsIndicator() {
        // Verificar si ya existe el contenedor
        if ($('#operationsProgressContainer').length === 0) {
            // Crear el contenedor flotante
            const operationsContainer = $(`
                <div id="operationsProgressContainer" class="operations-progress-container">
                    <div class="operations-header">
                        <h6 class="mb-2">
                            <i class="fas fa-tasks me-2"></i>
                            Operaciones en Progreso
                            <span class="badge bg-warning text-white ms-2 operations-count">0</span>
                        </h6>
                    </div>
                    <div class="operations-list"></div>
                </div>
            `);

            // Añadir estilos CSS necesarios
            const styles = `
                <style>
                    .operations-progress-container {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background-color: white;
                        border-radius: 5px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
                        width: 300px;
                        max-height: 400px;
                        overflow-y: auto;
                        padding: 15px;
                        z-index: 1000;
                        transition: all 0.3s ease;
                    }
                    .operations-header {
                        border-bottom: 1px solid #f0f0f0;
                        margin-bottom: 10px;
                        padding-bottom: 8px;
                    }
                    .operation-progress-item {
                        padding: 8px;
                        border-radius: 4px;
                        background-color: #f8f9fa;
                    }
                </style>
            `;

            $('head').append(styles);
            $('body').append(operationsContainer);
        }

        // Actualizar contador
        updatePendingOperationsIndicator();
    }

    /**
     * Actualiza el contador de operaciones pendientes
     */
    function updatePendingOperationsIndicator() {
        const count = pendingOperations.size;
        $('.operations-count').text(count);

        // Si no hay operaciones, ocultar el contenedor
        if (count === 0) {
            $('#operationsProgressContainer').fadeOut('slow');
        } else {
            $('#operationsProgressContainer').fadeIn('fast');
        }
    }

    /**
     * Oculta el indicador de operaciones pendientes
     */
    function hidePendingOperationsIndicator() {
        $('#operationsProgressContainer').fadeOut('slow');
    }

    /**
     * Actualiza la tabla de slices
     */
    async function refreshSlicesTable() {
        const newSlices = await loadSlices();
        table.clear().rows.add(newSlices).draw();
    }

    // Verificar inicialmente si hay operaciones pendientes en sesión
    async function checkForPendingOperationsOnLoad() {
        try {
            const response = await fetch('/User/api/slice/user/pending-operations');
            if (response.ok) {
                const result = await response.json();
                if (result.content && Array.isArray(result.content.operations)) {
                    const pendingOps = result.content.operations;

                    if (pendingOps.length > 0) {
                        console.log(`Encontradas ${pendingOps.length} operaciones pendientes durante carga`);

                        // Registrar cada operación pendiente
                        pendingOps.forEach(op => {
                            addPendingOperation(op.id, {
                                type: op.operationType,
                                sliceName: op.sliceName || 'Slice',
                                userId: op.userId
                            });
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error verificando operaciones pendientes:', error);
        }
    }

    // Comprobar operaciones pendientes al cargar la página
    checkForPendingOperationsOnLoad();

});