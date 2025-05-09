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
        return `<span class="badge ${badgeClass}" style="min-width: 124px !important;">${statusText}</span>`;
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

    async function loadSketches() {
        try {
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
    
                    // Actualizar contadores con la información detallada
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
            title: 'Desplegando Slice...',
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
            /*willOpen: () => {
                Swal.showLoading();
            }*/
        });
    
        const selectedSketch = document.getElementById('sketchSelect');
        const structureData = selectedSketch.options[selectedSketch.selectedIndex].getAttribute('data-structure');
        const structure = JSON.parse(structureData);
    

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
                name: document.getElementById('sliceName').value,
                description: document.getElementById('sliceDescription').value || null,
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
                
                // Actualizar la tablita uwu
                const newSlices = await loadSlices();
                table.clear().rows.add(newSlices).draw();
    
                // Mostrar alert de éxito con botón para ver el slice
                await Swal.fire({
                    icon: 'success',
                    title: '¡Slice Desplegada!',
                    text: result.message ? result.message : 'La slice se ha desplegado correctamente',
                    showCancelButton: true,
                    confirmButtonText: 'Ver Slice',
                    cancelButtonText: 'Cerrar',
                    customClass: {
                        icon: 'border-0',
                        confirmButton: 'btn btn-warning',
                        cancelButton: 'btn btn-secondary',
                        actions: 'gap-2'
                    },
                    buttonsStyling: false,
                    reverseButtons: true
                }).then((resultAlert) => {
                    console.log('Resultado de la alerta:', result);
                    if (resultAlert.isConfirmed && result.details?.slice_id) {
                        window.location.href = `/User/slice/${result.details.slice_id}`;
                    }
                });
            } else {
                throw new Error(result.message || 'Error al desplegar la slice');
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Cerrar loading alert y mostrar error
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo desplegar la slice',
                customClass: {
                    icon: 'border-0',
                    confirmButton: 'btn btn-danger'
                },
                buttonsStyling: false
            });
        } finally {
            if (Swal.isVisible()) {
                loadingAlert.close();
            }
        }
    };

});