

// Inicializar tabla con DataTables
const slicesTable = $('#general-slices').DataTable({
    ajax: {
        url: '/Admin/api/slices/list',
        dataSrc: 'data'
    },
    columns: [
        {
            data: 'idFlavor',
            render: function(data) {
                return `<span class="badge" style="background-color: #e8eaf6; color: #3f51b5;">#${data}</span>`;
            }
        },
        {
            data: 'name',
            // Si name está vacío, generar un nombre basado en las características
            render: function(data, type, row) {
                if (data) {
                    return data;
                } else {
                    return `Flavor-${row.vcpu}cpu-${row.ram}gb-${row.disk}gb`;
                }
            }
        },
        { data: 'vcpu',
            render: function(data) {
                return `<div class="resource-value"><i class="fas fa-microchip resource-icon"></i> ${data}</div>`;
            }
        },
        { data: 'ram',
            render: function(data) {
                return `<div class="resource-value"><i class="fas fa-memory resource-icon"></i> ${data} MB</div>`;
            }
        },
        { data: 'disk',
            render: function(data) {
                return `<div class="resource-value"><i class="fas fa-hdd resource-icon"></i> ${data} GB</div>`;
            }
        },
        {
            data: 'type',
            render: function(data) {
                if (data === 'public') {
                    return '<span class="badge badge-active"><i class="fas fa-globe"></i> Público</span>';
                } else {
                    return '<span class="badge badge-info"><i class="fas fa-lock"></i> Privado</span>';
                }
            }
        },
        {
            data: 'idFlavor',
            render: function(data, type, row) {
                // Verifica si el flavor está habilitado para edición o eliminación
                const isEnabled = row.state === true || row.state === 'true' || row.state === 1 || row.state === '1';

                // Botón de editar (deshabilitado si state no es verdadero)
                const editBtn = isEnabled ?
                    `<button class="action-btn edit-btn" title="Editar" data-flavorid="${data}"><i class="fas fa-edit"></i></button>` :
                    `<button class="action-btn edit-btn" title="Editar" data-flavorid="${data}" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fas fa-edit"></i></button>`;

                // Botón de eliminar (deshabilitado si state no es verdadero)
                const deleteBtn = isEnabled ?
                    `<button class="action-btn delete-btn" title="Eliminar" data-flavorid="${data}"><i class="fas fa-trash-alt"></i></button>` :
                    `<button class="action-btn delete-btn" title="Eliminar" data-flavorid="${data}" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fas fa-trash-alt"></i></button>`;

                // Botón de cambio de tipo (público/privado)
                let toggleBtn = '';
                if (row.type === 'public') {
                    toggleBtn = `<button class="action-btn deactivate-btn" title="Hacer privado" data-flavorid="${data}"><i class="fas fa-lock"></i></button>`;
                } else {
                    toggleBtn = `<button class="action-btn activate-btn" title="Hacer público" data-flavorid="${data}"><i class="fas fa-globe"></i></button>`;
                }

                return `<div class="actions">${editBtn}${deleteBtn}</div>`;
            },
            orderable: false
        }
    ],
    language: {
        url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
    },
    responsive: true,
    dom: '<"top"fB>rt<"bottom"lip>',
    buttons: [
        {
            text: '<i class="fas fa-sync-alt"></i> Refrescar',
            className: 'btn btn-sm btn-outline',
            action: function (e, dt) {
                dt.ajax.reload();
            }
        }
    ],
    lengthMenu: [
        [10, 25, 50, -1],
        ['10 filas', '25 filas', '50 filas', 'Mostrar todo']
    ]
});