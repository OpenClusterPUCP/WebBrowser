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
    let gatewayUrl = 'http://localhost:9000'

    // =======================
    // LISTAR SECURITY GROUPS
    // =======================
    async function loadSecurityGroups() {
        try {
            const response = await fetch(`${gatewayUrl}/list-security-groups`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            console.log('Respuesta de listar Security Groups:', result);
            if (result.status === 'success' && result.content) {
                return result.content;
            } else {
                throw new Error(result.message || 'No se pudieron cargar los Security Groups');
            }
        } catch (error) {
            console.error('Error cargando Security Groups:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudieron cargar los Security Groups',
                confirmButtonText: 'Entendido',
                customClass: {
                    confirmButton: 'btn bg-gradient-primary'
                },
                buttonsStyling: false
            });
            return [];
        }
    }

    async function initializeTable() {
        const groups = await loadSecurityGroups();
        table = $('#securityGroupTable').DataTable({
            data: groups,
            destroy: true,
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
                            if (data && data.length > 30) {
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
                            const truncated = data
                            if (data.length > 100) {
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
                    data: 'assignments',
                    render: function(data, type, row) {
                        // Para ordenamiento, devolver el número
                        if (type === 'sort' || type === 'type') {
                            return Array.isArray(data) ? data.length : 0;
                        }
                        // Para display
                        if (Array.isArray(data) && data.length > 0) {
                            return `<span class="text-success">${data.length}</span>`;
                        }
                        return `<span class="text-muted">Ninguna</span>`;
                    },
                    className: 'text-center',
                    orderable: true // Ahora permite ordenar
                },
                {
                    data: null,
                    orderable: false,
                    className: 'text-center',
                    render: data => `
                        <div class="btn-group">
                            <button class="mb-0 btn btn-link text-dark action-btn view-assignments" data-id="${data.id}" title="Ver Asignaciones">
                                <i class="fas fa-link"></i>
                            </button>
                            <button class="mb-0 btn btn-link text-dark action-btn view-rules" data-id="${data.id}" title="Gestionar Reglas">
                                <i class="fas fa-list-ul"></i>
                            </button>
                            <button class="mb-0 btn btn-link text-dark action-btn edit-sg" data-id="${data.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="mb-0 btn btn-link text-dark action-btn delete-sg" data-id="${data.id}" data-name="${data.name}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `
                }
            ],
            language: {
                lengthMenu: "Mostrar _MENU_ grupos por página",
                zeroRecords: "No se encontraron resultados",
                info: "Mostrando _START_ a _END_ de _TOTAL_ grupos",
                infoEmpty: "Mostrando 0 a 0 de 0 grupos",
                infoFiltered: "(filtrado de _MAX_ grupos totales)",
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
            pageLength: 4,
            lengthMenu: [[4, 8, 12, 20], [4, 8, 12, 20]],
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

    // Inicializar tabla al cargar
    await initializeTable();

    // MODAL: Asignaciones
    if (!document.getElementById('assignmentsModal')) {
        $('body').append(`
            <div class="modal fade" id="assignmentsModal" tabindex="-1" aria-labelledby="assignmentsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0">
                        <div class="modal-header bg-success px-4">
                            <h5 class="modal-title text-white" id="assignmentsModalLabel">
                                <i class="fas fa-link me-2"></i>
                                Asignaciones del Security Group
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr style="background:rgb(232, 247, 233);">
                                            <th class="text-sm text-uppercase text-secondary" style="font-size:1.08em;">ID</th>
                                            <th class="text-sm text-uppercase text-secondary" style="font-size:1.08em;">Interfaz</th>
                                            <th class="text-sm text-uppercase text-secondary" style="font-size:1.08em;">MAC</th>
                                            <th class="text-sm text-uppercase text-secondary" style="font-size:1.08em;">Infraestructura</th>
                                            <th class="text-sm text-uppercase text-secondary" style="font-size:1.08em;">VM</th>
                                            <th class="text-sm text-uppercase text-secondary" style="font-size:1.08em;">Slice</th>
                                        </tr>
                                    </thead>
                                    <tbody id="assignmentsTableBody">
                                        <!-- Asignaciones aquí -->
                                    </tbody>
                                </table>
                            </div>
                            <div id="noAssignmentsMsg" class="text-center text-muted mt-3" style="display:none;">
                                <i class="fas fa-info-circle me-2"></i>Este Security Group no tiene asignaciones.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    // Evento para abrir el modal y mostrar asignaciones
    $('#securityGroupTable').on('click', '.view-assignments', function() {
        const row = table.row($(this).closest('tr')).data();
        const assignments = row.assignments || [];
        const $tbody = $('#assignmentsTableBody');
        $tbody.empty();

        if (assignments.length === 0) {
            $('#noAssignmentsMsg').show();
        } else {
            $('#noAssignmentsMsg').hide();
            assignments.forEach(a => {
                let interfaz = '-';
                if (a.infrastructure === 'OpenStack') {
                    interfaz = a.interface_name || '-';
                } else {
                    interfaz = a.interface_tap_name || '-';
                }
                $tbody.append(`
                    <tr>
                        <td><span class="text-sm">${a.interface_id ?? '-'}</span></td>
                        <td>
                            <span class="text-sm">${interfaz}</span>
                        </td>
                        <td><span class="text-sm">${a.interface_mac || '-'}</span></td>
                        <td><span class="text-sm">${a.infrastructure || '-'}</span></td>
                        <td>
                            <span class="text-sm">${a.vm?.name || '-'}</span>
                        </td>
                        <td>
                            ${a.slice_id ? `<button class="mb-0 btn btn-link text-dark action-btn view-assignments" onclick="window.open('/User/slice/${a.slice_id}', '_blank')" title="Ver Slice"><i class="fas fa-cloud-arrow-up"></i></button>` : '<span class="text-muted">-</span>'}
                        </td>
                    </tr>
                `);
            });
        }
        $('#assignmentsModal').modal('show');
    });

    // Redirigir al hacer click en "Ver Reglas"
    $('#securityGroupTable').on('click', '.view-rules', function() {
        const id = $(this).data('id');
        window.location.href = `/User/securityGroup/${id}`;
    });

    // =================================
    // CREAR Y EDITAR SECURITY GROUPS
    // =================================

    // Abrir modal de creación de Security Group
    $('#btnCreateSecurityGroup').on('click', function() {
        $('#createSecurityGroupForm')[0].reset();
        $('#createSecurityGroupForm').removeClass('was-validated');
        $('#createSecurityGroupModal').modal('show');
    });

    // Crear Security Group
    $('#btnCreateSGSubmit').on('click', async function() {
        const form = $('#createSecurityGroupForm')[0];
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        const name = $('#sgName').val();
        const description = $('#sgDescription').val();

        // SweetAlert de cargando
        const loadingAlert = Swal.fire({
            title: 'Creando Security Group...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch(`${gatewayUrl}/create-security-group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description })
            });
            const result = await response.json();
            Swal.close();
            if (result.status === 'success') {
                $('#createSecurityGroupModal').modal('hide');
                await initializeTable();
                Swal.fire({
                    icon: 'success',
                    title: '¡Creado!',
                    text: 'Security Group creado correctamente',
                    timer: 2000,
                    showConfirmButton: false,
                    timerProgressBar: true
                });
            } else {
                showErrorAlert(result);
                throw new Error(result.message || 'No se pudo crear el Security Group');
            }
        } catch (error) {
            Swal.close();
            console.error('Error creando Security Group:', error);
        }
    });

    // Guardar cambios al editar Security Group
    $('#btnEditSGSubmit').on('click', async function() {
        const form = $('#editSecurityGroupForm')[0];
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        const security_group_id = $('#editSgId').val();
        const name = $('#editSgName').val();
        const description = $('#editSgDescription').val();

        // SweetAlert de cargando
        const loadingAlert = Swal.fire({
            title: 'Actualizando Security Group...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch(`${gatewayUrl}/edit-security-group`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ security_group_id, name, description })
            });
            const result = await response.json();
            Swal.close();
            if (result.status === 'success') {
                $('#editSecurityGroupModal').modal('hide');
                await initializeTable();
                Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'Security Group actualizado correctamente',
                    timer: 2000,
                    showConfirmButton: false,
                    timerProgressBar: true
                });
            } else {
                showErrorAlert(result);
                throw new Error(result.message || 'No se pudo actualizar el Security Group');
            }
        } catch (error) {
            console.error('Error actualizando Security Group:', error);
        }
    });

    // Abrir modal de edición con datos actuales
    $('#securityGroupTable').on('click', '.edit-sg', function() {
        const row = table.row($(this).closest('tr')).data();
        $('#editSgId').val(row.id);
        $('#editSgName').val(row.name);
        $('#editSgDescription').val(row.description);
        $('#editSecurityGroupForm').removeClass('was-validated');
        $('#editSecurityGroupModal').modal('show');
    });

    // =================================
    // ELIMINAR SECURITY GROUPS
    // =================================

    $('#securityGroupTable').on('click', '.delete-sg', async function () {
        const row = table.row($(this).closest('tr')).data();
        const sgId = row.id;
        const sgName = row.name;

        // Confirmación con SweetAlert2
        const confirmResult = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar Security Group?',
            html: `<span>¿Seguro que deseas eliminar <b>${sgName}</b>?<br>Esta acción no se puede deshacer.</span>`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondaryme-2'
            },
            buttonsStyling: false,
            reverseButtons: true
        });

        if (confirmResult.isConfirmed) {
            // SweetAlert de cargando
            const loadingAlert = Swal.fire({
                title: 'Eliminando Security Group...',
                text: 'Por favor espera',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await fetch(`${gatewayUrl}/delete-security-group/${sgId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();
                Swal.close();
                if (result.status === 'success') {
                    await initializeTable();
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminado',
                        text: 'Security Group eliminado correctamente',
                        timer: 2000,
                        showConfirmButton: false,
                        timerProgressBar: true
                    });
                } else {
                    showErrorAlert(result);
                    throw new Error(result.message || 'No se pudo eliminar el Security Group');
                }
            } catch (error) {
                Swal.close();
                await showErrorAlert(error);
            }
        }
    });


    // Función helper para truncar texto
    function truncateText(text, maxLength = 100) {
        if (!text) return 'N/A';
        const limit = Math.max(0, maxLength);
        if (text.length <= limit) return text;
        return `${text.substring(0, limit)}...`;
    }

    // Inicializar
    const resizeObserver = new ResizeObserver(entries => {
        table.columns.adjust();
    });

    resizeObserver.observe(document.querySelector('.table-responsive'));

    // ==================
    // WEBSOCKET Y NOTIFICACIONES EN TIEMPO REAL:
    // ==================

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
                if (error.details) {
                    if (Array.isArray(error.details)) {
                        errorDetails = error.details;
                    } else {
                        errorDetails = [error.details];
                    }
                }
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

        const sliceData = {
            slice_info: {
                name: sliceName,
                description: sliceDescription,
                sketch_id: parseInt(selectedSketch.value),
                availability_zone_id: parseInt(availabilityZoneId)
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


});