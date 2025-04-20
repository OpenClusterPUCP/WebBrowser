// /js/users.js

// Variables globales
let currentPage = 1;
let usersPerPage = 10;
let totalUsers = 0;
let allUsers = [];

$(document).ready(function() {
    // Cargar componentes comunes
    loadCommonComponents();

    // Cargar datos de usuarios
    loadUsers();

    // Inicializar eventos
    initEvents();
});

// Función para cargar componentes comunes (sidebar, header, footer)
function loadCommonComponents() {
    $('#sidebar-container').load('/fragments/admin/sidebar.html', function() {
        // Activar el enlace de usuarios en el sidebar
        $('#sidebar-container a[href="/Admin/users"]').addClass('active');
    });

    $('#header-container').load('/fragments/admin/header.html', function() {
        // Establecer el título de la página
        $('#header-container .page-title').text('Gestión de Usuarios');
    });

    $('#footer-container').load('/fragments/admin/footer.html');
}

// En tu archivo users.js o script inline
function loadUsers() {
    // Mostrar indicador de carga
    $('#users-table-body').html('<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</td></tr>');

    // Hacer la petición AJAX
    $.ajax({
        url: '/Admin/api/users',
        type: 'GET',
        success: function(response) {
            console.log("Respuesta exitosa:", response);
            // Resto del código de éxito...
        },
        error: function(xhr, status, error) {
            console.error('Error al cargar usuarios:', error);
            console.error('Estado HTTP:', xhr.status);
            console.error('Respuesta:', xhr.responseText);

            // Si el error es de autenticación (401), manejar sin redirección automática
            if (xhr.status === 401 || xhr.status === 403) {
                $('#users-table-body').html('<tr><td colspan="7" class="text-center text-danger">Error de autenticación. <a href="/login">Iniciar sesión</a></td></tr>');
            } else {
                $('#users-table-body').html('<tr><td colspan="7" class="text-center text-danger">Error al cargar usuarios: ' + (xhr.responseText || error) + '</td></tr>');
            }
        }
    });
}

// Función para actualizar las estadísticas
function updateStats() {
    $('#totalUsers').text(totalUsers);

    // Estos valores deberían venir de la API, por ahora son placeholders
    $('#activeUsers').text(Math.round(totalUsers * 0.8)); // 80% activos
    $('#pendingUsers').text(Math.round(totalUsers * 0.1)); // 10% pendientes
    $('#bannedUsers').text(Math.round(totalUsers * 0.1)); // 10% baneados

    // Actualizar contadores de paginación
    const start = (currentPage - 1) * usersPerPage + 1;
    const end = Math.min(currentPage * usersPerPage, totalUsers);
    $('#showing-count').text(`${start}-${end}`);
    $('#total-count').text(totalUsers);
}

// Función para renderizar la tabla de usuarios
function renderUsersTable() {
    // Calcular índices para la paginación
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = Math.min(startIndex + usersPerPage, totalUsers);

    // Obtener los usuarios para la página actual
    const usersToShow = allUsers.slice(startIndex, endIndex);

    // Vaciar la tabla
    $('#users-table-body').empty();

    // Si no hay usuarios, mostrar mensaje
    if (usersToShow.length === 0) {
        $('#users-table-body').html('<tr><td colspan="7" class="text-center">No se encontraron usuarios</td></tr>');
        return;
    }

    // Renderizar cada usuario
    usersToShow.forEach(user => {
        const row = `
            <tr>
                <td>
                    <div class="form-check">
                        <input class="form-check-input user-select" type="checkbox" id="user-${user.id}" value="${user.id}">
                        <label class="form-check-label" for="user-${user.id}"></label>
                    </div>
                </td>
                <td>#U-${user.id}</td>
                <td>${user.name || '-'}</td>
                <td>${user.lastname || '-'}</td>
                <td>${user.username || '-'}</td>
                <td>${user.code || '-'}</td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="action-btn" title="Ver" onclick="viewUser(${user.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" title="Editar" onclick="editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn ban" title="Banear" data-user-id="${user.id}" onclick="confirmBan(this)">
                            <i class="fas fa-ban"></i>
                        </button>
                        <button class="action-btn delete" title="Eliminar" data-user-id="${user.id}" onclick="confirmDelete(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        $('#users-table-body').append(row);
    });

    // Reinicializar eventos para los nuevos elementos
    initCheckboxEvents();
}

// Función para actualizar la paginación
function updatePagination() {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    let paginationHtml = '';

    // Botón anterior
    paginationHtml += `
        <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;" aria-label="Anterior">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Páginas
    const maxPages = 5; // Máximo número de páginas para mostrar
    let startPage = Math.max(currentPage - Math.floor(maxPages / 2), 1);
    let endPage = Math.min(startPage + maxPages - 1, totalPages);

    // Ajustar startPage si estamos cerca del final
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(endPage - maxPages + 1, 1);
    }

    // Primera página siempre
    if (startPage > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
            </li>
        `;

        // Puntos suspensivos si hay más páginas antes
        if (startPage > 2) {
            paginationHtml += `
                <li class="page-item disabled">
                    <a class="page-link" href="#">...</a>
                </li>
            `;
        }
    }

    // Páginas intermedias
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }

    // Última página siempre
    if (endPage < totalPages) {
        // Puntos suspensivos si hay más páginas después
        if (endPage < totalPages - 1) {
            paginationHtml += `
                <li class="page-item disabled">
                    <a class="page-link" href="#">...</a>
                </li>
            `;
        }

        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
    }

    // Botón siguiente
    paginationHtml += `
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;" aria-label="Siguiente">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    // Actualizar el contenedor de paginación
    $('#pagination-container').html(paginationHtml);
}

// Función para cambiar de página
function changePage(page) {
    if (page < 1 || page > Math.ceil(totalUsers / usersPerPage)) {
        return;
    }

    currentPage = page;
    renderUsersTable();
    updateStats();
    updatePagination();
}

// Función para inicializar eventos
function initEvents() {
    // Evento de filtrado
    $('#filter-form').on('submit', function(e) {
        e.preventDefault();

        const filters = {
            status: $('#statusFilter').val(),
            role: $('#roleFilter').val(),
            search: $('#searchFilter').val()
        };

        // Eliminar filtros vacíos
        Object.keys(filters).forEach(key => {
            if (!filters[key]) {
                delete filters[key];
            }
        });

        // Reiniciar a la primera página
        currentPage = 1;

        // Cargar usuarios con filtros
        loadUsers(filters);
    });

    // Evento de reset del formulario
    $('#filter-form').on('reset', function() {
        setTimeout(function() {
            currentPage = 1;
            loadUsers();
        }, 10);
    });

    // Inicializar eventos de checkbox
    initCheckboxEvents();
}

// Función para inicializar eventos de checkbox
function initCheckboxEvents() {
    // Seleccionar todos los usuarios
    $('#selectAll').on('change', function() {
        const isChecked = $(this).prop('checked');
        $('.user-select').prop('checked', isChecked);
        updateSelectedCount();
    });

    // Checkboxes individuales
    $('.user-select').on('change', function() {
        updateSelectedCount();

        // Actualizar "Seleccionar todos" si es necesario
        const allChecked = $('.user-select:checked').length === $('.user-select').length;
        $('#selectAll').prop('checked', allChecked);
    });
}

// Función para actualizar contador de seleccionados
function updateSelectedCount() {
    const selectedCount = $('.user-select:checked').length;
    $('#selectedCount').text(selectedCount);

    // Mostrar/ocultar modal de acciones masivas
    if (selectedCount > 0) {
        $('#bulkActionModal').modal('show');
    } else {
        $('#bulkActionModal').modal('hide');
    }
}

// Funciones para acciones de usuario
function viewUser(userId) {
    window.location.href = `/Admin/users/${userId}`;
}

function editUser(userId) {
    window.location.href = `/Admin/users/${userId}/edit`;
}

// Variable para almacenar el ID del usuario actual
let currentUserId = null;

function confirmDelete(button) {
    currentUserId = $(button).data('user-id');
    $('#deleteUserModal').modal('show');
}

// Eliminar usuario
$('#confirmDeleteBtn').on('click', function() {
    if (!currentUserId) return;

    $.ajax({
        url: `/Admin/api/users/${currentUserId}`,
        type: 'DELETE',
        success: function() {
            showToast('Usuario eliminado correctamente', 'success');
            $('#deleteUserModal').modal('hide');

            // Recargar la tabla
            loadUsers();
        },
        error: function(xhr) {
            showError('Error al eliminar usuario: ' + (xhr.responseText || 'Error desconocido'));
        }
    });
});

function confirmBan(button) {
    currentUserId = $(button).data('user-id');
    $('#banModalText').text('¿Está seguro que desea banear este usuario?');
    $('#confirmBanBtn').text('Banear').removeClass('btn-success').addClass('btn-warning');
    $('#banUserModal').modal('show');
}

function confirmUnban(button) {
    currentUserId = $(button).data('user-id');
    $('#banModalText').text('¿Está seguro que desea desbanear este usuario?');
    $('#confirmBanBtn').text('Desbanear').removeClass('btn-warning').addClass('btn-success');
    $('#banUserModal').modal('show');
}

// Banear/desbanear usuario
$('#confirmBanBtn').on('click', function() {
    if (!currentUserId) return;

    const isBanning = $(this).text() === 'Banear';
    const reason = $('#banReason').val();

    $.ajax({
        url: `/Admin/api/users/${currentUserId}/${isBanning ? 'ban' : 'unban'}`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ reason: reason }),
        success: function() {
            showToast(`Usuario ${isBanning ? 'baneado' : 'desbaneado'} correctamente`, 'success');
            $('#banUserModal').modal('hide');

            // Recargar la tabla
            loadUsers();
        },
        error: function(xhr) {
            showError(`Error al ${isBanning ? 'banear' : 'desbanear'} usuario: ${xhr.responseText || 'Error desconocido'}`);
        }
    });
});

// Función para acciones masivas
function bulkAction(action) {
    // Obtener IDs de usuarios seleccionados
    const selectedIds = [];
    $('.user-select:checked').each(function() {
        selectedIds.push($(this).val());
    });

    if (selectedIds.length === 0) {
        $('#bulkActionModal').modal('hide');
        return;
    }

    let confirmMessage = '';
    let endpoint = '';

    switch(action) {
        case 'email':
            confirmMessage = `¿Enviar email a ${selectedIds.length} usuarios?`;
            endpoint = '/Admin/api/users/bulk/email';
            break;
        case 'activate':
            confirmMessage = `¿Activar ${selectedIds.length} usuarios?`;
            endpoint = '/Admin/api/users/bulk/activate';
            break;
        case 'deactivate':
            confirmMessage = `¿Desactivar ${selectedIds.length} usuarios?`;
            endpoint = '/Admin/api/users/bulk/deactivate';
            break;
        case 'ban':
            confirmMessage = `¿Banear ${selectedIds.length} usuarios?`;
            endpoint = '/Admin/api/users/bulk/ban';
            break;
        case 'delete':
            confirmMessage = `¿Eliminar ${selectedIds.length} usuarios? Esta acción no se puede deshacer.`;
            endpoint = '/Admin/api/users/bulk/delete';
            break;
    }

    if (confirm(confirmMessage)) {
        $.ajax({
            url: endpoint,
            type: action === 'delete' ? 'DELETE' : 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ userIds: selectedIds }),
            success: function() {
                let successMessage = '';
                switch(action) {
                    case 'email': successMessage = 'Emails enviados correctamente'; break;
                    case 'activate': successMessage = 'Usuarios activados correctamente'; break;
                    case 'deactivate': successMessage = 'Usuarios desactivados correctamente'; break;
                    case 'ban': successMessage = 'Usuarios baneados correctamente'; break;
                    case 'delete': successMessage = 'Usuarios eliminados correctamente'; break;
                }

                showToast(successMessage, 'success');
                $('#bulkActionModal').modal('hide');

                // Recargar la tabla
                loadUsers();
            },
            error: function(xhr) {
                showError('Error al procesar la acción: ' + (xhr.responseText || 'Error desconocido'));
            }
        });
    }

    $('#bulkActionModal').modal('hide');
}

// Función para mostrar mensajes de éxito con toast
function showToast(message, type = 'success') {
    // Verificar si el toast container existe, si no, crearlo
    let toastContainer = $('.toast-container');
    if (toastContainer.length === 0) {
        toastContainer = $('<div class="toast-container position-fixed bottom-0 end-0 p-3"></div>');
        $('body').append(toastContainer);
    }

    // Crear el toast
    const toastId = 'toast-' + Date.now();
    const toast = `
        <div id="${toastId}" class="toast bg-${type} text-white" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Notificación</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    // Añadir el toast al container
    toastContainer.append(toast);

    // Inicializar y mostrar el toast
    const toastElement = new bootstrap.Toast(document.getElementById(toastId), {
        delay: 5000
    });
    toastElement.show();
}

// Función para mostrar mensajes de error
function showError(message) {
    showToast(message, 'danger');
}