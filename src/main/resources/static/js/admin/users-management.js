document.addEventListener('DOMContentLoaded', function() {
    console.log("Documento cargado completamente");

    // Inicializar DataTables si existe la tabla
    if (document.getElementById('usersTable')) {
        console.log("Inicializando DataTables");
        $('#usersTable').DataTable({
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
            },
            responsive: true,
            columnDefs: [
                { responsivePriority: 1, targets: 0 }, // ID
                { responsivePriority: 2, targets: 1 }, // Nombre
                { responsivePriority: 3, targets: 7 }  // Acciones
            ]
        });
    }

    // Referencias de elementos DOM
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuToggle = document.querySelector('.menu-toggle');
    const sectionLinks = document.querySelectorAll('.sidebar-menu a[data-section]');

    // Modales
    const createUserModal = document.getElementById('createUserModal');
    const importUsersModal = document.getElementById('importUsersModal');
    const resourcesModal = document.getElementById('resourcesModal');

    // Botones para abrir modales
    const btnCreateUser = document.getElementById('btnCreateUser');
    const btnImportUsers = document.getElementById('btnImportUsers');
    const resourceButtons = document.querySelectorAll('.resource-btn');

    // Botones para cerrar modales
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    const cancelUserBtn = document.getElementById('cancelUser');
    const cancelImportBtn = document.getElementById('cancelImport');
    const cancelResourcesBtn = document.getElementById('cancelResources');

    // Tabs en el modal de recursos
    const resourceTabs = document.querySelectorAll('.resource-tab');
    const resourceContents = document.querySelectorAll('.resource-content');

    // Control de importación de archivo
    const uploadDropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFile');

    // Control de recursos
    const sliders = document.querySelectorAll('.resource-slider');

    // Botones de acción
    const viewButtons = document.querySelectorAll('.view-btn');
    const editButtons = document.querySelectorAll('.edit-btn');
    const banButtons = document.querySelectorAll('.ban-btn');
    const restoreButtons = document.querySelectorAll('.restore-btn');

    // Ocultar/mostrar sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        mainContent.classList.toggle('full-width');
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('visible');
        });
    }

    // Navegación entre secciones
    sectionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Actualizar clase activa en menú
            sectionLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            // Actualizar título de página
            const sectionTitle = this.querySelector('span').textContent;
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                pageTitle.textContent = sectionTitle;
            }

            // En dispositivos móviles, cerrar sidebar al navegar
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('visible');
            }
        });
    });

    // Funciones para modales
    function openModal(modal) {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Evitar scroll en el fondo

            // Si es el modal de recursos, inicializar los gráficos cuando se abre
            if (modal === resourcesModal) {
                // Reiniciar la bandera de inicialización
                window.chartsInitialized = false;
                setTimeout(function() {
                    initCharts();
                    window.chartsInitialized = true;
                }, 100);
            }
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restaurar scroll
        }
    }

    // Asignar eventos para abrir modales
    if (btnCreateUser) {
        btnCreateUser.addEventListener('click', function() {
            document.getElementById('userForm').reset(); // Limpiar formulario
            openModal(createUserModal);
        });
    }

    if (btnImportUsers) {
        btnImportUsers.addEventListener('click', function() {
            openModal(importUsersModal);
        });
    }

    // Asignar eventos a botones de gestión de recursos
    resourceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            console.log("Abriendo modal de recursos para usuario ID:", userId);
            // Aquí se podría cargar la información del usuario con una llamada AJAX
            document.getElementById('resourceUserName').textContent = 'Usuario #' + userId;
            openModal(resourcesModal);
        });
    });

    // Cerrar modales con botones de cancelar
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });

    if (cancelUserBtn) cancelUserBtn.addEventListener('click', () => closeModal(createUserModal));
    if (cancelImportBtn) cancelImportBtn.addEventListener('click', () => closeModal(importUsersModal));
    if (cancelResourcesBtn) cancelResourcesBtn.addEventListener('click', () => closeModal(resourcesModal));

    // Cerrar modales al hacer clic fuera del contenido
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Cambio de pestañas en modal de recursos
    resourceTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            console.log("Cambiando a pestaña:", tabId);

            resourceTabs.forEach(t => t.classList.remove('active'));
            resourceContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const content = document.getElementById(tabId);
            if (content) {
                content.classList.add('active');

                // Solo inicializar los gráficos si es la pestaña que los contiene
                // y no están ya inicializados
                if ((tabId === 'usage' || tabId === 'history') && !window.chartsInitialized) {
                    setTimeout(function() {
                        initCharts();
                        // Marcar que los gráficos ya están inicializados
                        window.chartsInitialized = true;
                    }, 100);
                }
            }
        });
    });

    // Manejo de subida de archivos
    if (uploadDropzone && fileInput) {
        uploadDropzone.addEventListener('click', function() {
            fileInput.click();
        });

        uploadDropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--primary-color)';
            this.style.background = 'rgba(67, 97, 238, 0.05)';
        });

        uploadDropzone.addEventListener('dragleave', function() {
            this.style.borderColor = 'var(--border-color)';
            this.style.background = 'var(--light-color)';
        });

        uploadDropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.background = 'var(--light-color)';

            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
                handleFileUpload(file);
            } else {
                alert('Por favor, seleccione un archivo CSV válido.');
            }
        });

        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                if (file.name.endsWith('.csv')) {
                    handleFileUpload(file);
                } else {
                    alert('Por favor, seleccione un archivo CSV válido.');
                    this.value = '';
                }
            }
        });

        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', function() {
                fileInput.value = '';
                fileInfo.style.display = 'none';
                uploadDropzone.style.display = 'block';
            });
        }
    }

    function handleFileUpload(file) {
        console.log("Archivo seleccionado:", file.name);
        // Mostrar información del archivo
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);

        if (fileInfo) fileInfo.style.display = 'flex';
        if (uploadDropzone) uploadDropzone.style.display = 'none';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Sincronizar sliders con inputs numéricos
    sliders.forEach(slider => {
        const valueInput = document.getElementById(slider.id.replace('Slider', 'Value'));

        if (valueInput) {
            slider.addEventListener('input', function() {
                valueInput.value = this.value;
            });

            valueInput.addEventListener('input', function() {
                slider.value = this.value;
            });
        }
    });

    // Guardar nuevo usuario
    const saveUserBtn = document.getElementById('saveUser');
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', function() {
            // Validar formulario
            const form = document.getElementById('userForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Recoger datos del formulario
            const formData = {
                name: document.getElementById('userName').value,
                lastname: document.getElementById('userLastName').value,
                username: document.getElementById('userUsername').value,
                code: document.getElementById('userCode').value,
                roleId: document.getElementById('userRole').value,
                password: document.getElementById('userPassword').value,
                state: document.getElementById('userState').value
            };

            console.log("Datos del formulario:", formData);

            // Enviar datos al servidor
            fetch('/Admin/api/users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Usuario creado exitosamente:", data);
                    alert('Usuario creado con éxito: ' + formData.name + ' ' + formData.lastname);

                    // Cerrar modal
                    closeModal(createUserModal);

                    // Recargar la página para ver el nuevo usuario
                    location.reload();
                })
                .catch(error => {
                    console.error("Error al crear usuario:", error);
                    alert('Error al crear usuario: ' + error.message);
                });
        });
    }

    // Procesar importación de usuarios
    const processImportBtn = document.getElementById('processImport');
    if (processImportBtn) {
        processImportBtn.addEventListener('click', function() {
            const fileInputElem = document.getElementById('fileInput');
            const fileUploaded = fileInputElem && fileInputElem.files.length > 0;
            const sendCredentials = document.getElementById('sendCredentials')?.checked || false;
            const skipDuplicates = document.getElementById('skipDuplicates')?.checked || true;

            if (fileUploaded) {
                const file = fileInputElem.files[0];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('sendCredentials', sendCredentials);
                formData.append('skipDuplicates', skipDuplicates);

                fetch('/api/users/import', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Error en la respuesta del servidor: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log("Usuarios importados:", data);
                        alert(`Importación completada: ${data.imported} usuarios importados, ${data.skipped} omitidos.`);

                        // Cerrar modal
                        closeModal(importUsersModal);

                        // Recargar la página
                        location.reload();
                    })
                    .catch(error => {
                        console.error("Error al importar usuarios:", error);
                        alert('Error al importar usuarios: ' + error.message);
                    });
            } else {
                alert('Por favor, seleccione un archivo CSV');
            }
        });
    }

    // Guardar cambios en recursos
    const saveResourcesBtn = document.getElementById('saveResources');
    if (saveResourcesBtn) {
        saveResourcesBtn.addEventListener('click', function() {
            const userId = document.getElementById('resourceUserName').textContent.replace('Usuario #', '');
            const vcpu = document.getElementById('vcpuValue').value;
            const ram = document.getElementById('ramValue').value;
            const storage = document.getElementById('storageValue').value;
            const maxSlices = document.getElementById('slicesValue').value;

            const resourceData = {
                userId,
                vcpu,
                ram,
                storage,
                maxSlices
            };

            console.log("Datos de recursos a actualizar:", resourceData);

            // Aquí iría la llamada al servidor para actualizar los recursos
            // Por ahora, simulamos una respuesta exitosa

            alert('Recursos actualizados correctamente: ' +
                vcpu + ' vCPU, ' +
                ram + ' GB RAM, ' +
                storage + ' GB Almacenamiento, ' +
                maxSlices + ' Slices máximos');

            // Cerrar modal
            closeModal(resourcesModal);
        });
    }

    // Acciones de usuarios (Ver, Editar, Suspender, Restaurar)
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            console.log("Ver usuario:", userId);
            // Implementar visualización detallada del usuario
            alert(`Visualizando detalles del usuario ID: ${userId}`);
        });
    });

    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            console.log("Editar usuario:", userId);
            // Implementar edición de usuario
            alert(`Editando usuario ID: ${userId}`);
        });
    });

    banButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            console.log("Suspender usuario:", userId);

            if (confirm(`¿Está seguro que desea suspender al usuario con ID ${userId}?`)) {
                // Llamada al servidor para suspender usuario
                fetch(`/api/users/${userId}/ban`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Error en la respuesta del servidor: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log("Usuario suspendido:", data);
                        alert(`Usuario ID ${userId} suspendido correctamente`);

                        // Actualizar estado en la interfaz (en una aplicación real, recargaríamos la página)
                        const row = button.closest('tr');
                        const statusCell = row.querySelector('td:nth-child(6)');
                        statusCell.innerHTML = '<span class="badge badge-danger">Suspendido</span>';

                        // Cambiar botón de suspender por restaurar
                        button.innerHTML = '<i class="fas fa-undo"></i>';
                        button.title = 'Restaurar';
                        button.classList.remove('ban-btn');
                        button.classList.add('restore-btn');
                    })
                    .catch(error => {
                        console.error("Error al suspender usuario:", error);
                        alert('Error al suspender usuario: ' + error.message);
                    });
            }
        });
    });

    restoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            console.log("Restaurar usuario:", userId);

            if (confirm(`¿Está seguro que desea restaurar al usuario con ID ${userId}?`)) {
                // Llamada al servidor para restaurar usuario
                fetch(`/api/users/${userId}/restore`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Error en la respuesta del servidor: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log("Usuario restaurado:", data);
                        alert(`Usuario ID ${userId} restaurado correctamente`);

                        // Actualizar estado en la interfaz (en una aplicación real, recargaríamos la página)
                        const row = button.closest('tr');
                        const statusCell = row.querySelector('td:nth-child(6)');
                        statusCell.innerHTML = '<span class="badge badge-active">Activo</span>';

                        // Cambiar botón de restaurar por suspender
                        button.innerHTML = '<i class="fas fa-ban"></i>';
                        button.title = 'Suspender';
                        button.classList.remove('restore-btn');
                        button.classList.add('ban-btn');
                    })
                    .catch(error => {
                        console.error("Error al restaurar usuario:", error);
                        alert('Error al restaurar usuario: ' + error.message);
                    });
            }
        });
    });

    // Inicializar gráficos
    function initCharts() {
        console.log("Inicializando gráficos...");

        // Verificamos que exista Chart y los elementos canvas
        if (typeof Chart === 'undefined') {
            console.error("Chart.js no está disponible");
            return;
        }

        // Verificar si los elementos existen antes de intentar crear los charts
        const cpuChartElement = document.getElementById('cpuChart');
        const ramChartElement = document.getElementById('ramChart');
        const storageChartElement = document.getElementById('storageChart');
        const historyChartElement = document.getElementById('resourceHistoryChart');

        // Función de utilidad para destruir un chart existente y crear uno nuevo
        function createOrUpdateChart(element, config) {
            if (!element) return null;

            // Destruir el chart existente en este canvas si existe
            const existingChart = Chart.getChart(element);
            if (existingChart) {
                existingChart.destroy();
            }

            // Crear y devolver el nuevo chart
            return new Chart(element, config);
        }



        // Gráfico de historial de recursos
        if (historyChartElement) {
            console.log("Creando gráfico de historial");
            createOrUpdateChart(historyChartElement, {
                type: 'line',
                data: {
                    labels: ['1 Mar', '8 Mar', '15 Mar', '22 Mar', '29 Mar', '5 Abr', '12 Abr', '19 Abr'],
                    datasets: [
                        {
                            label: 'CPU (vCPU)',
                            data: [1, 1.5, 2, 2.4, 2.2, 2.5, 2.3, 2.5],
                            borderColor: 'rgba(67, 97, 238, 1)',
                            backgroundColor: 'rgba(67, 97, 238, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'RAM (GB)',
                            data: [2, 3, 4, 4.5, 4.2, 5, 5.1, 5.2],
                            borderColor: 'rgba(76, 201, 240, 1)',
                            backgroundColor: 'rgba(76, 201, 240, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Almacenamiento (GB)',
                            data: [10, 15, 25, 28, 30, 35, 40, 42],
                            borderColor: 'rgba(63, 55, 201, 1)',
                            backgroundColor: 'rgba(63, 55, 201, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Recursos Utilizados'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Fecha'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    }
                }
            });
        }

        console.log("Inicialización de gráficos completada");
    }

    // Gestionar el botón para ver métricas detalladas
    const btnViewDetailedMetrics = document.getElementById('btnViewDetailedMetrics');
    if (btnViewDetailedMetrics) {
        btnViewDetailedMetrics.addEventListener('click', function() {
            const userId = document.getElementById('resourceUserName').textContent.replace('Usuario #', '');
            window.location.href = `/Admin/users/${userId}/metrics`;
        });
    }

    // Cambiar período del historial
    const historyPeriod = document.getElementById('historyPeriod');
    if (historyPeriod) {
        historyPeriod.addEventListener('change', function() {
            console.log("Cambio de período:", this.value);
            // Aquí se implementaría la actualización del gráfico con datos del período seleccionado
        });
    }

    // Filtrar historial por tipo de recurso
    const historyResource = document.getElementById('historyResource');
    if (historyResource) {
        historyResource.addEventListener('change', function() {
            console.log("Filtro de recurso:", this.value);
            // Aquí se implementaría el filtrado del gráfico según el recurso seleccionado
        });
    }
});