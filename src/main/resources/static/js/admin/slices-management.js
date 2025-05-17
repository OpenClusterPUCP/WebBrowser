$(document).ready(function () {
    const generalTable = $('#generalSlicesTable').DataTable({
        ajax: {
            url: '/Admin/api/slices/list',
            dataSrc: function(json) {
                console.log("Datos recibidos:", json);
                return json;
            }
        },
        columns: [
            {
                data: 'id',
                render: data => `<span class="badge">#SL-${data}</span>`
            },
            { data: 'nombre' },
            { data: 'propietario' },
            { data: 'recursos' },
            {
                data: 'estado',
                render: function (data) {
                    const estado = data?.toLowerCase();
                    if (estado === 'running') {
                        return '<span class="badge badge-active">Activo</span>';
                    } else if (estado === 'stopped') {
                        return '<span class="badge badge-inactive">Inactivo</span>';
                    } else {
                        return `<span class="badge badge-warning">${data || 'Desconocido'}</span>`;
                    }
                }
            },
            {
                data: 'id',
                render: data => `<button class="action-btn" title="Ver"><i class="fas fa-eye"></i></button>`,
                orderable: false
            }
        ],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        responsive: true
    });

    // Refrescar tabla al cambiar de pestaña
    $('.card-tab').on('click', function () {
        const tabId = $(this).data('tab');
        if (tabId === 'general-slices') {
            setTimeout(() => {
                generalTable.columns.adjust().draw();
            }, 100);
        }
    });

    // Validación segura para botones de toggle del sidebar
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuToggle = document.querySelector('.menu-toggle');

    function toggleSidebar() {
        if (sidebar) sidebar.classList.toggle('hidden');
        if (mainContent) mainContent.classList.toggle('full-width');
    }

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
});
