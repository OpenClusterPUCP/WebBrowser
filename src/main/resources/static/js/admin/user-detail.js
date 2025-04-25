/**
 * Script para la página de detalle de usuario
 * Gestiona la visualización de datos y las acciones sobre el usuario
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("Documento de detalle de usuario cargado completamente");

    // Referencias a elementos DOM
    const userId = document.querySelector('.btn-resources').getAttribute('data-userid');
    const resourcesModal = document.getElementById('resourcesModal');
    const btnResources = document.querySelectorAll('.btn-resources');
    const btnBan = document.querySelector('.btn-ban');
    const btnRestore = document.querySelector('.btn-restore');
    const resourcePeriodSelect = document.getElementById('resourcePeriod');

    // Referencias de elementos DOM - Control de recursos
    const sliders = document.querySelectorAll('.resource-slider');
    const saveResourcesBtn = document.getElementById('saveResources');
    const cancelResourcesBtn = document.getElementById('cancelResources');
    const modalCloseButtons = document.querySelectorAll('.modal-close');

    // Referencias de elementos DOM - Editar usuarios
    const btnEditUser = document.getElementById('btnEditUser');
    const editUserModal = document.getElementById('editUserModal');
    const saveEditUserBtn = document.getElementById('saveEditUser');
    const cancelEditUserBtn = document.getElementById('cancelEditUser');
    const changePasswordCheckbox = document.getElementById('changePassword');

    // Cargar datos iniciales
    loadUserResources(userId);
    initResourceChart('week'); // Cargar gráfico con datos de una semana por defecto

    // =====================================================================
    // Funciones de utilidad
    // =====================================================================

    /**
     * Muestra un mensaje de alerta al usuario usando SweetAlert2
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de alerta (success, error, warning, info)
     * @param {number} duration - Duración en milisegundos antes de desaparecer (0 para no desaparecer)
     */
    function showAlert(message, type = 'info', duration = 5000) {
        // Asegurar que SweetAlert se muestre por encima de los modales
        const currentModals = document.querySelectorAll('.modal[style*="display: block"]');

        // Almacenar referencia a modales abiertos
        const openModals = [];
        currentModals.forEach(modal => {
            openModals.push(modal);
            // Ocultar temporalmente sin eliminar el backdrop
            modal.style.visibility = 'hidden';
        });

        return Swal.fire({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            text: message,
            icon: type,
            confirmButtonText: "Aceptar",
            confirmButtonColor: type === 'info' ? '#4361ee' :
                type === 'success' ? '#06d6a0' :
                    type === 'warning' ? '#ffd166' :
                        type === 'error' ? '#ef476f' : '#4361ee',
            timer: duration > 0 ? duration : undefined
        }).then(result => {
            // Restaurar modales abiertos
            openModals.forEach(modal => {
                modal.style.visibility = 'visible';
            });
            return result;
        });
    }

    /**
     * Abre un modal
     * @param {HTMLElement} modal - Modal a abrir
     */
    function openModal(modal) {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Evitar scroll en el fondo
        }
    }

    /**
     * Cierra un modal
     * @param {HTMLElement} modal - Modal a cerrar
     */
    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restaurar scroll
        }
    }

    // =====================================================================
    // Funciones para datos y gráficos
    // =====================================================================

    /**
     * Carga los recursos del usuario
     * @param {string} userId - ID del usuario
     */
    function loadUserResources(userId) {
        // Actualizar datos en la tarjeta de recursos
        updateResourceCardUI({loading: true});

        // Simular carga de datos (en implementación real, esto sería una llamada a la API)
        setTimeout(() => {
            // Datos simulados
            const resourceData = {
                vcpu: 4,
                ram: 8,
                storage: 100,
                slices: 3,
                vcpuUsed: 1,
                ramUsed: 3,
                storageUsed: 15,
                slicesUsed: 1
            };

            // Actualizar UI de la tarjeta de recursos
            updateResourceCardUI(resourceData);

            // Actualizar valores en el modal de recursos
            updateResourceModalUI(resourceData);
        }, 500);
    }

    /**
     * Actualiza la interfaz de la tarjeta de recursos
     * @param {Object} data - Datos de recursos
     */
    function updateResourceCardUI(data) {
        if (data.loading) {
            // Mostrar estado de carga
            document.getElementById('vcpu-value').textContent = '...';
            document.getElementById('ram-value').textContent = '...';
            document.getElementById('storage-value').textContent = '...';
            document.getElementById('slices-value').textContent = '...';

            document.getElementById('vcpu-progress').style.width = '0%';
            document.getElementById('ram-progress').style.width = '0%';
            document.getElementById('storage-progress').style.width = '0%';
            document.getElementById('slices-progress').style.width = '0%';

            return;
        }

        // Actualizar valores
        document.getElementById('vcpu-value').textContent = data.vcpu;
        document.getElementById('ram-value').textContent = data.ram;
        document.getElementById('storage-value').textContent = data.storage;
        document.getElementById('slices-value').textContent = data.slices;

        // Calcular porcentajes de uso
        const vcpuPercent = Math.round((data.vcpuUsed / data.vcpu) * 100);
        const ramPercent = Math.round((data.ramUsed / data.ram) * 100);
        const storagePercent = Math.round((data.storageUsed / data.storage) * 100);
        const slicesPercent = Math.round((data.slicesUsed / data.slices) * 100);

        // Actualizar barras de progreso
        const vcpuProgress = document.getElementById('vcpu-progress');
        vcpuProgress.style.width = `${vcpuPercent}%`;
        vcpuProgress.textContent = `${vcpuPercent}%`;

        const ramProgress = document.getElementById('ram-progress');
        ramProgress.style.width = `${ramPercent}%`;
        ramProgress.textContent = `${ramPercent}%`;

        const storageProgress = document.getElementById('storage-progress');
        storageProgress.style.width = `${storagePercent}%`;
        storageProgress.textContent = `${storagePercent}%`;

        const slicesProgress = document.getElementById('slices-progress');
        slicesProgress.style.width = `${slicesPercent}%`;
        slicesProgress.textContent = `${slicesPercent}%`;

        // Asignar colores según el uso
        [vcpuProgress, ramProgress, storageProgress, slicesProgress].forEach(progress => {
            const percent = parseInt(progress.style.width);
            progress.classList.remove('bg-success', 'bg-warning', 'bg-danger');

            if (percent < 60) {
                progress.classList.add('bg-success');
            } else if (percent < 85) {
                progress.classList.add('bg-warning');
            } else {
                progress.classList.add('bg-danger');
            }
        });
    }

    /**
     * Actualiza la interfaz del modal de recursos
     * @param {Object} data - Datos de recursos
     */
    function updateResourceModalUI(data) {
        // Asignar valores a los controles
        document.getElementById('vcpuSlider').value = data.vcpu;
        document.getElementById('vcpuValue').value = data.vcpu;

        document.getElementById('ramSlider').value = data.ram;
        document.getElementById('ramValue').value = data.ram;

        document.getElementById('storageSlider').value = data.storage;
        document.getElementById('storageValue').value = data.storage;

        document.getElementById('slicesSlider').value = data.slices;
        document.getElementById('slicesValue').value = data.slices;

        // Actualizar datos de uso
        document.getElementById('vcpuUsed').textContent = data.vcpuUsed;
        document.getElementById('vcpuTotal').textContent = data.vcpu;

        document.getElementById('ramUsed').textContent = data.ramUsed;
        document.getElementById('ramTotal').textContent = data.ram;

        document.getElementById('storageUsed').textContent = data.storageUsed;
        document.getElementById('storageTotal').textContent = data.storage;

        document.getElementById('slicesUsed').textContent = data.slicesUsed;
        document.getElementById('slicesTotal').textContent = data.slices;
    }

    /**
     * Inicializa el gráfico de uso de recursos
     * @param {string} period - Periodo de tiempo ('day', 'week', 'month')
     */
    function initResourceChart(period) {
        // Generar datos simulados según el periodo
        const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
        const dataPoints = days * (period === 'day' ? 24 : 1); // Horas o días

        // Crear fechas para el eje X
        const categories = [];
        const now = new Date();
        for (let i = dataPoints - 1; i >= 0; i--) {
            const date = new Date(now);
            if (period === 'day') {
                date.setHours(now.getHours() - i);
                categories.push(`${date.getHours()}:00`);
            } else {
                date.setDate(now.getDate() - i);
                categories.push(`${date.getDate()}/${date.getMonth() + 1}`);
            }
        }

        // Generar valores simulados para los recursos
        function generateData(min, max, trend = 0) {
            const data = [];
            let value = min + Math.random() * (max - min);

            for (let i = 0; i < dataPoints; i++) {
                // Añadir algo de variación con tendencia opcional
                value = Math.max(min, Math.min(max, value + trend + (Math.random() - 0.5) * max * 0.1));
                data.push(Math.round(value * 100) / 100);
            }
            return data;
        }

        // Datos simulados con tendencias
        const cpuData = generateData(0.5, 3, 0.01);  // Ligero aumento
        const ramData = generateData(2, 6, 0);       // Estable
        const storageData = generateData(10, 30, 0.2); // Aumento constante

        // Opciones del gráfico
        const options = {
            series: [
                {
                    name: 'CPU (vCPU)',
                    data: cpuData
                },
                {
                    name: 'RAM (GB)',
                    data: ramData
                },
                {
                    name: 'Almacenamiento (GB)',
                    data: storageData
                }
            ],
            chart: {
                height: 300,
                type: 'line',
                dropShadow: {
                    enabled: true,
                    color: '#000',
                    top: 18,
                    left: 7,
                    blur: 10,
                    opacity: 0.1
                },
                toolbar: {
                    show: false
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            colors: ['#4361ee', '#25a5e9', '#ef476f'],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            title: {
                text: `Uso de recursos (${period === 'day' ? 'Último día' : period === 'week' ? 'Última semana' : 'Último mes'})`,
                align: 'left'
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                }
            },
            markers: {
                size: 1
            },
            xaxis: {
                categories: categories,
                title: {
                    text: period === 'day' ? 'Hora' : 'Fecha'
                }
            },
            yaxis: {
                title: {
                    text: 'Consumo'
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                floating: true,
                offsetY: -25,
                offsetX: -5
            },
            tooltip: {
                shared: true,
                intersect: false
            }
        };

        // Destruir gráfico existente si lo hay
        if (window.resourceChart && typeof window.resourceChart.destroy === 'function') {
            window.resourceChart.destroy();
        }

        // Crear nuevo gráfico
        const chartElement = document.getElementById('resourceChart');
        if (chartElement) {
            window.resourceChart = new ApexCharts(chartElement, options);
            window.resourceChart.render();
        }
    }

    // =====================================================================
    // Event Listeners
    // =====================================================================

    // Cambiar periodo del gráfico
    if (resourcePeriodSelect) {
        resourcePeriodSelect.addEventListener('change', function() {
            initResourceChart(this.value);
        });
    }

    // Abrir modal de recursos
    btnResources.forEach(button => {
        button.addEventListener('click', function() {
            openModal(resourcesModal);
        });
    });

    // Cerrar modales
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });

    if (cancelResourcesBtn) {
        cancelResourcesBtn.addEventListener('click', function() {
            closeModal(resourcesModal);
        });
    }

    // Sincronizar sliders con inputs numéricos
    sliders.forEach(slider => {
        const valueInput = document.getElementById(slider.id.replace('Slider', 'Value'));

        if (valueInput) {
            slider.addEventListener('input', function() {
                valueInput.value = this.value;

                // Actualizar valor total en el resumen
                const resourceType = this.id.replace('Slider', '').toLowerCase();
                const totalElement = document.getElementById(`${resourceType}Total`);
                if (totalElement) {
                    totalElement.textContent = this.value;
                }
            });

            valueInput.addEventListener('input', function() {
                const slider = document.getElementById(this.id.replace('Value', 'Slider'));
                if (slider) {
                    slider.value = this.value;

                    // Actualizar valor total en el resumen
                    const resourceType = this.id.replace('Value', '').toLowerCase();
                    const totalElement = document.getElementById(`${resourceType}Total`);
                    if (totalElement) {
                        totalElement.textContent = this.value;
                    }
                }
            });
        }
    });

    // Guardar cambios en recursos
    if (saveResourcesBtn) {
        saveResourcesBtn.addEventListener('click', function() {
            // Obtener valores actuales
            const resourceData = {
                userId: userId,
                vcpu: parseInt(document.getElementById('vcpuValue').value),
                ram: parseInt(document.getElementById('ramValue').value),
                disk: parseInt(document.getElementById('storageValue').value),
                maxSlices: parseInt(document.getElementById('slicesValue').value)
            };

            console.log("Guardando recursos:", resourceData);

            // Mostrar diálogo de confirmación
            Swal.fire({
                title: "¿Guardar recursos?",
                text: `¿Está seguro de asignar ${resourceData.vcpu} vCPU, ${resourceData.ram} GB de RAM, ${resourceData.disk} GB de almacenamiento y ${resourceData.maxSlices} slices máximos al usuario?`,
                icon: "warning",
                showCancelButton: true,
                cancelButtonText: "Cancelar",
                confirmButtonText: "Confirmar",
                confirmButtonClass: "btn btn-primary",
                cancelButtonClass: "btn btn-light",
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // Ocultar modales abiertos antes de mostrar el indicador de carga
                    const openModals = document.querySelectorAll('.modal[style*="display: block"]');
                    openModals.forEach(modal => {
                        modal.style.visibility = 'hidden';
                    });

                    // Mostrar indicador de carga
                    Swal.fire({
                        title: "Procesando",
                        text: "Actualizando recursos...",
                        icon: "info",
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });

                    // En implementación real, llamar al API
                    // Por ahora, simular operación exitosa
                    setTimeout(() => {
                        Swal.close();
                        showAlert(`Recursos actualizados correctamente para usuario ID: ${userId}`, 'success');
                        closeModal(resourcesModal);

                        // Actualizar la visualización de recursos en la tarjeta
                        const newResourceData = {
                            vcpu: resourceData.vcpu,
                            ram: resourceData.ram,
                            storage: resourceData.disk,
                            slices: resourceData.maxSlices,
                            vcpuUsed: document.getElementById('vcpuUsed').textContent,
                            ramUsed: document.getElementById('ramUsed').textContent,
                            storageUsed: document.getElementById('storageUsed').textContent,
                            slicesUsed: document.getElementById('slicesUsed').textContent
                        };

                        updateResourceCardUI(newResourceData);
                    }, 1000);
                }
            });
        });
    }

    // Suspender usuario
    if (btnBan) {
        btnBan.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');

            Swal.fire({
                title: "Confirmar suspensión",
                text: "¿Está seguro que desea suspender este usuario? Esto afectará su acceso al sistema y a todos sus recursos.",
                icon: "warning",
                showCancelButton: true,
                cancelButtonText: "Cancelar",
                confirmButtonText: "Suspender",
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                buttonsStyling: true
            }).then((result) => {
                if (result.isConfirmed) {
                    // Ocultar modales abiertos antes de mostrar el indicador de carga
                    const openModals = document.querySelectorAll('.modal[style*="display: block"]');
                    openModals.forEach(modal => {
                        modal.style.visibility = 'hidden';
                    });

                    // Mostrar indicador de carga
                    Swal.fire({
                        title: "Procesando",
                        text: "Suspendiendo usuario...",
                        icon: "info",
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });

                    // Llamada a la API para suspender usuario
                    fetch(`/Admin/api/users/${userId}/ban`, {
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
                            Swal.close();
                            showAlert("Usuario suspendido correctamente", "success");

                            // Recargar la página para mostrar el estado actualizado
                            setTimeout(() => {
                                location.reload();
                            }, 1500);
                        })
                        .catch(error => {
                            Swal.close();
                            showAlert("Error al suspender usuario: " + error.message, "error");
                        });
                }
            });
        });
    }

    // Restaurar usuario
    if (btnRestore) {
        btnRestore.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');

            Swal.fire({
                title: "Confirmar restauración",
                text: "¿Está seguro que desea restaurar este usuario? Esto restablecerá su acceso al sistema y a todos sus recursos.",
                icon: "question",
                showCancelButton: true,
                cancelButtonText: "Cancelar",
                confirmButtonText: "Restaurar",
                confirmButtonColor: "#28a745",
                cancelButtonColor: "#f8f9fa",
                buttonsStyling: true
            }).then((result) => {
                if (result.isConfirmed) {
                    // Ocultar modales abiertos antes de mostrar el indicador de carga
                    const openModals = document.querySelectorAll('.modal[style*="display: block"]');
                    openModals.forEach(modal => {
                        modal.style.visibility = 'hidden';
                    });

                    // Mostrar indicador de carga
                    Swal.fire({
                        title: "Procesando",
                        text: "Restaurando usuario...",
                        icon: "info",
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });

                    // Llamada a la API para restaurar usuario
                    fetch(`/Admin/api/users/${userId}/unban`, {
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
                            Swal.close();
                            showAlert("Usuario restaurado correctamente", "success");

                            // Recargar la página para mostrar el estado actualizado
                            setTimeout(() => {
                                location.reload();
                            }, 1500);
                        })
                        .catch(error => {
                            Swal.close();
                            showAlert("Error al restaurar usuario: " + error.message, "error");
                        });
                }
            });
        });
    }

    // Abrir modal de edición
    if (btnEditUser) {
        btnEditUser.addEventListener('click', function() {
            openModal(editUserModal);
        });
    }

    // Cerrar modal de edición
    if (cancelEditUserBtn) {
        cancelEditUserBtn.addEventListener('click', function() {
            closeModal(editUserModal);
        });
    }

    // Guardar cambios de edición
    if (saveEditUserBtn) {
        saveEditUserBtn.addEventListener('click', function() {
            // Validar formulario
            const form = document.getElementById('editUserForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Validar correo electrónico
            const email = document.getElementById('editUserUsername').value;
            if (!validateEmail(email)) {
                showAlert('Por favor, ingrese un correo electrónico válido', 'error');
                return;
            }

            // Validar formato de código
            const code = document.getElementById('editUserCode').value;
            if (!/^[a-zA-Z0-9]+$/.test(code)) {
                showAlert('El código solo puede contener letras y números', 'error');
                return;
            }

            // Recoger datos del formulario
            const userId = document.getElementById('editUserId').value;
            const formData = {
                id: userId,
                name: document.getElementById('editUserName').value,
                lastname: document.getElementById('editUserLastName').value,
                username: document.getElementById('editUserUsername').value,
                code: document.getElementById('editUserCode').value,
                roleId: document.getElementById('editUserRole').value,
                state: convertStateToDb(document.getElementById('editUserState').value),
                generatePassword: document.getElementById('changePassword').checked
            };

            console.log("Datos del formulario de edición:", formData);

            // Mostrar diálogo de confirmación
            Swal.fire({
                title: "Confirmar cambios",
                text: `¿Está seguro que desea guardar los cambios realizados al usuario?`,
                icon: "question",
                showCancelButton: true,
                cancelButtonText: "Cancelar",
                confirmButtonText: "Guardar cambios",
                confirmButtonColor: "#007bff",
                cancelButtonColor: "#f8f9fa",
                buttonsStyling: true
            }).then((result) => {
                if (result.isConfirmed) {
                    // Ocultar modales abiertos antes de mostrar el indicador de carga
                    const openModals = document.querySelectorAll('.modal[style*="display: block"]');
                    openModals.forEach(modal => {
                        modal.style.visibility = 'hidden';
                    });

                    // Mostrar indicador de carga
                    Swal.fire({
                        title: "Procesando",
                        text: "Guardando cambios...",
                        icon: "info",
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });

                    // Enviar datos al servidor
                    fetch(`/Admin/api/users/${userId}`, {
                        method: 'PUT',
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
                            console.log("Usuario actualizado exitosamente:", data);

                            Swal.fire({
                                title: "Cambios guardados",
                                text: "Los datos del usuario han sido actualizados correctamente" +
                                    (formData.generatePassword ? ". La nueva contraseña ha sido registrada en los logs del servidor." : ""),
                                icon: "success",
                                confirmButtonText: "Aceptar",
                                confirmButtonColor: "#28a745"
                            }).then(() => {
                                // Cerrar modal
                                closeModal(editUserModal);

                                // Recargar la página para ver los cambios actualizados
                                location.reload();
                            });
                        })
                        .catch(error => {
                            console.error("Error al actualizar usuario:", error);
                            Swal.fire({
                                title: "Error",
                                text: "Error al actualizar usuario: " + error.message,
                                icon: "error",
                                confirmButtonText: "Aceptar",
                                confirmButtonColor: "#dc3545"
                            });
                        });
                }
            });
        });
    }

    // Función para validar correo electrónico
    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    }

    // Función para convertir estado UI a DB
    function convertStateToDb(uiState) {
        if (uiState === 'active') return '1';
        if (uiState === 'banned') return '0';
        return uiState;
    }

});