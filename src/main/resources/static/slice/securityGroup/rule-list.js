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
    // VARIABLES
    // ==================
    let table;
    let gatewayUrl = '/User/api/securityGroup'
    const sgId = $('#securityGroup-data').data('slice-id');

    if (sgId === 1 || sgId === "1") {
        $('#btnAddRule').hide();
    }

    // =======================
    // MOSTRAR INFO DEL SECURITY GROUP
    // =======================
    async function loadSecurityGroupInfo() {
        const sgId = $('#securityGroup-data').data('slice-id');
        try {
            const token = getAuthToken();
            const response = await fetch(`${gatewayUrl}/get-security-group/${sgId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            const result = await response.json();
            if (result.status === 'success' && result.content) {
                const sg = result.content;
                let html = `
                    <div class="mb-2">
                        <span class="fw-bold text-info">
                            <i class="fas fa-shield me-1"></i>${sg.name ? sg.name : '<span class="text-muted">Sin nombre</span>'}
                        </span>
                        ${sg.os_id ? `<span class="text-muted ms-2"></span>` : ''}
                    </div>
                    <div class="text-secondary small mb-1"><i class="fas fa-book"></i>
                        ${sg.description ? sg.description : '<span class="text-muted">Sin descripción</span>'}
                    </div>
                `;
                $('#sgInfoBox').html(html);
            } else {
                $('#sgInfoBox').html(`
                    <div class="alert alert-warning mb-2 py-2 px-3 small">
                        No se pudo cargar la información del Security Group.
                    </div>
                `);
            }
        } catch (error) {
            $('#sgInfoBox').html(`
                <div class="alert alert-danger mb-2 py-2 px-3 small">
                    Error al obtener la información del Security Group.
                </div>
            `);
        }
    }

    await loadSecurityGroupInfo();

    // =======================
    // LISTAR REGLAS DEL SG
    // =======================
    async function loadRules() {
        try {
            const token = getAuthToken();
            const response = await fetch(`${gatewayUrl}/list-rules/${sgId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();
            if (result.status === 'success' && result.content) {
                return result.content;
            } else {
                throw new Error(result.message || 'No se pudieron cargar las reglas');
            }
        } catch (error) {
            console.error('Error cargando reglas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudieron cargar las reglas',
                confirmButtonText: 'Entendido'
            });
            return [];
        }
    }

    // =======================
    // INICIALIZAR DATATABLE
    // =======================
    async function initializeTable() {
        const rules = await loadRules();

        // Destruir instancia previa si existe para evitar bugs de doble columnas
        if ($.fn.DataTable.isDataTable('#rulesTable')) {
            $('#rulesTable').DataTable().destroy();
            $('#rulesTable tbody').empty();
        }

        table = $('#rulesTable').DataTable({
            data: rules,
            destroy: true,
            columns: [
                {
                    data: 'id',
                    type: 'num',
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return Number(data);
                        }
                        return `<span class="fw-semibold">#${data}</span>`;
                    }
                },
                { // Dirección con color
                    data: 'direction',
                    render: d => {
                        if (d === 'ingress') {
                            return `<span class="text-info fw-semibold">Entrante</span>`;
                        } else {
                            return `<span class="text-primary fw-semibold">Saliente</span>`;
                        }
                    }
                },
                { // EtherType
                    data: 'ether_type',
                    render: d => d ? d.toUpperCase() : '-'
                },
                { // Protocolo con color
                    data: 'protocol',
                    render: d => {
                        if (!d) return '-';
                        const proto = d.toUpperCase();
                        if (proto === 'TCP') {
                            return `<span class="fw-semibold" style="color:rgb(36, 184, 152) !important"">${proto}</span>`;
                        } else if (proto === 'UDP') {
                            return `<span class="fw-semibold" style="color:rgb(150, 28, 99) !important">${proto}</span>`;
                        } else if (proto === 'ICMP') {
                            return `<span class="text-warning fw-semibold">${proto}</span>`;
                        }
                        return `<span class="text-dark fw-semibold">${proto}</span>`;
                    }
                },
                { // Puertos con clase fw-semibold
                    data: null,
                    render: function (data) {
                        if (data.protocol === 'tcp' || data.protocol === 'udp') {
                            if (data.from_port && data.to_port && data.from_port !== data.to_port) {
                                return `<span class="fw-semibold">${data.from_port} - ${data.to_port}</span>`;
                            } else if (data.from_port) {
                                return `<span class="fw-semibold">${data.from_port}</span>`;
                            } else {
                                return `<span class="fw-semibold">Todos</span>`;
                            }
                        }
                        return `<span class="fw-semibold">-</span>`;
                    }
                },
                { data: 'remote_cidr', render: d => d || '-' },
                {
                    data: 'description',
                    render: function (data, type) {
                        if (type === 'display') {
                            if (!data) return '<span class="text-muted">N/A</span>';
                            const truncated = data.length > 40 ? data.substring(0, 40) + '...' : data;
                            if(data.length > 40) {
                                return `<span class="text-truncate cursor-pointer" 
                                            data-bs-toggle="tooltip" 
                                            data-bs-placement="top" 
                                            title="${data.replace(/"/g, '&quot;')}">${truncated}</span>`;
                            }
                            return `<span class="text-truncate">${data}</span>`;
                        }
                        return data;
                    }
                },
                {
                    data: null,
                    orderable: false,
                    className: 'text-center',
                    render: data => {
                        // Si el Security Group es base, no mostrar botón eliminar
                        if (sgId === 1 || sgId === "1") {
                            return '-';
                        }
                        return `
                            <button class="btn btn-link text-dark action-btn delete-rule-btn" data-id="${data.id}" title="Eliminar">
                                <i class="fas fa-trash me-2"></i>
                            </button>
                        `;
                    }
                }
            ],
            language: {
                lengthMenu: "Mostrar _MENU_ registros por página",
                zeroRecords: "No se encontraron reglas",
                info: "Mostrando _START_ a _END_ de _TOTAL_ reglas",
                infoEmpty: "Mostrando 0 a 0 de 0 reglas",
                infoFiltered: "(filtrado de _MAX_ reglas totales)",
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
            pageLength: 6,
            lengthMenu: [[6, 12, 18, 24], [6, 12, 18, 24]],
            dom: '<"row mb-3"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                '<"row"<"col-sm-12 table-responsive"tr>>' +
                '<"row table-footer"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            order: [[0, 'desc']],
            orderCellsTop: true,
            scrollX: true,
            scrollCollapse: true,
            autoWidth: false,
            drawCallback: function () {
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


    // =======================
    // ELIMINAR REGLA
    // =======================

    // Eliminar regla con confirmación y feedback visual
    $('#rulesTable').on('click', '.delete-rule-btn', async function () {
        const ruleId = $(this).data('id');
        const row = table.row($(this).closest('tr')).data();

        // Confirmación SweetAlert2
        const confirmResult = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar regla?',
            html: `<span>¿Seguro que deseas eliminar la regla <b>#${ruleId}</b>?<br>Esta acción no se puede deshacer.</span>`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary me-2'
            },
            buttonsStyling: false,
            reverseButtons: true
        });

        if (confirmResult.isConfirmed) {
            // SweetAlert de cargando
            const loadingAlert = Swal.fire({
                title: 'Eliminando regla...',
                text: 'Por favor espera',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const token = getAuthToken();
                const response = await fetch(`${gatewayUrl}/delete-rule/${ruleId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
                const result = await response.json();
                Swal.close();
                if (result.status === 'success') {
                    await initializeTable();
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminada',
                        text: 'Regla eliminada correctamente',
                        timer: 1800,
                        showConfirmButton: false,
                        timerProgressBar: true
                    });
                } else {
                    showErrorAlert(result);
                    throw new Error(result.message || 'No se pudo eliminar la regla');
                }
            } catch (error) {
                Swal.close();
                await showErrorAlert(error);
            }
        }
    });

    // =======================
    // AÑADIR REGLA
    // =======================

    const predefinedRules = {
        "all-egress": {
            direction: "egress",
            etherType: "ipv4",
            protocol: "all",
            remoteCidr: "0.0.0.0/0",
            description: "Permitir TODO el tráfico saliente (ALL)"
        },
        "icmp-egress": {
            direction: "egress",
            etherType: "ipv4",
            protocol: "icmp",
            remoteCidr: "0.0.0.0/0",
            description: "Permitir ICMP saliente (Ping)"
        },
        "icmp-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "icmp",
            remoteCidr: "0.0.0.0/0",
            description: "Permitir ICMP entrante (Ping)"
        },
        "dhcp-egress": {
            direction: "egress",
            etherType: "ipv4",
            protocol: "udp",
            portType: "single",
            fromPort: 67,
            remoteCidr: "255.255.255.255/32",
            description: "Permitir DHCP saliente (Hacia servidor 67/UDP)"
        },
        "dhcp-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "udp",
            portType: "single",
            fromPort: 68,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir DHCP entrante (Hacia cliente 68/UDP)"
        },
        "http-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "single",
            fromPort: 80,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir HTTP entrante (80/TCP)"
        },
        "https-ingress": {
            direction: "egress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "single",
            fromPort: 443,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir HTTPS saliente (443/TCP)"
        },
        "ssh-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "single",
            fromPort: 22,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir SSH entrante (22/TCP)"
        },
        "rdp-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "single",
            fromPort: 3389,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir RDP entrante (3389/TCP)"
        },
        "mysql-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "single",
            fromPort: 3306,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir MySQL entrante (3306/TCP)"
        },
        "postgres-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "single",
            fromPort: 5432,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir PostgreSQL entrante (5432/TCP)"
        },
        "dns-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "udp",
            portType: "single",
            fromPort: 53,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir DNS entrante (53/UDP)"
        },
        "smtp-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "single",
            fromPort: 25,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir SMTP entrante (25/TCP)"
        },
        "ftp-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "single",
            fromPort: 21,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir FTP entrante (21/TCP)"
        },
        "ntp-egress": {
            direction: "egress",
            etherType: "ipv4",
            protocol: "udp",
            portType: "single",
            fromPort: 123,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir NTP saliente (123/UDP)"
        },
        "custom-tcp-range-ingress": {
            direction: "ingress",
            etherType: "ipv4",
            protocol: "tcp",
            portType: "range",
            fromPort: 1000,
            toPort: 2000,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir rango TCP entrante (1000-2000/TCP)"
        },
        "custom-udp-range-egress": {
            direction: "egress",
            etherType: "ipv4",
            protocol: "udp",
            portType: "range",
            fromPort: 4000,
            toPort: 5000,
            remoteCidr: "0.0.0.0/0",
            description: "Permitir rango UDP saliente (4000-5000/UDP)"
        }
    };

    // Llenar el select de plantillas dinámicamente
    function fillPredefinedRuleSelect() {
        const $select = $('#predefinedRuleSelect');
        $select.empty();
        $select.append('<option value="">Selecciona una plantilla de regla...</option>');
        for (const [key, rule] of Object.entries(predefinedRules)) {
            $select.append(`<option value="${key}">${rule.description}</option>`);
        }
    }

    // Llama a la función al cargar el modal o el documento
    fillPredefinedRuleSelect();

    // Inicializar select2 para plantillas si no está inicializado
    $('#predefinedRuleSelect').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#ruleModal'),
        minimumResultsForSearch: 0,
        width: '100%'
    });

    // Al hacer click en "Aplicar" plantilla
    $('#btnApplyPredefinedRule').on('click', function () {
        const selected = $('#predefinedRuleSelect').val();
        if (!selected || !predefinedRules[selected]) return;

        const rule = predefinedRules[selected];

        // Llenar campos del formulario
        $('#direction').val(rule.direction).trigger('change');
        $('#etherType').val(rule.etherType).trigger('change');
        $('#protocol').val(rule.protocol).trigger('change');

        // Mostrar/ocultar campos de puerto según protocolo
        if (rule.protocol === 'tcp' || rule.protocol === 'udp') {
            $('#portFields').show();
            $('#portTypeContainer').show();
            $('#portType').val(rule.portType || 'single').trigger('change');
            if (rule.portType === 'range') {
                $('#singlePortInput').hide();
                $('#rangePortInputs').show();
                $('#rangeFromPort').val(rule.fromPort || '');
                $('#rangeToPort').val(rule.toPort || '');
                $('#fromPort').val('');
            } else {
                $('#singlePortInput').show();
                $('#rangePortInputs').hide();
                $('#fromPort').val(rule.fromPort || '');
                $('#rangeFromPort, #rangeToPort').val('');
            }
        } else {
            $('#portFields').hide();
            $('#portTypeContainer').hide();
            $('#singlePortInput, #rangePortInputs').hide();
            $('#fromPort, #rangeFromPort, #rangeToPort').val('');
        }

        $('#remoteCidr').val(rule.remoteCidr || '0.0.0.0/0');
        $('#ruleDescription').val(rule.description || '');

        // Quitar validación previa
        $('#ruleForm').removeClass('was-validated');
    });


    // Mostrar/ocultar campos de puerto según protocolo y tipo de puerto
    function updatePortFields() {
        const protocol = $('#protocol').val();
        if (protocol === 'tcp' || protocol === 'udp') {
            $('#portFields').show();
            $('#portTypeContainer').show();
            updatePortTypeFields();
        } else {
            $('#portFields').hide();
            $('#portTypeContainer').hide();
            $('#singlePortInput, #rangePortInputs').hide();
            $('#fromPort, #rangeFromPort, #rangeToPort').val('');
        }
    }

    // Cambiar entre puerto único y rango
    function updatePortRangeFields() {
        const isRange = $('#portType').val() === 'range';
        $('#toPort').prop('readonly', !isRange).val(isRange ? $('#toPort').val() : $('#fromPort').val());
    }

    // Agregar select para tipo de puerto (único/rango) solo para TCP/UDP
    $('#portFields .input-group').before(`
        <div class="mb-2" id="portTypeContainer" style="display: none;">
            <select class="form-select form-select-sm" id="portType" style="max-width: 180px;">
                <option value="single">Puerto único</option>
                <option value="range">Rango de puertos</option>
            </select>
        </div>
    `);

    // Mostrar select de tipo de puerto solo para TCP/UDP
    function updatePortTypeVisibility() {
        const protocol = $('#protocol').val();
        if (protocol === 'tcp' || protocol === 'udp') {
            $('#portTypeContainer').show();
        } else {
            $('#portTypeContainer').hide();
        }
    }

    // Cambiar entre puerto único y rango
    function updatePortTypeFields() {
        const portType = $('#portType').val();
        if (portType === 'range') {
            $('#singlePortInput').hide();
            $('#rangePortInputs').show();
            $('#fromPort').val('');
        } else {
            $('#singlePortInput').show();
            $('#rangePortInputs').hide();
            $('#rangeFromPort, #rangeToPort').val('');
        }
    }

    // Eventos dinámicos
    $('#protocol').on('change', updatePortFields);
    $('#portType').on('change', updatePortTypeFields);

    // Inicializar selects sin barra de búsqueda
    $('#direction, #etherType, #protocol, #portType').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#ruleModal'),
        minimumResultsForSearch: Infinity
    });

    // Estado inicial de campos al cargar la página y al abrir el modal
    $(function() {
        $('#portType').val('single');
        updatePortFields();
        updatePortTypeFields();
    });

    // Inicializar estado inicial
    updatePortFields();
    updatePortTypeVisibility();

    // Abrir modal de crear regla
    $('#btnAddRule').on('click', function() {
        $('#ruleForm')[0].reset();
        $('#ruleForm').removeClass('was-validated');
        $('#portType').val('single').trigger('change');
        updatePortFields();
        updatePortTypeFields();
        $('#ruleModalTitle').text('Agregar Regla');
        $('#ruleModal').modal('show');
    });

    // Guardar nueva regla
    $('#btnSaveRule').on('click', async function() {
        const form = $('#ruleForm')[0];
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Obtener datos del formulario
        const description = $('#ruleDescription').val().empty ? null : $('#ruleDescription').val();
        const direction = $('#direction').val();
        const ether_type = $('#etherType').val();
        const protocol = $('#protocol').val();
        const remote_cidr = $('#remoteCidr').val() || "0.0.0.0/0";
        const security_group_id = $('#securityGroup-data').data('slice-id');
        let from_port = null, to_port = null;

        // Validar formato CIDR: A.B.C.D/E
        function isValidCIDR(cidr) {
            // Ejemplo: 192.168.1.0/24 o 0.0.0.0/0
            return /^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/.test(cidr);
        }

        if (!isValidCIDR(remote_cidr)) {
            Swal.fire({
                icon: 'warning',
                title: 'IP CIDR inválido',
                text: 'El campo IP CIDR debe tener el formato A.B.C.D/E, por ejemplo: 0.0.0.0/0 o 192.168.1.0/24'
            });
            return;
        }

        if (protocol === 'tcp' || protocol === 'udp') {
            const portType = $('#portType').val();
            if (portType === 'range') {
                from_port = parseInt($('#rangeFromPort').val()) || null;
                to_port = parseInt($('#rangeToPort').val()) || null;
            } else {
                from_port = parseInt($('#fromPort').val()) || null;
                to_port = from_port;
            }
            if (from_port && to_port && from_port > to_port) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Rango de puertos inválido',
                    text: 'El puerto inicial no puede ser mayor que el puerto final.'
                });
                return;
            }
        }

        // SweetAlert de cargando
        Swal.fire({
            title: 'Creando regla...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => Swal.showLoading()
        });

        // Construir body
        const body = {
            description,
            direction,
            ether_type,
            protocol,
            remote_cidr,
            security_group_id
        };


        if (protocol === 'tcp' || protocol === 'udp') {
            if (from_port) body.from_port = from_port;
            if (to_port) body.to_port = to_port;
        }

        console.log('Cuerpo de la solicitud:', JSON.stringify(body));

        try {
            const token = getAuthToken();
            const response = await fetch(`${gatewayUrl}/create-rule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            Swal.close();
            if (result.status === 'success') {
                $('#ruleModal').modal('hide');
                await initializeTable();
                Swal.fire({
                    icon: 'success',
                    title: '¡Regla creada!',
                    text: 'La regla fue creada correctamente.',
                    timer: 1800,
                    showConfirmButton: false,
                    timerProgressBar: true
                });
            } else {
                showErrorAlert(result);
            }
        } catch (error) {
            Swal.close();
            showErrorAlert(error);
        }
    });

    $('#ruleModal').on('hidden.bs.modal', function () {
        // Resetear el formulario y quitar validación
        $('#ruleForm')[0].reset();
        $('#ruleForm').removeClass('was-validated');

        // Resetear selects a sus valores por defecto
        $('#direction').val('ingress').trigger('change');
        $('#etherType').val('ipv4').trigger('change');
        $('#protocol').val('tcp').trigger('change');
        $('#portType').val('single').trigger('change');

        // Limpiar campos de puertos
        $('#fromPort, #rangeFromPort, #rangeToPort').val('');
        $('#remoteCidr').val('0.0.0.0/0');
        $('#ruleDescription').val('');

        // Ocultar/mostrar campos según protocolo
        $('#portFields').show();
        $('#portTypeContainer').show();
        $('#singlePortInput').show();
        $('#rangePortInputs').hide();
    });

    // Inicializar tooltips al abrir modal
    $('#ruleModal').on('shown.bs.modal', function () {
        $('[data-bs-toggle="tooltip"]').tooltip('dispose').tooltip();
    });

    // Inicializar selects bonitos
    $('#direction, #etherType, #protocol, #portType').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#ruleModal'),
        minimumResultsForSearch: Infinity
    });

    // Fix: Evitar selección automática al abrir el select2 (bug de doble click accidental)
    $('#direction, #etherType, #protocol, #portType').on('select2:opening', function(e) {
        // Si el select2 ya está abierto, previene el evento (evita doble apertura/cierre)
        if ($(this).data('select2').isOpen()) {
            e.preventDefault();
        }
    });

    // Estado inicial de campos
    updatePortFields();
    updatePortTypeVisibility();
    updatePortRangeFields();


    // ==================
    // DATATABLES:
    // ==================

    // Función helper para truncar texto
    function truncateText(text, maxLength = 100) {
        console.log('Truncating text:', text, 'with maxLength:', maxLength);
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
    // JWT TOKEN:
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

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });


});