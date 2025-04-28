document.addEventListener('DOMContentLoaded', function () {
    // Inicializar DataTable
    const imagesTable = $('#imagesTable').DataTable({
        language: {
            url: '/js/es-ES.json'
        },
        ajax: {
            url: '/api/admin/images',
            dataSrc: ''
        },
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'os' },
            { data: 'version' },
            { data: 'type' },
            { data: 'size' },
            {
                data: 'state',
                render: function(data) {
                    if (data === 'public') {
                        return '<span class="badge bg-success">Pública</span>';
                    } else {
                        return '<span class="badge bg-secondary">Privada</span>';
                    }
                }
            },
            {
                data: null,
                orderable: false,
                render: function (data) {
                    return `
                        <div class="action-buttons">
                            <button class="btn-icon btn-edit" data-id="${data.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" data-id="${data.id}" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        responsive: true,
        dom: 'Bfrtip',
        buttons: [
            {
                text: '<i class="fas fa-download"></i> Exportar',
                className: 'btn btn-outline-secondary',
                action: function () {
                    exportImages();
                }
            }
        ]
    });

    // Mostrar modal para crear imagen
    $('#btnCreateImage').on('click', function() {
        $('#createImageModal').addClass('show');
    });

    // Cerrar modal
    $('.modal-close, #cancelImage').on('click', function() {
        $('#createImageModal').removeClass('show');
        resetImageForm();
    });

    // Cambio en el select de sistema operativo
    $('#imageOS').on('change', function() {
        if ($(this).val() === 'other') {
            $('#otherOSGroup').show();
            $('#otherOS').prop('required', true);
        } else {
            $('#otherOSGroup').hide();
            $('#otherOS').prop('required', false);
        }
    });

    // Guardar imagen
    $('#saveImage').on('click', function() {
        if (validateImageForm()) {
            saveImage();
        }
    });

    // Editar imagen
    $('#imagesTable').on('click', '.btn-edit', function() {
        const imageId = $(this).data('id');
        loadImageDetails(imageId);
    });

    // Eliminar imagen
    $('#imagesTable').on('click', '.btn-delete', function() {
        const imageId = $(this).data('id');
        confirmDeleteImage(imageId);
    });

    // Importar imágenes
    $('#btnImportImages').on('click', function() {
        $('#importImagesModal').addClass('show');
    });

    // Eventos para la importación
    $('#uploadDropzone, #fileInput').on('click', function(e) {
        if (e.target === this || $(e.target).is('span') || $(e.target).is('p') || $(e.target).is('i')) {
            $('#fileInput').click();
        }
    });

    $('#fileInput').on('change', function() {
        handleFileSelect(this.files[0]);
    });

    $('#uploadDropzone').on('dragover', function(e) {
        e.preventDefault();
        $(this).addClass('dragover');
    });

    $('#uploadDropzone').on('dragleave', function() {
        $(this).removeClass('dragover');
    });

    $('#uploadDropzone').on('drop', function(e) {
        e.preventDefault();
        $(this).removeClass('dragover');
        const file = e.originalEvent.dataTransfer.files[0];
        handleFileSelect(file);
    });

    $('#removeFile').on('click', function() {
        $('#fileInput').val('');
        $('#fileInfo').hide();
        $('#uploadDropzone').show();
    });

    $('#downloadTemplate').on('click', function(e) {
        e.preventDefault();
        downloadCSVTemplate();
    });

    $('#cancelImport, .modal-close').on('click', function() {
        $('#importImagesModal').removeClass('show');
        resetImportForm();
    });

    $('#processImport').on('click', function() {
        if ($('#fileInput')[0].files.length > 0) {
            importImages();
        } else {
            showAlert('Por favor, seleccione un archivo CSV para importar.', 'warning');
        }
    });

    // Funciones auxiliares
    function validateImageForm() {
        const form = document.getElementById('imageForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        // Validación personalizada
        if ($('#imageOS').val() === 'other' && $('#otherOS').val().trim() === '') {
            showAlert('Por favor, especifique el sistema operativo', 'warning');
            return false;
        }

        return true;
    }

    function saveImage() {
        const imageData = {
            name: $('#imageName').val(),
            os: $('#imageOS').val() === 'other' ? $('#otherOS').val() : $('#imageOS').val(),
            version: $('#imageVersion').val(),
            type: $('#imageType').val(),
            size: parseInt($('#imageSize').val()),
            state: $('#imageState').val(),
            description: $('#imageDescription').val()
        };

        // Si hay un archivo seleccionado, procesar con FormData
        const imageFile = $('#imageFile')[0].files[0];
        let apiCall;

        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('imageData', JSON.stringify(imageData));

            apiCall = fetch('/api/admin/images/upload', {
                method: 'POST',
                body: formData
            });
        } else {
            apiCall = fetch('/api/admin/images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(imageData)
            });
        }

        apiCall
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al guardar la imagen');
                }
                return response.json();
            })
            .then(data => {
                showAlert('Imagen creada correctamente', 'success');
                $('#createImageModal').removeClass('show');
                resetImageForm();
                imagesTable.ajax.reload();
            })
            .catch(error => {
                showAlert(error.message, 'error');
            });
    }

    function loadImageDetails(imageId) {
        fetch(`/api/admin/images/${imageId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar los detalles de la imagen');
                }
                return response.json();
            })
            .then(image => {
                // Rellenar el formulario con los datos de la imagen
                $('#imageName').val(image.name);

                if (['ubuntu', 'centos', 'debian', 'fedora', 'windows'].includes(image.os.toLowerCase())) {
                    $('#imageOS').val(image.os.toLowerCase());
                    $('#otherOSGroup').hide();
                } else {
                    $('#imageOS').val('other');
                    $('#otherOS').val(image.os);
                    $('#otherOSGroup').show();
                }

                $('#imageVersion').val(image.version);
                $('#imageType').val(image.type);
                $('#imageSize').val(image.size);
                $('#imageState').val(image.state);
                $('#imageDescription').val(image.description);

                // Configurar el formulario para la actualización
                $('#imageForm').data('id', image.id);
                $('.modal-title').text('Editar Imagen');
                $('#saveImage').text('Actualizar');

                // Mostrar el modal
                $('#createImageModal').addClass('show');
            })
            .catch(error => {
                showAlert(error.message, 'error');
            });
    }

    function confirmDeleteImage(imageId) {
        Swal.fire({
            title: '¿Está seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteImage(imageId);
            }
        });
    }

    function deleteImage(imageId) {
        fetch(`/api/admin/images/${imageId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al eliminar la imagen');
                }
                return response.json();
            })
            .then(data => {
                showAlert('Imagen eliminada correctamente', 'success');
                imagesTable.ajax.reload();
            })
            .catch(error => {
                showAlert(error.message, 'error');
            });
    }

    function resetImageForm() {
        $('#imageForm')[0].reset();
        $('#otherOSGroup').hide();
        $('#imageForm').removeData('id');
        $('.modal-title').text('Crear Nueva Imagen');
        $('#saveImage').text('Guardar');
    }

    function handleFileSelect(file) {
        if (file) {
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                showAlert('Por favor, seleccione un archivo CSV válido', 'warning');
                return;
            }

            $('#uploadDropzone').hide();
            $('#fileName').text(file.name);
            $('#fileSize').text(formatFileSize(file.size));
            $('#fileInfo').show();
        }
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / 1048576).toFixed(2) + ' MB';
    }

    function downloadCSVTemplate() {
        // Contenido CSV de ejemplo
        const csvContent = 'name,os,version,type,size,state,description\n' +
            'Ubuntu 22.04,ubuntu,22.04,base,10,public,"Ubuntu LTS Server"\n' +
            'CentOS 8,centos,8,base,15,private,"CentOS 8 Server"';

        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'template_imagenes.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function importImages() {
        const file = $('#fileInput')[0].files[0];
        const skipDuplicates = $('#skipDuplicates').is(':checked');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('skipDuplicates', skipDuplicates);

        fetch('/api/admin/images/import', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al importar imágenes');
                }
                return response.json();
            })
            .then(data => {
                $('#importImagesModal').removeClass('show');
                resetImportForm();
                showAlert(`Importación completada: ${data.imported} imágenes importadas, ${data.skipped} omitidas`, 'success');
                imagesTable.ajax.reload();
            })
            .catch(error => {
                showAlert(error.message, 'error');
            });
    }

    function resetImportForm() {
        $('#fileInput').val('');
        $('#fileInfo').hide();
        $('#uploadDropzone').show();
        $('#skipDuplicates').prop('checked', true);
    }

    function exportImages() {
        fetch('/api/admin/images/export')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al exportar imágenes');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'imagenes_export.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(error => {
                showAlert(error.message, 'error');
            });
    }

    function showAlert(message, type) {
        const alertContainer = $('#alertContainer');
        const alertMessage = $('#alertMessage');

        alertMessage.text(message);
        alertMessage.removeClass('alert-success alert-danger alert-warning');

        switch (type) {
            case 'success':
                alertMessage.addClass('alert-success');
                break;
            case 'error':
                alertMessage.addClass('alert-danger');
                break;
            case 'warning':
                alertMessage.addClass('alert-warning');
                break;
        }

        alertContainer.show();

        setTimeout(() => {
            alertContainer.fadeOut();
        }, 5000);
    }
});