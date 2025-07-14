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

    // WebSocket y notificaciones en tiempo real
    let socket = null;
    let pendingOperations = new Map(); // Mapa para controlar operaciones pendientes
    let isConnected = false;


    // ==================
// FUNCIONES PARA OBTENER DATOS DE SESIÓN:
// ==================

    function getUserProfileFromSession() {
        try {
            const profileMeta = document.querySelector('meta[name="user-profile"]');
            if (profileMeta && profileMeta.content && profileMeta.content.trim() !== '') {
                return profileMeta.content.trim().toLowerCase();
            }
            console.warn('No se encontró perfil de usuario en meta tag');
            return null;
        } catch (error) {
            console.error('Error obteniendo perfil de usuario desde sesión:', error);
            return null;
        }
    }

    function getUserIdFromSession() {
        try {
            const userIdMeta = document.querySelector('meta[name="user-id"]');
            if (userIdMeta && userIdMeta.content && userIdMeta.content.trim() !== '') {
                return parseInt(userIdMeta.content.trim());
            }
            console.warn('No se encontró ID de usuario en meta tag');
            return null;
        } catch (error) {
            console.error('Error obteniendo ID de usuario desde sesión:', error);
            return null;
        }
    }

    function getUserNameFromSession() {
        try {
            const userNameMeta = document.querySelector('meta[name="user-name"]');
            if (userNameMeta && userNameMeta.content && userNameMeta.content.trim() !== '') {
                return userNameMeta.content.trim();
            }
            return 'Usuario';
        } catch (error) {
            console.error('Error obteniendo nombre de usuario desde sesión:', error);
            return 'Usuario';
        }
    }

    function updateUserProfileDisplay() {
        const profile = getUserProfileFromSession();
        const userName = getUserNameFromSession();

        const profileDisplay = document.getElementById('userProfileDisplay');
        const profileBadge = document.getElementById('userProfileBadge');

        if (profile && profileDisplay) {
            const profileMap = {
                'alumno': 'Alumno',
                'jp': 'Jefe de Práctica',
                'maestro': 'Maestro',
                'investigador': 'Investigador'
            };

            const profileText = profileMap[profile] || profile.charAt(0).toUpperCase() + profile.slice(1);
            profileDisplay.textContent = `${profileText} (${userName})`;

            if (profileBadge) {
                profileBadge.textContent = 'SESIÓN';
                profileBadge.className = 'badge bg-success text-white ms-auto';
            }
        } else if (profileDisplay) {
            profileDisplay.textContent = 'Error obteniendo perfil';
            profileDisplay.className = 'text-danger';

            if (profileBadge) {
                profileBadge.textContent = 'ERROR';
                profileBadge.className = 'badge bg-danger text-white ms-auto';
            }
        }
    }

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
                    data: 'infrastructure',
                    render: function(data, type) {
                        if (type === 'display') {
                            if (!data) return '<span class="text-muted">N/A</span>';
                            
                            let textColorClass = 'text-secondary';
                            
                            // Asignar colores diferentes según la infraestructura
                            if (data.toLowerCase().includes('openstack')) {
                                textColorClass = 'text-primary fw-bold';
                            } else if (data.toLowerCase().includes('amazon')) {
                                textColorClass = 'text-info fw-bold';
                            } else {
                                textColorClass = 'text-success fw-bold';
                            }
                            
                            return `<div class="d-flex w-100">
                                <span class="${textColorClass}">${data}</span>
                            </div>`;
                        }
                        return data || '';
                    }
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
                                <i class="fas fa-gear me-3"></i>
                            </button>
                        </div>
                    `
                }
            ],
            language: {
                lengthMenu: "Mostrar _MENU_ slices por página",
                zeroRecords: "No se encontraron resultados",
                info: "Mostrando _START_ a _END_ de _TOTAL_ slices",
                infoEmpty: "Mostrando 0 a 0 de 0 slices",
                infoFiltered: "(filtrado de _MAX_ slices totales)",
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

    $('.status-filter[data-status="running"]').addClass('active');

    $('.status-filter').on('click', function() {
        $('.status-filter').removeClass('active');
        $(this).addClass('active');

        const status = $(this).data('status');
        
        table.search('').columns().search('').draw();

        if (status !== 'all') {
            table.column(9).search(status === 'running' ? 'EJECUCIÓN' : 'DETENIDO', true, false).draw();
        } else {
            table.draw();
        }
    });

    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const selectedStatus = $('.status-filter.active').data('status');
        if (selectedStatus === 'all') return true;
        
        const statusCell = data[9];
        
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
    table.column(9).search('EJECUCIÓN', true, false).draw();

    initializeWebSocket();

    const resizeObserver = new ResizeObserver(entries => {
        table.columns.adjust();
    });

    resizeObserver.observe(document.querySelector('.table-responsive'));

    // ==================
    // ZONAS:
    // ==================

    async function loadAvailabilityZones() {
        try {
            console.log('Cargando zonas de disponibilidad...');
            
            // Obtener el token JWT del meta tag
            const authToken = getAuthToken();

            const gatewayUrl = '/User/api/slice'
            
            const response = await fetch(gatewayUrl+'/availability-zones', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken
                }
            });
            
            const result = await response.json();
            console.log('Respuesta de zonas de disponibilidad:', result);
            
            if (result.status === 'success' && result.content) {
                const select = $('#availabilityZoneSelect');
                
                if (!select.data('select2')) {
                    select.select2({
                        theme: 'bootstrap-5',
                        placeholder: 'Selecciona una zona de disponibilidad',
                        allowClear: false,
                        width: '100%',
                        dropdownParent: $('#deploySliceModal'),
                        minimumResultsForSearch: 0,
                        templateResult: formatAvailabilityZoneOption,
                        templateSelection: formatAvailabilityZoneSelection,
                        escapeMarkup: function(markup) {
                            return markup;
                        }
                    }).on('select2:open', function() {
                        document.querySelector('.select2-search__field').focus();
                    });
                }

                // Limpiar y agregar la opción placeholder
                select.empty().append('<option></option>');
                
                // Agregar las opciones
                result.content.forEach(zone => {
                    const option = new Option(
                        zone.name,
                        zone.id,
                        false,
                        false
                    );
                    
                    // Agregar datos adicionales al option
                    $(option).data('description', zone.description);
                    $(option).data('infrastructure', zone.infrastructure);
                    $(option).data('worker-count', zone.worker_count);
                    
                    select.append(option);
                });
                
                select.trigger('change');
            } else {
                console.error('Error en la respuesta al cargar zonas:', result);
                throw new Error(result.message || 'No se pudieron cargar las zonas de disponibilidad');
            }
        } catch (error) {
            console.error('Error cargando zonas de disponibilidad:', error);
            throw error;
        }
    }

    function formatAvailabilityZoneOption(zone) {
        if (!zone.id) return zone.text;
        
        const $zone = $(zone.element);
        const description = $zone.data('description');
        const infrastructure = $zone.data('infrastructure');
        const workerCount = $zone.data('worker-count');
        
        return $(`
            <div class="d-flex align-items-start p-2">
                <i class="fas fa-server text-warning mt-1 me-3"></i>
                <div>
                    <div class="fw-semibold">${zone.text}</div>
                    ${description ? 
                        `<small class="text-muted d-block">${truncateText(description, 100)}</small>` : 
                        ''}
                    <div class="mt-1">
                        ${infrastructure == "OpenStack" ? 
                            `<span class="badge bg-primary me-2">${infrastructure}</span>` :
                            `<span class="badge bg-success me-2">${infrastructure}</span>`
                        }
                        <span class="badge bg-dark">${workerCount} worker${workerCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
        `);
    }

    function formatAvailabilityZoneSelection(zone) {
        if (!zone.id) return zone.text;
        return $(`
            <div class="d-flex align-items-center">
                <i class="fas fa-server text-warning me-2"></i>
                <span class="fw-semibold">${zone.text}</span>
            </div>
        `);
    }

    // ==================
    // WEBSOCKET Y NOTIFICACIONES EN TIEMPO REAL:
    // ==================

    function initializeWebSocket() {
        try {
            console.log('🚀 Inicializando WebSocket...');

            // Obtener token de autenticación
            const token = getAuthToken();
            if (!token) {
                console.error('❌ No se encontró token JWT');
                showNotification('No se puede conectar al sistema de notificaciones: Token no disponible', 'error');
                return;
            }

            console.log('✅ Token JWT obtenido exitosamente');

            // Desconectar socket existente si hay uno
            if (socket && socket.connected) {
                console.log('🔄 Desconectando socket existente...');
                socket.disconnect();
            }

            // CONECTAR AL API GATEWAY (puerto 8090), NO al web module (8095)
            const gatewayUrl = 'http://192.168.202.3:8090';
            console.log(`🔗 Conectando a API Gateway: ${gatewayUrl}`);

            socket = io(gatewayUrl, {
                path: '/slice-manager/socket.io/',  // Path a través del gateway
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true,
                forceNew: true,
                timeout: 20000,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000
            });

            // === EVENT LISTENERS ===

            socket.on('connect', () => {
                console.log('🟢 WebSocket conectado exitosamente');
                console.log('   Socket ID:', socket.id);
                console.log('   Transport:', socket.io.engine.transport.name);
                isConnected = true;
                updateConnectionStatus(true);

                // Limpiar flag de error
                window.websocketErrorShown = false;
            });

            socket.on('disconnect', (reason) => {
                console.log('🔴 WebSocket desconectado:', reason);
                isConnected = false;
                updateConnectionStatus(false);

                // Solo intentar reconectar si no fue una desconexión intencional
                if (reason !== 'io client disconnect') {
                    console.log('🔄 Programando reconexión en 5 segundos...');
                    setTimeout(() => {
                        if (!isConnected && socket && !socket.connected) {
                            console.log('🔄 Intentando reconectar...');
                            socket.connect();
                        }
                    }, 5000);
                }
            });

            socket.on('connect_error', (error) => {
                console.error('❌ Error de conexión WebSocket:', error);
                console.error('   Descripción:', error.description);
                console.error('   Tipo:', error.type);
                isConnected = false;
                updateConnectionStatus(false);

                // Mostrar error solo una vez
                if (!window.websocketErrorShown) {
                    let errorMsg = 'Error conectando al sistema de notificaciones';
                    if (error.description) {
                        errorMsg += ': ' + error.description;
                    }
                    showNotification(errorMsg, 'error');
                    window.websocketErrorShown = true;
                }
            });

            // === EVENT LISTENERS DE LA APLICACIÓN ===

            socket.on('connected', (data) => {
                console.log('✅ WebSocket autenticado exitosamente:', data);
                showNotification('Conectado al sistema de notificaciones en tiempo real', 'success');
            });

            socket.on('operation_started', (data) => {
                console.log('🚀 Operación iniciada:', data);
                handleOperationStarted(data);
            });

            socket.on('operation_update', (data) => {
                console.log('🔄 Actualización de operación:', data);
                handleOperationUpdate(data);
            });

            socket.on('operation_completed', (data) => {
                console.log('✅ Operación completada:', data);
                handleOperationCompleted(data);
            });

            socket.on('operation_failed', (data) => {
                console.log('❌ Operación fallida:', data);
                handleOperationFailed(data);
            });

            // === DEBUG EVENTS ===
            socket.on('error', (error) => {
                console.error('🐛 Socket.IO Error:', error);
            });

            socket.onAny((event, ...args) => {
                console.log(`📨 Evento recibido: ${event}`, args);
            });

        } catch (error) {
            console.error('💥 Error fatal inicializando WebSocket:', error);
            showNotification('Error crítico en el sistema de notificaciones', 'error');
        }
    }

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

    function updateConnectionStatus(connected) {
        // Actualizar indicador visual de conexión si existe
        const indicator = document.getElementById('ws-connection-indicator');
        if (indicator) {
            indicator.className = connected ? 'ws-connected' : 'ws-disconnected';
            indicator.title = connected ? 'Conectado al sistema de notificaciones' : 'Desconectado del sistema de notificaciones';
        }
    }

    // Manejadores de eventos WebSocket
    function handleOperationStarted(data) {
        console.log('🚀 Operación iniciada:', data);

        // Agregar a operaciones pendientes
        pendingOperations.set(data.operation_id, {
            ...data,
            startTime: new Date()
        });

        // Mostrar progress card
        showProgressCard(data);

        // Mostrar notificación
        showNotification(`Solicitud "${data.slice_name || 'Nueva slice'}" iniciada`, 'info');
    }

    function handleOperationUpdate(data) {
        console.log('🔄 Actualización de operación:', data);

        // Actualizar progress card si existe
        updateProgressCard(data.operation_id, data);

        // Mostrar notificación
        showNotification(data.message || 'Operación en progreso...', 'info');
    }


    function handleOperationCompleted(data) {
        console.log('✅ Operación completada:', data);

        // Remover de operaciones pendientes
        pendingOperations.delete(data.operation_id);

        // Actualizar progress card a éxito
        completeProgressCard(data.operation_id, true, data.message || 'Operación completada');

        // Actualizar tabla de slices después de un breve delay
        setTimeout(async () => {
            console.log('🔄 Actualizando tabla de slices...');
            try {
                const newSlices = await loadSlices();
                table.clear().rows.add(newSlices).draw();
                console.log('✅ Tabla actualizada exitosamente');
            } catch (error) {
                console.error('❌ Error actualizando tabla:', error);
            }
        }, 1500);

        // Mostrar notificación de éxito
        showNotification(data.message || 'Slice desplegada exitosamente', 'success');
    }

    function handleOperationFailed(data) {
        console.log('❌ Operación fallida:', data);

        // Remover de operaciones pendientes
        pendingOperations.delete(data.operation_id);

        // Actualizar progress card a error
        completeProgressCard(data.operation_id, false, data.error || data.message || 'Error en la operación');

        // Mostrar notificación de error
        showNotification(data.error || data.message || 'Error en la operación', 'error');
    }

    // ==================
    // PROGRESS CARDS (NOTIFICACIONES VISUALES):
    // ==================

    function showProgressCard(operationData) {
        const containerId = 'progress-cards-container';
        let container = document.getElementById(containerId);

        // Crear contenedor si no existe
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'progress-cards-container';
            document.body.appendChild(container);
        }

        // Crear progress card
        const card = document.createElement('div');
        card.id = `progress-card-${operationData.operation_id}`;
        card.className = 'progress-card';
        card.innerHTML = `
            <div class="progress-card-header">
                <h6 class="mb-1">${operationData.slice_name || 'Operación'}</h6>
                <button class="btn-close-card" onclick="closeProgressCard('${operationData.operation_id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="progress-card-body">
                <div class="progress-message">${operationData.message}</div>
                <div class="progress-bar-container mt-2">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: 10%"></div>
                    </div>
                </div>
                <div class="progress-status mt-2">
                    <span class="status-badge status-pending">
                        <i class="fas fa-clock"></i> ${operationData.status}
                    </span>
                </div>
            </div>
        `;

        // Agregar al contenedor con animación
        container.appendChild(card);
        setTimeout(() => card.classList.add('show'), 100);

        // Auto-cerrar después de 30 segundos si no se completa
        setTimeout(() => {
            if (document.getElementById(card.id)) {
                closeProgressCard(operationData.operation_id);
            }
        }, 30000);
    }

    function updateProgressCard(operationId, data) {
        const card = document.getElementById(`progress-card-${operationId}`);
        if (!card) {
            console.warn(`No se encontró progress card para operación ${operationId}`);
            return;
        }

        // Actualizar mensaje
        const messageEl = card.querySelector('.progress-message');
        if (messageEl) messageEl.textContent = data.message;

        // Actualizar barra de progreso
        const progressFill = card.querySelector('.progress-bar-fill');
        if (progressFill) {
            let progress = '50%'; // Default
            if (data.status === 'PROCESSING') progress = '70%';
            if (data.status === 'IN_PROGRESS') progress = '60%';
            progressFill.style.width = progress;
        }

        // Actualizar status badge
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${data.status}`;
            statusBadge.className = 'status-badge status-processing';
        }
    }

    function completeProgressCard(operationId, success, message) {
        const card = document.getElementById(`progress-card-${operationId}`);
        if (!card) return;

        // Actualizar mensaje
        const messageEl = card.querySelector('.progress-message');
        if (messageEl) messageEl.textContent = message;

        // Completar barra de progreso
        const progressFill = card.querySelector('.progress-bar-fill');
        if (progressFill) {
            progressFill.style.width = '100%';
            progressFill.className = `progress-bar-fill ${success ? 'success' : 'error'}`;
        }

        // Actualizar status badge
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            const icon = success ? 'fa-check' : 'fa-times';
            const status = success ? 'COMPLETADO' : 'ERROR';
            statusBadge.innerHTML = `<i class="fas ${icon}"></i> ${status}`;
            statusBadge.className = `status-badge ${success ? 'status-success' : 'status-error'}`;
        }

        // Auto-cerrar después de 5 segundos si es éxito, 10 si es error
        const autoCloseDelay = success ? 5000 : 10000;
        setTimeout(() => {
            closeProgressCard(operationId);
        }, autoCloseDelay);
    }

    window.closeProgressCard = function(operationId) {
        const card = document.getElementById(`progress-card-${operationId}`);
        if (card) {
            card.classList.add('hide');
            setTimeout(() => {
                if (card.parentNode) {
                    card.parentNode.removeChild(card);
                }
            }, 300);
        }
    }

    function showNotification(message, type = 'info') {
        // Crear notificación toast simple
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${type}`;
        toast.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Agregar al body
        document.body.appendChild(toast);

        // Mostrar con animación
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-remover después de 4 segundos
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info':
            default: return 'fa-info-circle';
        }
    }

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

            // Cargar los sketches y las zonas de disponibilidad
            await Promise.all([
                loadSketches(),
                loadAvailabilityZones()
            ]);

            // Actualizar display del perfil de usuario
            updateUserProfileDisplay();
            
            // Mostrar el modal
            $('#deploySliceModal').modal('show');
        } catch (error) {
            console.error('Error preparando el modal:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los recursos necesarios'
            });
        }
    });

    async function loadFlavors() {
        try {
            console.log('Cargando flavors disponibles...');
            const response = await fetch('/User/api/sketch/resources/flavors');
            const result = await response.json();
            console.log('Respuesta de flavors:', result);

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

    $('#sketchSelect').on('change', function() {
        const selectedSketch = $(this).val();
        if (selectedSketch) {
            $('#sketchPreview').removeClass('d-none');

            // Asegurar que el scroll externo funcione correctamente
            $('body').css('overflow', 'auto');
        } else {
            $('#sketchPreview').addClass('d-none');
        }
    });

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
        const availabilityZoneId = document.getElementById('availabilityZoneSelect').value;

        if (!availabilityZoneId) {
            loadingAlert.close();
            form.classList.add('was-validated');
            return;
        }

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

        // Obtener perfil de usuario desde meta tag (sesión)
        const userProfile = getUserProfileFromSession();
        const workloadType = document.getElementById('workloadTypeSelect').value;

        if (!userProfile || !workloadType) {
            form.classList.add('was-validated');
            Swal.fire({
                icon: 'error',
                title: 'Error de Datos',
                text: 'No se pudo obtener tu perfil de usuario o no seleccionaste el tipo de carga de trabajo.',
                confirmButtonText: 'Entendido',
                customClass: {
                    confirmButton: 'btn btn-danger'
                }
            });
            return;
        }

        const sliceData = {
            slice_info: {
                name: sliceName,
                description: sliceDescription,
                user_id: getUserIdFromSession(),
                sketch_id: parseInt(selectedSketch.value),
                availability_zone_id: parseInt(availabilityZoneId),
                user_profile: userProfile,
                workload_type: workloadType
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

                // Si tenemos un operation_id, las notificaciones llegarán vía WebSocket
                if (result.content?.operation_id) {
                    const operationId = result.content.operation_id;
                    console.log(`Solicitud encolada con ID: ${operationId}`);

                    // Mostrar mensaje de confirmación
                    Swal.fire({
                        icon: 'success',
                        title: 'Solicitud Encolada',
                        text: 'Su solicitud de despliegue ha sido encolada exitosamente. Recibirá notificaciones en tiempo real sobre el progreso.',
                        confirmButtonText: 'Entendido',
                        customClass: {
                            confirmButton: 'btn btn-warning'
                        },
                        buttonsStyling: false,
                        timer: 3000,
                        timerProgressBar: true
                    });

                    // Si WebSocket no está conectado, mostrar opción de polling
                    if (!isConnected) {
                        setTimeout(() => {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Sin Notificaciones en Tiempo Real',
                                text: 'No hay conexión WebSocket activa. ¿Desea monitorear manualmente?',
                                showCancelButton: true,
                                confirmButtonText: 'Monitorear',
                                cancelButtonText: 'Continuar',
                                customClass: {
                                    confirmButton: 'btn btn-primary',
                                    cancelButton: 'btn btn-secondary'
                                },
                                buttonsStyling: false
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    startManualPolling(operationId);
                                }
                            });
                        }, 3000);
                    }
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
    // FUNCIÓN PARA OBTENER CONFIGURACIÓN RECOMENDADA:
    // ==================

    function getRecommendedConfig(userProfile, workloadType) {
        const recommendations = {
            'alumno': {
                'general': 'Configuración básica para aprendizaje',
                'cpu_intensive': 'Recursos limitados para computación',
                'memory_intensive': 'Memoria moderada para análisis básico',
                'io_intensive': 'I/O básico para bases de datos simples'
            },
            'maestro': {
                'general': 'Configuración estándar para enseñanza',
                'cpu_intensive': 'Recursos balanceados para demostraciones',
                'memory_intensive': 'Memoria ampliada para ejemplos complejos',
                'io_intensive': 'I/O mejorado para casos de estudio'
            },
            'investigador': {
                'general': 'Configuración avanzada para investigación',
                'cpu_intensive': 'Máximos recursos de CPU para computación científica',
                'memory_intensive': 'Memoria extendida para big data',
                'io_intensive': 'Alto rendimiento I/O para análisis masivo'
            },
            'jp': {
                'general': 'Configuración intermedia para prácticas',
                'cpu_intensive': 'Recursos moderados para demostraciones avanzadas',
                'memory_intensive': 'Memoria suficiente para análisis educativo',
                'io_intensive': 'I/O mejorado para casos prácticos'
            }
        };

        return recommendations[userProfile]?.[workloadType] || 'Configuración personalizada';
    }

    // Mostrar recomendación cuando workload esté seleccionado
    function updateRecommendation() {
        const userProfile = getUserProfileFromSession();
        const workloadType = document.getElementById('workloadTypeSelect').value;

        if (userProfile && workloadType) {
            const recommendation = getRecommendedConfig(userProfile, workloadType);

            // Mostrar tooltip o mensaje con la recomendación
            const helpText = document.querySelector('#workloadTypeSelect').parentElement.querySelector('.form-text');
            if (helpText) {
                helpText.innerHTML = `
                    <small>
                        <i class="fas fa-lightbulb text-warning me-1"></i>
                        ${recommendation}
                    </small>
                `;
            }
        }
    }

    // Event listener para actualizar recomendaciones y validación
    document.getElementById('workloadTypeSelect').addEventListener('change', function() {
        if (this.value) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
        updateRecommendation();
    });


    // ==================
    // POLLING MANUAL (FALLBACK):
    // ==================

    function startManualPolling(operationId) {
        let pollCount = 0;
        const maxPolls = 60; // 5 minutos máximo

        const pollInterval = setInterval(async () => {
            pollCount++;

            try {
                const response = await fetch(`/User/api/slice/operations/${operationId}/status`);
                const result = await response.json();

                if (result.status === 'success') {
                    const status = result.content.operation_status;

                    if (status === 'COMPLETED') {
                        clearInterval(pollInterval);
                        showNotification('¡Slice desplegada exitosamente!', 'success');

                        // Actualizar tabla
                        setTimeout(async () => {
                            const newSlices = await loadSlices();
                            table.clear().rows.add(newSlices).draw();
                        }, 1000);

                    } else if (status === 'FAILED') {
                        clearInterval(pollInterval);
                        showNotification('Error en el despliegue de la slice', 'error');

                    } else if (pollCount >= maxPolls) {
                        clearInterval(pollInterval);
                        showNotification('Tiempo de espera agotado. La operación continúa en segundo plano.', 'warning');
                    }
                }
            } catch (error) {
                console.error('Error en polling manual:', error);
                if (pollCount >= maxPolls) {
                    clearInterval(pollInterval);
                }
            }
        }, 5000); // Cada 5 segundos
    }

    // === FUNCIONES DE DEBUG ===
    window.debugWebSocket = function() {
        console.log('=== DEBUG WEBSOCKET ===');
        console.log('Socket existe:', !!socket);
        console.log('Socket conectado:', socket ? socket.connected : false);
        console.log('Socket ID:', socket ? socket.id : 'N/A');
        console.log('Is Connected Flag:', isConnected);
        console.log('Operaciones pendientes:', pendingOperations.size);
        console.log('Token disponible:', !!getAuthToken());
        console.log('========================');
    };


});