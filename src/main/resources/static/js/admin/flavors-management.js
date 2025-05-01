/**
 * JavaScript para la gestión de Flavors
 * Este script maneja la carga de datos via AJAX y la interacción con la interfaz
 */
/**
 * JavaScript para la gestión de Flavors
 * Este script maneja la carga de datos via AJAX y la interacción con la interfaz
 */
/**
 * JavaScript para la gestión de Flavors
 * Este script maneja la carga de datos via AJAX y la interacción con la interfaz
 */
/**
 * JavaScript para la gestión de Flavors
 * Este script maneja la carga de datos via AJAX y la interacción con la interfaz
 */
/**
 * JavaScript para la gestión de Flavors
 * Este script maneja la carga de datos via AJAX y la interacción con la interfaz
 */
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar estilos CSS personalizados para mejorar la apariencia de la tabla
    const customStyles = `
        table.dataTable {
            border-collapse: separate !important;
            border-spacing: 0;
            width: 100% !important;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        table.dataTable thead th {
            background-color: #3f51b5;
            color: white;
            font-weight: 500;
            border-bottom: none !important;
            padding: 15px 18px;
            position: relative;
        }
        
        table.dataTable tbody tr {
            background-color: #ffffff;
            transition: background-color 0.3s;
        }
        
        table.dataTable tbody tr:hover {
            background-color: rgba(197, 202, 233, 0.3);
        }
        
        table.dataTable tbody td {
            padding: 12px 18px;
            border-bottom: 1px solid #e0e0e0;
            vertical-align: middle;
        }
        
        .badge {
            display: inline-block;
            padding: 5px 10px;
            font-size: 0.8rem;
            font-weight: 500;
            line-height: 1;
            text-align: center;
            white-space: nowrap;
            vertical-align: baseline;
            border-radius: 50px;
        }
        
        .badge-active {
            background-color: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }
        
        .badge-danger {
            background-color: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }
        
        .badge-info {
            background-color: rgba(33, 150, 243, 0.2);
            color: #2196f3;
        }
        
        .badge-warning {
            background-color: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }
        
        .actions {
            display: flex;
            gap: 8px;
            justify-content: center;
        }
        
        .action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background-color: transparent;
            color: #757575;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .action-btn:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        
        .edit-btn:hover {
            color: #3f51b5;
        }
        
        .delete-btn:hover {
            color: #f44336;
        }
        
        .deactivate-btn:hover {
            color: #f44336;
        }
        
        .activate-btn:hover {
            color: #4caf50;
        }
        
        .resource-value {
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: 500;
        }
        
        .resource-icon {
            font-size: 1.1rem;
            margin-right: 5px;
            opacity: 0.7;
        }
        
        /* Animaciones para SweetAlert */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
        
        .animated {
            animation-duration: 0.5s;
            animation-fill-mode: both;
        }
        
        .fadeIn {
            animation-name: fadeIn;
        }
        
        .fadeOut {
            animation-name: fadeOut;
        }
        
        .faster {
            animation-duration: 0.3s;
        }
    `;

    // Crear y añadir el elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);

    // Inicializar tabla con DataTables
    const flavorsTable = $('#flavorsTable').DataTable({
        ajax: {
            url: '/Admin/api/flavors/list',
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

    // Función para mostrar mensajes de alerta
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alertMessage = document.getElementById('alertMessage');

        alertMessage.textContent = message;
        alertMessage.className = 'alert alert-' + type;
        alertContainer.style.display = 'block';

        // Ocultar después de 5 segundos
        setTimeout(() => {
            alertContainer.style.display = 'none';
        }, 5000);
    }

    // Modal para crear flavor
    const createFlavorModal = document.getElementById('createFlavorModal');
    const btnCreateFlavor = document.getElementById('btnCreateFlavor');
    const cancelFlavor = document.getElementById('cancelFlavor');
    const saveFlavor = document.getElementById('saveFlavor');
    const modalCloseButtons = document.querySelectorAll('.modal-close');

    // Abrir modal de crear flavor
    btnCreateFlavor.addEventListener('click', function() {
        document.getElementById('flavorForm').reset();
        saveFlavor.dataset.mode = 'create';
        delete saveFlavor.dataset.id;
        saveFlavor.textContent = 'Guardar';
        createFlavorModal.style.display = 'block';
    });

    // Cerrar modales con el botón de cerrar
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Cerrar modal de crear flavor con botón Cancelar
    cancelFlavor.addEventListener('click', function() {
        createFlavorModal.style.display = 'none';
    });

    // Guardar nuevo flavor
    saveFlavor.addEventListener('click', function() {
        // Si estamos en modo edición, llamar a la función específica
        if (this.dataset.mode === 'edit') {
            editFlavorSubmit();
            return;
        }

        const form = document.getElementById('flavorForm');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Mostrar animación de carga
        const saveButton = this;
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';

        const flavorData = {
            name: document.getElementById('flavorName').value,
            vcpu: parseInt(document.getElementById('flavorVcpu').value),
            ram: parseInt(document.getElementById('flavorRam').value),
            disk: parseInt(document.getElementById('flavorStorage').value),
            type: document.getElementById('flavorState').value
        };

        // Enviar los datos al servidor usando fetch
        fetch('/Admin/api/flavors/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flavorData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al crear el flavor');
                }
                return response.json();
            })
            .then(data => {
                createFlavorModal.style.display = 'none';

                // Restaurar el estado original del botón
                saveButton.disabled = false;
                saveButton.innerHTML = 'Guardar';

                // Notificación de éxito con animación
                Swal.fire({
                    title: '¡Flavor creado!',
                    text: 'El nuevo flavor ha sido creado correctamente.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    showClass: {
                        popup: 'animated fadeIn faster'
                    },
                    hideClass: {
                        popup: 'animated fadeOut faster'
                    }
                });

                // Recargar la tabla
                flavorsTable.ajax.reload();
            })
            .catch(error => {
                // Restaurar el estado original del botón
                saveButton.disabled = false;
                saveButton.innerHTML = 'Guardar';

                // Notificación de error
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
    });

    // Función para enviar la actualización de un flavor
    function editFlavorSubmit() {
        const form = document.getElementById('flavorForm');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Show loading animation
        const saveButton = document.getElementById('saveFlavor');
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Actualizando...';

        const flavorId = saveButton.dataset.id;
        const flavorData = {
            name: document.getElementById('flavorName').value,
            vcpu: parseInt(document.getElementById('flavorVcpu').value),
            ram: parseInt(document.getElementById('flavorRam').value),
            disk: parseInt(document.getElementById('flavorStorage').value),
            type: document.getElementById('flavorState').value
        };

        // Changed from PUT to POST and updated the endpoint path
        fetch(`/Admin/api/flavors/update/${flavorId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flavorData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al actualizar el flavor');
                }
                return response.json();
            })
            .then(data => {
                // Restore button to original state
                saveButton.disabled = false;
                saveButton.innerHTML = 'Guardar';
                saveButton.dataset.mode = 'create';
                delete saveButton.dataset.id;

                createFlavorModal.style.display = 'none';

                // Success notification with animation
                Swal.fire({
                    title: '¡Flavor actualizado!',
                    text: 'El flavor ha sido actualizado correctamente.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    showClass: {
                        popup: 'animated fadeIn faster'
                    },
                    hideClass: {
                        popup: 'animated fadeOut faster'
                    }
                });

                // Reload the table
                flavorsTable.ajax.reload();
            })
            .catch(error => {
                // Restore button to original state
                saveButton.disabled = false;
                saveButton.innerHTML = 'Actualizar';

                // Error notification
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
    }
    // Modal para importar flavors
    const importFlavorsModal = document.getElementById('importFlavorsModal');
    const cancelImport = document.getElementById('cancelImport');
    const processImport = document.getElementById('processImport');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');
    const downloadTemplate = document.getElementById('downloadTemplate');

    // Abrir modal de importar flavors


    // Cerrar modal de importar flavors
    cancelImport.addEventListener('click', function() {
        importFlavorsModal.style.display = 'none';
    });

    // Funcionalidad para arrastrar y soltar archivos
    uploadDropzone.addEventListener('click', function() {
        fileInput.click();
    });

    uploadDropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    uploadDropzone.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
    });

    uploadDropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Manejar selección de archivo
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFile(this.files[0]);
        }
    });

    // Procesar archivo seleccionado
    function handleFile(file) {
        if (file.type !== 'text/csv') {
            showAlert('Por favor, selecciona un archivo CSV válido', 'warning');
            return;
        }

        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);

        uploadDropzone.style.display = 'none';
        fileInfo.style.display = 'flex';
    }

    // Formatear tamaño de archivo
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // Eliminar archivo
    removeFile.addEventListener('click', function() {
        fileInput.value = '';
        fileInfo.style.display = 'none';
        uploadDropzone.style.display = 'block';
    });

    // Descargar plantilla CSV
    downloadTemplate.addEventListener('click', function(e) {
        e.preventDefault();

        const template = 'nombre,vcpu,ram,almacenamiento,tipo\n' +
            'Pequeño,1,2,20,public\n' +
            'Mediano,2,4,40,public\n' +
            'Grande,4,8,80,public';

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = 'plantilla_flavors.csv';
        document.body.appendChild(a);
        a.click();

        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    });

    // Procesar importación
    processImport.addEventListener('click', function() {
        if (!fileInput.files.length) {
            showAlert('Por favor, selecciona un archivo CSV', 'warning');
            return;
        }

        // Mostrar animación de carga
        const importButton = this;
        importButton.disabled = true;
        importButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Importando...';

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('skipDuplicates', document.getElementById('skipDuplicates').checked);

        fetch('/Admin/api/flavors/import', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al importar los flavors');
                }
                return response.json();
            })
            .then(data => {
                importFlavorsModal.style.display = 'none';

                // Restaurar el estado original del botón
                importButton.disabled = false;
                importButton.innerHTML = 'Importar';

                // Notificación de éxito con animación
                Swal.fire({
                    title: '¡Importación completada!',
                    text: `Se importaron ${data.imported || 0} flavors correctamente`,
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    showClass: {
                        popup: 'animated fadeIn faster'
                    },
                    hideClass: {
                        popup: 'animated fadeOut faster'
                    }
                });

                // Recargar la tabla
                flavorsTable.ajax.reload();
            })
            .catch(error => {
                // Restaurar el estado original del botón
                importButton.disabled = false;
                importButton.innerHTML = 'Importar';

                // Notificación de error
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
    });

    // Delegación de eventos para botones de acción
    document.querySelector('#flavorsTable tbody').addEventListener('click', function(e) {
        let target = e.target;

        // Si el evento se originó en un icono, obtener el botón padre
        if (target.tagName === 'I') {
            target = target.parentElement;
        }

        // No procesar si el botón está deshabilitado
        if (target.hasAttribute('disabled')) {
            return;
        }

        if (target.classList.contains('edit-btn')) {
            const flavorId = target.dataset.flavorid;
            editFlavor(flavorId);
        } else if (target.classList.contains('deactivate-btn')) {
            const flavorId = target.dataset.flavorid;
        } else if (target.classList.contains('activate-btn')) {
            const flavorId = target.dataset.flavorid;
        } else if (target.classList.contains('delete-btn')) {
            const flavorId = target.dataset.flavorid;
            deleteFlavor(flavorId);
        }
    });

    // Editar un flavor
    function editFlavor(id) {
        // Buscar el flavor en los datos actuales de la tabla
        const flavorData = flavorsTable.rows().data().toArray().find(flavor => flavor.idFlavor == id);

        if (flavorData) {
            // Usar el nombre si existe, o generar uno basado en las características
            const flavorName = flavorData.name || `Flavor-${flavorData.vcpu}cpu-${flavorData.ram}gb-${flavorData.disk}gb`;

            document.getElementById('flavorName').value = flavorName;
            document.getElementById('flavorVcpu').value = flavorData.vcpu;
            document.getElementById('flavorRam').value = flavorData.ram;
            document.getElementById('flavorStorage').value = flavorData.disk;
            document.getElementById('flavorState').value = flavorData.type;

            // Cambiar el comportamiento del botón Guardar
            saveFlavor.dataset.mode = 'edit';
            saveFlavor.dataset.id = id;
            saveFlavor.textContent = 'Actualizar';

            // Mostrar el modal
            createFlavorModal.style.display = 'block';
        } else {
            showAlert('No se encontraron datos del flavor', 'warning');
        }
    }

    // Eliminar un flavor
    function deleteFlavor(id) {
        Swal.fire({
            title: '¿Eliminar flavor?',
            text: 'Esta acción no se puede deshacer. ¿Estás seguro?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#f44336',
            cancelButtonColor: '#757575',
            showClass: {
                popup: 'animated fadeInDown faster'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar animación de carga
                Swal.fire({
                    title: 'Eliminando...',
                    html: '<i class="fas fa-circle-notch fa-spin fa-3x"></i>',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                fetch(`/Admin/api/flavors/delete/${id}`, {
                    method: 'DELETE'
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Error al eliminar el flavor');
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Animación de éxito
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El flavor ha sido eliminado correctamente.',
                            icon: 'success',
                            showConfirmButton: false,
                            timer: 1500,
                            showClass: {
                                popup: 'animated fadeIn faster'
                            },
                            hideClass: {
                                popup: 'animated fadeOut faster'
                            }
                        });

                        // Recargar la tabla
                        flavorsTable.ajax.reload();
                    })
                    .catch(error => {
                        Swal.fire({
                            title: 'Error',
                            text: error.message,
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    });
            }
        });
    }

    // Cambiar tipo de un flavor (público/privado)
});


document.addEventListener('DOMContentLoaded', function() {
    // Get the sidebar toggle button (assuming it has an ID of 'sidebarToggle')
    const sidebarToggle = document.getElementById('sidebarToggle');

    // Get the sidebar and main content elements
    const sidebar = document.querySelector('.app-container > div:first-child');
    const mainContent = document.querySelector('.main-content');

    // Add click event listener to the toggle button
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            // Toggle classes for sidebar collapse
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
});