/**
 * Script para la gestión de usuarios
 * Maneja todas las funcionalidades de la interfaz de administración de usuarios
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("Documento cargado completamente");

    // Referencias de elementos DOM - General
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuToggle = document.querySelector('.menu-toggle');
    const sectionLinks = document.querySelectorAll('.sidebar-menu a[data-section]');

    // Referencias de elementos DOM - Modales
    const createUserModal = document.getElementById('createUserModal');
    const importUsersModal = document.getElementById('importUsersModal');
    const resourcesModal = document.getElementById('resourcesModal');

    // Referencias de elementos DOM - Botones para abrir modales
    const btnCreateUser = document.getElementById('btnCreateUser');
    const btnImportUsers = document.getElementById('btnImportUsers');
    const resourceButtons = document.querySelectorAll('.resource-btn');

    // Referencias de elementos DOM - Botones para cerrar modales
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    const cancelUserBtn = document.getElementById('cancelUser');
    const cancelImportBtn = document.getElementById('cancelImport');
    const cancelResourcesBtn = document.getElementById('cancelResources');

    // Referencias de elementos DOM - Control de importación de archivo
    const uploadDropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFile');
    const downloadTemplateBtn = document.getElementById('downloadTemplate');

    // Referencias de elementos DOM - Control de contraseña
    const passwordInput = document.getElementById('userPassword');
    const passwordToggleBtns = document.querySelectorAll('.password-toggle');
    const passwordStrength = document.getElementById('passwordStrength');
    const strengthSegments = document.querySelectorAll('.strength-segment');
    const strengthText = document.querySelector('.strength-text');

    // Referencias de elementos DOM - Control de recursos
    const sliders = document.querySelectorAll('.resource-slider');
    const saveResourcesBtn = document.getElementById('saveResources');
    const btnViewDetailedMetrics = document.getElementById('btnViewDetailedMetrics');

    // Referencias de elementos DOM - Botones de acción
    const viewButtons = document.querySelectorAll('.view-btn');
    const editButtons = document.querySelectorAll('.edit-btn');
    const banButtons = document.querySelectorAll('.ban-btn');
    const restoreButtons = document.querySelectorAll('.restore-btn');

    // Variables globales
    let dataTable;
    let currentUserId = null;

    // Inicializar DataTables si existe la tabla
    if (document.getElementById('usersTable')) {
        console.log("Inicializando DataTables");
        dataTable = $('#usersTable').DataTable({
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
            },
            responsive: true,
            columnDefs: [
                { responsivePriority: 1, targets: 0 }, // ID
                { responsivePriority: 2, targets: 1 }, // Nombre
                { responsivePriority: 3, targets: 7 }  // Acciones
            ],
            dom: '<"top"lf>rt<"bottom"ip><"clear">',
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
            pageLength: 10
        });
    }

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
        Swal.fire({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            text: message,
            icon: type,
            confirmButtonText: "Aceptar",
            confirmButtonColor: getBtnColorByType(type),
            timer: duration > 0 ? duration : undefined
        });
    }

    /**
     * Obtiene el color del botón según el tipo de alerta, utilizando las variables CSS del proyecto
     * @param {string} type - Tipo de alerta
     * @return {string} Color en formato hexadecimal
     */
    function getBtnColorByType(type) {
        switch(type) {
            case 'success': return 'var(--success-color)'; // #06d6a0
            case 'error': return 'var(--danger-color)';    // #ef476f
            case 'warning': return 'var(--warning-color)'; // #ffd166
            case 'info':
            default: return 'var(--primary-color)';        // #4361ee
        }
    }


    /**
     * Muestra un diálogo de confirmación usando SweetAlert2
     * @param {string} title - Título del diálogo
     * @param {string} message - Mensaje a mostrar
     * @param {string} icon - Icono a mostrar (warning, question, info, success, error)
     * @param {string} confirmText - Texto del botón de confirmación
     * @param {string} cancelText - Texto del botón de cancelación
     * @param {Function} confirmCallback - Función a ejecutar si se confirma
     */
    function showConfirmation(title, message, icon, confirmText, cancelText, confirmCallback) {
        // Determinar el color del botón de confirmación basado en el tipo de diálogo
        let confirmColor;
        switch(icon) {
            case 'warning': confirmColor = 'var(--warning-color)'; break;
            case 'success': confirmColor = 'var(--success-color)'; break;
            case 'error': confirmColor = 'var(--danger-color)'; break;
            case 'question':
            case 'info':
            default: confirmColor = 'var(--primary-color)'; break;
        }

        Swal.fire({
            title: title,
            text: message,
            icon: icon,
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            cancelButtonColor: 'var(--text-muted)', // #6c757d
            confirmButtonText: confirmText,
            cancelButtonText: cancelText || 'Cancelar',
            reverseButtons: true,
            background: 'var(--light-color)',      // #f8f9fa
            borderRadius: 'var(--border-radius)',  // 8px
            // Personalización adicional para coincidir con el estilo de la aplicación
            buttonsStyling: true,
            customClass: {
                confirmButton: 'swal-confirm-button',
                cancelButton: 'swal-cancel-button'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                confirmCallback();
            }
        });
    }

    /**
     * Muestra un indicador de carga usando SweetAlert2
     * @param {string} title - Título del indicador
     * @param {string} message - Mensaje a mostrar
     */
    function showLoading(title, message) {
        Swal.fire({
            title: title,
            text: message,
            icon: 'info',
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            background: 'var(--light-color)',
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    /**
     * Agrega estilos CSS personalizados para SweetAlert
     * Esta función se debe llamar cuando el DOM esté cargado
     */
    function applySweetAlertStyles() {
        // Crear un elemento de estilo
        const style = document.createElement('style');
        style.textContent = `
        /* Estilos personalizados para SweetAlert */
        .swal2-popup {
            font-family: 'Segoe UI', 'Roboto', sans-serif;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-md);
        }
        
        .swal2-title {
            color: var(--text-color);
            font-weight: 600;
        }
        
        .swal2-content {
            color: var(--text-muted);
        }
        
        .swal2-confirm, .swal2-cancel {
            font-weight: 500;
            border-radius: var(--border-radius);
            padding: 10px 20px;
            font-size: 0.9rem;
        }
        
        /* Estilos para los iconos */
        .swal2-icon.swal2-info {
            color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
        }
        
        .swal2-icon.swal2-warning {
            color: var(--warning-color) !important;
            border-color: var(--warning-color) !important;
        }
        
        .swal2-icon.swal2-error {
            color: var(--danger-color) !important;
            border-color: var(--danger-color) !important;
        }
        
        .swal2-icon.swal2-question {
            color: var(--secondary-color) !important;
            border-color: var(--secondary-color) !important;
        }
        
        .swal2-icon.swal2-success {
            color: var(--success-color) !important;
            border-color: var(--success-color) !important;
        }
        
        .swal2-icon.swal2-success [class^=swal2-success-line] {
            background-color: var(--success-color) !important;
        }
        
        .swal2-icon.swal2-success .swal2-success-ring {
            border-color: var(--success-color) !important;
        }
    `;

        // Añadir el estilo al head del documento
        document.head.appendChild(style);
    }


    /**
     * Valida si una cadena es un correo electrónico válido
     * @param {string} email - Correo electrónico a validar
     * @return {boolean} Verdadero si es un correo válido
     */
    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    }

    /**
     * Formatea el tamaño de un archivo en unidades legibles
     * @param {number} bytes - Tamaño en bytes
     * @return {string} Tamaño formateado
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Valida una contraseña y devuelve su puntuación de fortaleza
     * @param {string} password - Contraseña a validar
     * @return {number} Puntuación de fortaleza (0-4)
     */
    function checkPasswordStrength(password) {
        let score = 0;

        // Si no hay contraseña, devolver 0
        if (!password) return score;

        // Verificar longitud
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;

        // Verificar complejidad
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        // Limitar puntuación máxima a 4
        return Math.min(score, 4);
    }

    /**
     * Actualiza el indicador visual de fortaleza de contraseña
     * @param {string} password - Contraseña a evaluar
     */
    function updatePasswordStrengthIndicator(password) {
        if (!passwordStrength) return;

        const strength = checkPasswordStrength(password);

        // Restablecer todas las barras
        strengthSegments.forEach(segment => {
            segment.className = 'strength-segment';
        });

        // Colorear segmentos según fortaleza
        for (let i = 0; i < strength; i++) {
            if (strengthSegments[i]) {
                if (strength === 1) {
                    strengthSegments[i].classList.add('weak');
                } else if (strength === 2) {
                    strengthSegments[i].classList.add('fair');
                } else if (strength === 3) {
                    strengthSegments[i].classList.add('good');
                } else {
                    strengthSegments[i].classList.add('strong');
                }
            }
        }

        // Actualizar texto
        if (strengthText) {
            switch (strength) {
                case 0:
                    strengthText.textContent = 'Sin contraseña';
                    break;
                case 1:
                    strengthText.textContent = 'Débil';
                    break;
                case 2:
                    strengthText.textContent = 'Regular';
                    break;
                case 3:
                    strengthText.textContent = 'Buena';
                    break;
                case 4:
                    strengthText.textContent = 'Fuerte';
                    break;
            }
        }
    }

    /**
     * Valida el formulario de usuario
     * @return {boolean} Verdadero si el formulario es válido
     */
    function validateUserForm() {
        const form = document.getElementById('userForm');
        if (!form) return false;

        // Validar correo electrónico (username)
        const username = document.getElementById('userUsername');
        if (username && !validateEmail(username.value)) {
            showAlert('Por favor, ingrese un correo electrónico válido', 'error');
            return false;
        }

        // Validar formato de código (alfanumérico)
        const code = document.getElementById('userCode');
        if (code && !/^[a-zA-Z0-9]+$/.test(code.value)) {
            showAlert('El código solo puede contener letras y números', 'error');
            return false;
        }

        return form.checkValidity();
    }

    /**
     * Convierte el estado de la UI al formato de DB
     * @param {string} uiState - Estado en formato UI (active/banned)
     * @return {string} Estado en formato DB (1/0)
     */
    function convertStateToDb(uiState) {
        if (uiState === 'active') return '1';
        if (uiState === 'banned') return '0';
        return uiState; // Devolver el valor original si no coincide
    }

    /**
     * Convierte el estado de DB al formato de UI
     * @param {string} dbState - Estado en formato DB (1/0)
     * @return {string} Estado en formato UI (active/banned)
     */
    function convertStateToUi(dbState) {
        if (dbState === '1') return 'active';
        if (dbState === '0') return 'banned';
        return dbState; // Devolver el valor original si no coincide
    }

    // =====================================================================
    // Funciones para modales
    // =====================================================================

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
    // Eventos y manipulación de DOM
    // =====================================================================

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
            // Actualizar clase activa en menú
            sectionLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            // En dispositivos móviles, cerrar sidebar al navegar
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('visible');
            }
        });
    });

    // Eventos de apertura de modales
    if (btnCreateUser) {
        btnCreateUser.addEventListener('click', function() {
            document.getElementById('userForm').reset(); // Limpiar formulario
            currentUserId = null; // Indicar que es un nuevo usuario

            // Restablecer indicador de fortaleza
            if (passwordStrength) {
                strengthSegments.forEach(segment => {
                    segment.className = 'strength-segment';
                });
                if (strengthText) strengthText.textContent = 'Contraseña generada automáticamente';
            }

            openModal(createUserModal);
        });
    }

    if (btnImportUsers) {
        btnImportUsers.addEventListener('click', function() {
            openModal(importUsersModal);
        });
    }

    // Eventos de cierre de modales
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

    // Manejo de visualización de contraseña
    passwordToggleBtns.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Verificar fuerza de contraseña
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrengthIndicator(this.value);
        });
    }

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
                showAlert('Por favor, seleccione un archivo CSV válido.', 'error');
            }
        });

        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                if (file.name.endsWith('.csv')) {
                    handleFileUpload(file);
                } else {
                    showAlert('Por favor, seleccione un archivo CSV válido.', 'error');
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

    // Descargar plantilla CSV
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Contenido de la plantilla CSV con correos electrónicos
            const csvContent = 'nombre,apellido,username,codigo,rol\nJuan,Perez,jperez@example.com,20231234,2\nMaria,Lopez,mlopez@example.com,20235678,2';

            // Crear un objeto Blob con el contenido CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            // Crear URL para descargar
            const url = URL.createObjectURL(blob);

            // Crear un elemento de enlace temporal para la descarga
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_usuarios.csv');

            // Añadir el enlace al documento, simular clic y eliminar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    function handleFileUpload(file) {
        console.log("Archivo seleccionado:", file.name);
        // Mostrar información del archivo
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);

        if (fileInfo) fileInfo.style.display = 'flex';
        if (uploadDropzone) uploadDropzone.style.display = 'none';
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

    // Asignar eventos a botones de gestión de recursos
    resourceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            currentUserId = userId;

            // Obtener información del usuario para mostrar en el modal
            const row = this.closest('tr');
            const userName = row.querySelector('td:nth-child(2)').textContent;
            const userCode = row.querySelector('td:nth-child(4)').textContent;
            const userRole = row.querySelector('td:nth-child(5)').textContent;

            // Actualizar la información en el modal
            document.getElementById('resourceUserName').textContent = userName;
            document.getElementById('resourceUserCode').querySelector('span').textContent = userCode;
            document.getElementById('resourceUserRole').querySelector('span').textContent = userRole;

            // Cargar datos de recursos actuales del usuario
            loadUserResources(userId);

            openModal(resourcesModal);
        });
    });

    // Cargar recursos del usuario desde el servidor
    function loadUserResources(userId) {
        // Mostrar un indicador de carga
        const loadingState = {
            vcpu: 1, ram: 2, storage: 50, slices: 1,
            vcpuUsed: 0, ramUsed: 0, storageUsed: 0, slicesUsed: 0
        };
        updateResourceUI(loadingState);

        // En una implementación real, aquí iría una llamada a la API
        // Por ahora, simular datos aleatorios para demostración
        setTimeout(() => {
            const vcpu = Math.floor(Math.random() * 8) + 1;
            const ram = Math.floor(Math.random() * 16) + 1;
            const storage = (Math.floor(Math.random() * 10) + 5) * 10;
            const slices = Math.floor(Math.random() * 5) + 1;

            const resourceData = {
                vcpu, ram, storage, slices,
                vcpuUsed: Math.floor(vcpu / 2),
                ramUsed: Math.floor(ram / 3),
                storageUsed: Math.floor(storage / 4),
                slicesUsed: Math.floor(slices / 2)
            };

            updateResourceUI(resourceData);
        }, 500);
    }

    // Actualizar la interfaz con los datos de recursos
    function updateResourceUI(data) {
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

    // Guardar cambios en recursos
    if (saveResourcesBtn) {
        saveResourcesBtn.addEventListener('click', function() {
            if (!currentUserId) {
                showAlert('Error: No se pudo identificar al usuario', 'error');
                return;
            }

            // Obtener valores actuales
            const resourceData = {
                userId: currentUserId,
                vcpu: parseInt(document.getElementById('vcpuValue').value),
                ram: parseInt(document.getElementById('ramValue').value),
                disk: parseInt(document.getElementById('storageValue').value),
                maxSlices: parseInt(document.getElementById('slicesValue').value)
            };

            console.log("Guardando recursos:", resourceData);

            // Mostrar diálogo de confirmación
            showConfirmation(
                "¿Guardar recursos?",
                `¿Está seguro de asignar ${resourceData.vcpu} vCPU, ${resourceData.ram} GB de RAM, ${resourceData.disk} GB de almacenamiento y ${resourceData.maxSlices} slices máximos al usuario?`,
                "warning",
                "Confirmar",
                "Cancelar",
                function() {
                    // En implementación real, llamar al API
                    // Por ahora, simular operación exitosa
                    setTimeout(() => {
                        showAlert(`Recursos actualizados correctamente para usuario ID: ${currentUserId}`, 'success');
                        closeModal(resourcesModal);
                    }, 500);
                }
            );
        });
    }

    // Ver métricas detalladas
    if (btnViewDetailedMetrics) {
        btnViewDetailedMetrics.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUserId) {
                window.location.href = `/Admin/users/${currentUserId}/metrics`;
            }
        });
    }

    // Guardar nuevo usuario
    const saveUserBtn = document.getElementById('saveUser');
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', function() {
            // Validar formulario
            if (!validateUserForm()) {
                return;
            }

            // Recoger datos del formulario
            const formData = {
                name: document.getElementById('userName').value,
                lastname: document.getElementById('userLastName').value,
                username: document.getElementById('userUsername').value,
                code: document.getElementById('userCode').value,
                roleId: document.getElementById('userRole').value,
                state: convertStateToDb(document.getElementById('userState').value),
                generatePassword: true // Indicar que debe generar contraseña automáticamente
            };

            console.log("Datos del formulario:", formData);

            // Mostrar diálogo de confirmación
            showConfirmation(
                "Confirmar creación",
                `¿Crear nuevo usuario con correo ${formData.username}?`,
                "question",
                "Crear",
                "Cancelar",
                function() {
                    // Mostrar indicador de carga
                    showLoading("Procesando", "Creando usuario...");

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

                            // Mostrar mensaje con información sobre la contraseña
                            Swal.fire({
                                title: "Usuario creado",
                                text: `Usuario ${formData.name} ${formData.lastname} creado con éxito. La contraseña generada ha sido registrada en los logs del servidor.`,
                                icon: "success",
                                confirmButtonText: "Aceptar",
                                confirmButtonColor: "#28a745"
                            }).then(() => {
                                // Cerrar modal
                                closeModal(createUserModal);

                                // Recargar la página para ver el nuevo usuario
                                location.reload();
                            });
                        })
                        .catch(error => {
                            console.error("Error al crear usuario:", error);
                            Swal.fire({
                                title: "Error",
                                text: "Error al crear usuario: " + error.message,
                                icon: "error",
                                confirmButtonText: "Aceptar",
                                confirmButtonColor: "#dc3545"
                            });
                        });
                }
            );
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
                // Mostrar diálogo de confirmación
                showConfirmation(
                    "Confirmar importación",
                    "¿Desea proceder con la importación de usuarios?",
                    "question",
                    "Importar",
                    "Cancelar",
                    function() {
                        // Mostrar indicador de carga
                        showLoading("Procesando", "Importando usuarios...");

                        const file = fileInputElem.files[0];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('sendCredentials', sendCredentials);
                        formData.append('skipDuplicates', skipDuplicates);

                        fetch('/Admin/api/users/import', {
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
                                Swal.fire({
                                    title: "Importación completada",
                                    text: `Se importaron ${data.imported} usuarios y se omitieron ${data.skipped}.`,
                                    icon: "success",
                                    confirmButtonText: "Aceptar",
                                    confirmButtonColor: "#28a745"
                                }).then(() => {
                                    // Cerrar modal
                                    closeModal(importUsersModal);

                                    // Recargar la página
                                    location.reload();
                                });
                            })
                            .catch(error => {
                                console.error("Error al importar usuarios:", error);
                                Swal.fire({
                                    title: "Error",
                                    text: "Error al importar usuarios: " + error.message,
                                    icon: "error",
                                    confirmButtonText: "Aceptar",
                                    confirmButtonColor: "#dc3545"
                                });
                            });
                    }
                );
            } else {
                Swal.fire({
                    title: "Atención",
                    text: "Por favor, seleccione un archivo CSV",
                    icon: "warning",
                    confirmButtonText: "Aceptar",
                    confirmButtonColor: "#ffc107"
                });
            }
        });
    }

    // Acciones de usuarios (Ver, Editar, Suspender, Restaurar)
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            // Mostrar indicador de carga
            Swal.fire({
                title: "Cargando",
                text: "Obteniendo detalles del usuario...",
                icon: "info",
                timer: 1500,
                showConfirmButton: false
            });
            window.location.href = `/Admin/users/${userId}`;
        });
    });

    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            // Mostrar indicador de carga
            Swal.fire({
                title: "Cargando",
                text: "Preparando formulario de edición...",
                icon: "info",
                timer: 1500,
                showConfirmButton: false
            });
            window.location.href = `/Admin/users/${userId}/edit`;
        });
    });

    banButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-userid');
            const userName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
            console.log("Suspender usuario:", userId);

            showConfirmation(
                "Confirmar suspensión",
                `¿Está seguro que desea suspender al usuario ${userName}?`,
                "warning",
                "Suspender",
                "Cancelar",
                function() {
                    // Mostrar indicador de carga
                    showLoading("Procesando", "Suspendiendo usuario...");

                    // Llamada al servidor para suspender usuario
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
                            console.log("Usuario suspendido:", data);
                            Swal.fire({
                                title: "Completado",
                                text: `Usuario ${userName} suspendido correctamente`,
                                icon: "success",
                                confirmButtonText: "Aceptar",
                                confirmButtonColor: "#28a745"
                            });

                            // Actualizar estado en la interfaz
                            const row = button.closest('tr');
                            const statusCell = row.querySelector('td:nth-child(6)');
                            statusCell.innerHTML = '<span class="badge badge-danger">Suspendido</span>';

                            // Cambiar botón de suspender por restaurar
                            button.innerHTML = '<i class="fas fa-undo"></i>';
                            button.title = 'Restaurar';
                            button.classList.remove('ban-btn');
                            button.classList.add('restore-btn');

                            // Cambiar el listener
                            button.removeEventListener('click', arguments.callee);
                            addRestoreListener(button);
                        })
                        .catch(error => {
                            console.error("Error al suspender usuario:", error);
                            Swal.fire({
                                title: "Error",
                                text: "Error al suspender usuario: " + error.message,
                                icon: "error",
                                confirmButtonText: "Aceptar",
                                confirmButtonColor: "#dc3545"
                            });
                        });
                }
            );
        });
    });

    function addRestoreListener(button) {
        button.addEventListener('click', function restoreHandler() {
            const userId = this.getAttribute('data-userid');
            const userName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
            console.log("Restaurar usuario:", userId);

            showConfirmation(
                "Confirmar restauración",
                `¿Está seguro que desea restaurar al usuario ${userName}?`,
                "question",
                "Restaurar",
                "Cancelar",
                function() {
                    // Mostrar indicador de carga
                    showLoading("Procesando", "Restaurando usuario...");

                    // Llamada al servidor para restaurar usuario
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
                            console.log("Usuario restaurado:", data);
                            Swal.fire({
                                title: "Completado",
                                text: `Usuario ${userName} restaurado correctamente`,
                                icon: "success",
                                confirmButtonText: "Aceptar",
                                confirmButtonColor: "#28a745"
                            });

                            // Actualizar estado en la interfaz
                            const row = button.closest('tr');
                            const statusCell = row.querySelector('td:nth-child(6)');
                            statusCell.innerHTML = '<span class="badge badge-active">Activo</span>';

                            // Cambiar botón de restaurar por suspender
                            button.innerHTML = '<i class="fas fa-ban"></i>';
                            button.title = 'Suspender';
                            button.classList.remove('restore-btn');
                            button.classList.add('ban-btn');

                            // Cambiar el listener
                            button.removeEventListener('click', restoreHandler);

                            // Agregar listener para suspender
                            button.addEventListener('click', function() {
                                const userId = this.getAttribute('data-userid');
                                const userName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
                                console.log("Suspender usuario:", userId);

                                showConfirmation(
                                    "Confirmar suspensión",
                                    `¿Está seguro que desea suspender al usuario ${userName}?`,
                                    "warning",
                                    "Suspender",
                                    "Cancelar",
                                    function() {
                                        // Mostrar indicador de carga
                                        showLoading("Procesando", "Suspendiendo usuario...");

                                        // Llamada al servidor para suspender usuario
                                        fetch(`/Admin/api/users/${userId}/ban`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            }
                                        })
                                            .then(response => {
                                                if (!response.ok) {
                                                    throw new Error('Error: ' + response.status);
                                                }
                                                return response.json();
                                            })
                                            .then(data => {
                                                Swal.fire({
                                                    title: "Completado",
                                                    text: `Usuario ${userName} suspendido correctamente`,
                                                    icon: "success",
                                                    confirmButtonText: "Aceptar",
                                                    confirmButtonColor: "#28a745"
                                                });

                                                // Actualizar UI
                                                const row = button.closest('tr');
                                                const statusCell = row.querySelector('td:nth-child(6)');
                                                statusCell.innerHTML = '<span class="badge badge-danger">Suspendido</span>';

                                                // Cambiar botón
                                                button.innerHTML = '<i class="fas fa-undo"></i>';
                                                button.title = 'Restaurar';
                                                button.classList.remove('ban-btn');
                                                button.classList.add('restore-btn');

                                                // Cambiar listener
                                                button.removeEventListener('click', arguments.callee);
                                                addRestoreListener(button);
                                            })
                                            .catch(error => {
                                                Swal.fire({
                                                    title: "Error",
                                                    text: "Error: " + error.message,
                                                    icon: "error",
                                                    confirmButtonText: "Aceptar",
                                                    confirmButtonColor: "#dc3545"
                                                });
                                            });
                                    }
                                );
                            });
                        })
                        .catch(error => {
                            console.error("Error al restaurar usuario:", error);
                            Swal.fire({
                                title: "Error",
                                text: "Error al restaurar usuario: " + error.message,
                                icon: "error",
                                confirmButtonText: "Aceptar",
                                confirmButtonColor: "#dc3545"
                            });
                        });
                }
            );
        });
    }
    // Añadir listener a los botones de restaurar existentes
    restoreButtons.forEach(button => {
        addRestoreListener(button);
    });

    document.addEventListener('DOMContentLoaded', applySweetAlertStyles);

});

