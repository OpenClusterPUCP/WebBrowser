/**
 * PUCP Private Cloud Orchestrator
 * JavaScript para la gestión del perfil de administrador
 */

$(document).ready(function() {
    // Referencias a elementos DOM
    const editProfileBtn = $('#btnEditProfile');
    const changePasswordBtn = $('#btnChangePassword');
    const changePasswordAltBtn = $('#btnChangePasswordAlt');
    const editProfileModal = $('#editProfileModal');
    const changePasswordModal = $('#changePasswordModal');
    const modalCloseButtons = $('.modal-close');
    const alertContainer = $('#alertContainer');
    const alertMessage = $('#alertMessage');

    // Botones de formulario
    const saveProfileEditBtn = $('#saveProfileEdit');
    const cancelProfileEditBtn = $('#cancelProfileEdit');
    const savePasswordChangeBtn = $('#savePasswordChange');
    const cancelPasswordChangeBtn = $('#cancelPasswordChange');

    // Referencias a campos de contraseña
    const passwordToggleBtns = $('.password-toggle');
    const newPasswordInput = $('#newPassword');
    const confirmPasswordInput = $('#confirmPassword');
    const passwordStrength = $('#passwordStrength');
    const passwordStrengthText = $('#passwordStrengthText');
    const passwordMatch = $('#passwordMatch');

    // Referencias a indicadores de requisitos de contraseña
    const reqLength = $('#req-length');
    const reqUppercase = $('#req-uppercase');
    const reqLowercase = $('#req-lowercase');
    const reqNumber = $('#req-number');
    const reqSpecial = $('#req-special');

    /**
     * Manejadores de eventos para abrir/cerrar modales
     */
    // Abrir modal de edición de perfil
    editProfileBtn.click(function() {
        editProfileModal.css('display', 'block');
    });

    // Abrir modal de cambio de contraseña (desde 2 botones diferentes)
    changePasswordBtn.click(function() {
        changePasswordModal.css('display', 'block');
    });

    changePasswordAltBtn.click(function() {
        changePasswordModal.css('display', 'block');
    });

    // Cerrar modales con el botón X
    modalCloseButtons.click(function() {
        editProfileModal.css('display', 'none');
        changePasswordModal.css('display', 'none');
    });

    // Cerrar modales con los botones de cancelar
    cancelProfileEditBtn.click(function() {
        editProfileModal.css('display', 'none');
    });

    cancelPasswordChangeBtn.click(function() {
        changePasswordModal.css('display', 'none');
    });

    // Cerrar modales al hacer clic fuera de ellos
    $(window).click(function(event) {
        if (event.target == editProfileModal[0]) {
            editProfileModal.css('display', 'none');
        }
        if (event.target == changePasswordModal[0]) {
            changePasswordModal.css('display', 'none');
        }
    });

    /**
     * Funcionalidad para mostrar/ocultar contraseña
     */
    passwordToggleBtns.click(function() {
        const targetId = $(this).data('target');
        const targetInput = $(`#${targetId}`);
        const icon = $(this).find('i');

        if (targetInput.attr('type') === 'password') {
            targetInput.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            targetInput.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    /**
     * Validación de contraseña
     */
    function validatePassword(password) {
        // Criterios de validación
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        // Actualizar indicadores de requisitos
        updateRequirement(reqLength, hasLength);
        updateRequirement(reqUppercase, hasUppercase);
        updateRequirement(reqLowercase, hasLowercase);
        updateRequirement(reqNumber, hasNumber);
        updateRequirement(reqSpecial, hasSpecial);

        // Calcular fuerza de contraseña (0-100)
        let strength = 0;
        if (hasLength) strength += 20;
        if (hasUppercase) strength += 20;
        if (hasLowercase) strength += 20;
        if (hasNumber) strength += 20;
        if (hasSpecial) strength += 20;

        // Actualizar medidor de fuerza
        passwordStrength.css('width', `${strength}%`);

        // Actualizar color basado en la fuerza
        if (strength < 40) {
            passwordStrength.css('background-color', '#dc3545'); // Rojo
            passwordStrengthText.text('Débil');
        } else if (strength < 80) {
            passwordStrength.css('background-color', '#ffc107'); // Amarillo
            passwordStrengthText.text('Regular');
        } else {
            passwordStrength.css('background-color', '#28a745'); // Verde
            passwordStrengthText.text('Fuerte');
        }

        return strength >= 60; // Contraseña válida si cumple al menos 3 de 5 criterios
    }

    function updateRequirement(element, isValid) {
        if (isValid) {
            element.find('i').removeClass('fa-times-circle').addClass('fa-check-circle text-success');
        } else {
            element.find('i').removeClass('fa-check-circle text-success').addClass('fa-times-circle');
        }
    }

    // Validar coincidencia de contraseñas
    function validatePasswordMatch() {
        const password = newPasswordInput.val();
        const confirmPassword = confirmPasswordInput.val();

        if (confirmPassword === '') {
            passwordMatch.html('');
            return false;
        }

        if (password === confirmPassword) {
            passwordMatch.html('<i class="fas fa-check-circle text-success"></i> Las contraseñas coinciden');
            return true;
        } else {
            passwordMatch.html('<i class="fas fa-times-circle text-danger"></i> Las contraseñas no coinciden');
            return false;
        }
    }

    // Eventos de validación en tiempo real
    newPasswordInput.on('input', function() {
        validatePassword($(this).val());
        if (confirmPasswordInput.val() !== '') {
            validatePasswordMatch();
        }
    });

    confirmPasswordInput.on('input', validatePasswordMatch);

    /**
     * Envío de formulario de edición de perfil
     */
    saveProfileEditBtn.click(function() {
        // Validar el formulario
        const profileForm = $('#profileForm')[0];
        if (!profileForm.checkValidity()) {
            profileForm.reportValidity();
            return;
        }

        // Recopilar datos del formulario
        const profileData = {
            id: $('#profileForm').data('user-id'), // Asegúrate de que este atributo exista en el formulario
            name: $('#profileName').val(),
            lastname: $('#profileLastName').val(),
            username: $('#profileUsername').val(),
            code: $('#profileCode').val()
        };

        // Si no se encontró el ID en el atributo data, intentar obtenerlo del input oculto
        if (!profileData.id) {
            const hiddenIdInput = $('#profileIdHidden');
            if (hiddenIdInput.length) {
                profileData.id = hiddenIdInput.val();
            }
        }

        // Mostrar indicador de carga
        saveProfileEditBtn.html('<i class="fas fa-spinner fa-spin"></i> Guardando...');
        saveProfileEditBtn.prop('disabled', true);

        // Enviar solicitud AJAX
        $.ajax({
            url: '/Admin/api/user/profile/update',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(profileData),
            success: function(response) {
                // Cerrar modal
                editProfileModal.css('display', 'none');

                // Mostrar mensaje de éxito con SweetAlert2
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Perfil actualizado correctamente. La página se recargará para mostrar los cambios.',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#4361ee'
                }).then(() => {
                    // Recargar la página después para mostrar los cambios
                    location.reload();
                });
            },
            error: function(xhr, status, error) {
                // Mostrar mensaje de error con SweetAlert2
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo actualizar el perfil: ' + (xhr.responseJSON?.message || error),
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#4361ee'
                });
            },
            complete: function() {
                // Restaurar el botón
                saveProfileEditBtn.html('Guardar Cambios');
                saveProfileEditBtn.prop('disabled', false);
            }
        });
    });

    /**
     * Envío de formulario de cambio de contraseña
     */
    savePasswordChangeBtn.click(function() {
        // Validar el formulario
        const passwordForm = $('#passwordForm')[0];
        if (!passwordForm.checkValidity()) {
            passwordForm.reportValidity();
            return;
        }

        // Validaciones adicionales
        const currentPassword = $('#currentPassword').val();
        const newPassword = newPasswordInput.val();
        const confirmPassword = confirmPasswordInput.val();

        if (!validatePassword(newPassword)) {
            Swal.fire({
                title: 'Contraseña débil',
                text: 'La contraseña no cumple con los requisitos mínimos de seguridad',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#4361ee'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Swal.fire({
                title: 'Error de validación',
                text: 'Las contraseñas no coinciden',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#4361ee'
            });
            return;
        }

        // Mostrar indicador de carga
        savePasswordChangeBtn.html('<i class="fas fa-spinner fa-spin"></i> Guardando...');
        savePasswordChangeBtn.prop('disabled', true);

        // Enviar solicitud AJAX
        $.ajax({
            url: '/Admin/api/user/password/change',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            }),
            success: function(response) {
                // Cerrar modal
                changePasswordModal.css('display', 'none');

                // Limpiar el formulario
                $('#passwordForm')[0].reset();

                // Mostrar mensaje de éxito con SweetAlert2
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Contraseña actualizada correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#4361ee'
                });
            },
            error: function(xhr, status, error) {
                // Mensaje de error específico según el código de respuesta
                let errorMessage = 'Error al cambiar la contraseña';

                if (xhr.status === 401) {
                    errorMessage = 'La contraseña actual es incorrecta';
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }

                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#4361ee'
                });
            },
            complete: function() {
                // Restaurar el botón
                savePasswordChangeBtn.html('Cambiar Contraseña');
                savePasswordChangeBtn.prop('disabled', false);
            }
        });
    });

    /**
     * Función para mostrar alertas en la interfaz
     */
    function showAlert(type, message) {
        alertMessage.removeClass().addClass('alert alert-' + type);
        alertMessage.html(message);
        alertContainer.show();

        // Auto-ocultar la alerta después de 5 segundos
        setTimeout(function() {
            alertContainer.fadeOut();
        }, 5000);
    }

    // Inicialización - ocultar contenedores de alerta
    alertContainer.hide();
});