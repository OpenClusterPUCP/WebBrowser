/**
 * Script para la gestión de métricas de colas
 * OpenCluster Admin Dashboard
 */

class QueueMetricsManager {
    constructor() {
        this.charts = {};
        this.dataTable = null;
        this.userOperationsTable = null;
        this.refreshInterval = null;
        this.currentQueueData = null;
        this.currentModalQueue = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupAutoRefresh();
        this.initializeDataTable();
    }

    setupEventListeners() {
        // Botón de actualizar
        $('#refreshBtn').on('click', () => {
            this.loadDashboardData();
        });

        // Filtros de tabla
        $('[data-filter]').on('click', (e) => {
            const filter = $(e.target).data('filter');
            this.applyTableFilter(filter);

            // Actualizar estado visual de botones
            $('[data-filter]').removeClass('active');
            $(e.target).addClass('active');
        });

        // Selector de tipo de gráfico
        $('input[name="chartType"]').on('change', (e) => {
            const chartType = e.target.value;
            this.updateChart(chartType);
        });

        // Filtro de estado en modal de operaciones de usuario
        $('#statusFilter').on('change', () => {
            if (this.userOperationsTable) {
                this.userOperationsTable.ajax.reload();
            }
        });

        // Actualizar detalles de cola en modal
        $('#refreshQueueDetails').on('click', () => {
            if (this.currentModalQueue) {
                this.loadQueueDetails(this.currentModalQueue);
            }
        });
    }

    setupAutoRefresh() {
        // Actualizar cada 30 segundos
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData(true); // true = silencioso, sin mostrar loading
        }, 30000);
    }

    async loadDashboardData(silent = false) {
        if (!silent) {
            this.showLoading();
        }

        try {
            const response = await fetch('/Admin/queue-metrics/api/dashboard');
            const data = await response.json();

            if (data.success) {
                this.currentQueueData = data;
                this.updateDashboardCards(data);
                this.updateChart('bar', data);
                this.updateQueuesTable(data.queues);
                this.updateLastRefreshTime();
            } else {
                this.showError('Error al cargar datos: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión al servidor');
        } finally {
            if (!silent) {
                this.hideLoading();
            }
        }
    }

    updateDashboardCards(data) {
        $('#totalQueues').text(data.totalQueues || 0);
        $('#totalPending').text(this.formatNumber(data.totalPending || 0));
        $('#totalInProgress').text(this.formatNumber(data.totalInProgress || 0));
        $('#totalCompleted').text(this.formatNumber(data.totalCompleted || 0));
        $('#totalFailed').text(this.formatNumber(data.totalFailed || 0));

        // Calcular tasa de éxito
        const total = (data.totalCompleted || 0) + (data.totalFailed || 0);
        const successRate = total > 0 ? ((data.totalCompleted / total) * 100).toFixed(1) : 0;
        $('#successRate').text(successRate + '%');

        // Actualizar tiempos promedio
        const avgWaitTime = data.averageWaitTime || 0;
        const avgProcessingTime = data.averageProcessingTime || 0;

        $('#avgWaitTime').text(avgWaitTime.toFixed(1) + ' seg');
        $('#avgProcessingTime').text(avgProcessingTime.toFixed(1) + ' seg');

        // Actualizar barras de progreso (máximo arbitrario de 60 segundos)
        const maxTime = 60;
        const waitTimePercent = Math.min((avgWaitTime / maxTime) * 100, 100);
        const processingTimePercent = Math.min((avgProcessingTime / maxTime) * 100, 100);

        $('#waitTimeProgress').css('width', waitTimePercent + '%');
        $('#processingTimeProgress').css('width', processingTimePercent + '%');

        // Animar contadores
        this.animateCounters();
    }

    updateChart(type, data = null) {
        const ctx = document.getElementById('operationsChart').getContext('2d');

        if (this.charts.operations) {
            this.charts.operations.destroy();
        }

        if (!data || !data.queues) {
            return;
        }

        const labels = data.queues.map(q => q.queueName);
        const pendingData = data.queues.map(q => q.pendingOperations || 0);
        const inProgressData = data.queues.map(q => q.inProgressOperations || 0);
        const completedData = data.queues.map(q => q.completedOperations || 0);
        const failedData = data.queues.map(q => q.failedOperations || 0);

        const config = {
            type: type,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pendientes',
                        data: pendingData,
                        backgroundColor: 'rgba(255, 193, 7, 0.7)',
                        borderColor: 'rgba(255, 193, 7, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'En Progreso',
                        data: inProgressData,
                        backgroundColor: 'rgba(13, 202, 240, 0.7)',
                        borderColor: 'rgba(13, 202, 240, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Completadas',
                        data: completedData,
                        backgroundColor: 'rgba(25, 135, 84, 0.7)',
                        borderColor: 'rgba(25, 135, 84, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Fallidas',
                        data: failedData,
                        backgroundColor: 'rgba(220, 53, 69, 0.7)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: type === 'pie' ? 'right' : 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: type === 'bar' ? {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Colas'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Número de Operaciones'
                        }
                    }
                } : {}
            }
        };

        this.charts.operations = new Chart(ctx, config);
    }

    initializeDataTable() {
        this.dataTable = $('#queuesTable').DataTable({
            responsive: true,
            pageLength: 10,
            order: [[0, 'asc']],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
            },
            columnDefs: [
                {
                    targets: [1, 2, 3, 4], // Columnas numéricas
                    className: 'text-end'
                },
                {
                    targets: [5, 6], // Columnas de tiempo
                    className: 'text-end',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(2) + ' seg' : '--';
                    }
                },
                {
                    targets: [7], // Fecha
                    render: function(data) {
                        return data ? new Date(data).toLocaleString('es-ES') : '--';
                    }
                }
            ]
        });
    }

    updateQueuesTable(queues) {
        if (!this.dataTable) return;

        this.dataTable.clear();

        queues.forEach(queue => {
            const row = [
                queue.queueName,
                queue.pendingOperations || 0,
                queue.inProgressOperations || 0,
                queue.completedOperations || 0,
                queue.failedOperations || 0,
                queue.averageWaitTimeSeconds || 0,
                queue.averageProcessingTimeSeconds || 0,
                queue.lastUpdated,
                this.createActionButtons(queue.queueName)
            ];
            this.dataTable.row.add(row);
        });

        this.dataTable.draw();
    }

    createActionButtons(queueName) {
        return `
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-outline-primary" 
                        onclick="queueMetrics.showQueueDetails('${queueName}')"
                        title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-info" 
                        onclick="queueMetrics.refreshQueue('${queueName}')"
                        title="Actualizar">
                    <i class="fas fa-refresh"></i>
                </button>
            </div>
        `;
    }

    applyTableFilter(filter) {
        if (!this.dataTable) return;

        switch (filter) {
            case 'all':
                this.dataTable.search('').draw();
                break;
            case 'pending':
                this.dataTable.columns(1).search('^[1-9]', true, false).draw();
                break;
            case 'failed':
                this.dataTable.columns(4).search('^[1-9]', true, false).draw();
                break;
        }
    }

    async showQueueDetails(queueName) {
        this.currentModalQueue = queueName;
        await this.loadQueueDetails(queueName);
        $('#queueDetailsModal').modal('show');
    }

    async loadQueueDetails(queueName) {
        try {
            const response = await fetch(`/Admin/queue-metrics/api/stats/queues/${queueName}`);
            const data = await response.json();

            if (data.success) {
                this.updateQueueDetailsModal(data.stats);
            } else {
                this.showError('Error al cargar detalles: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión al servidor');
        }
    }

    updateQueueDetailsModal(stats) {
        $('#modalQueueName').text(stats.queueName);
        $('#modalPending').text(stats.pendingOperations || 0);
        $('#modalInProgress').text(stats.inProgressOperations || 0);
        $('#modalCompleted').text(stats.completedOperations || 0);
        $('#modalFailed').text(stats.failedOperations || 0);

        const avgWait = stats.averageWaitTimeSeconds || 0;
        const avgProcessing = stats.averageProcessingTimeSeconds || 0;

        $('#modalAvgWaitTime').text(avgWait.toFixed(2) + ' seg');
        $('#modalAvgProcessingTime').text(avgProcessing.toFixed(2) + ' seg');

        // Actualizar barras de progreso en modal
        const maxTime = 60;
        const waitPercent = Math.min((avgWait / maxTime) * 100, 100);
        const processingPercent = Math.min((avgProcessing / maxTime) * 100, 100);

        $('#modalWaitTimeBar').css('width', waitPercent + '%');
        $('#modalProcessingTimeBar').css('width', processingPercent + '%');

        // Determinar estado de la cola
        let status = 'normal';
        let statusClass = 'badge-success';
        let statusText = 'Normal';

        if (stats.failedOperations > 0) {
            status = 'warning';
            statusClass = 'badge-danger';
            statusText = 'Con Errores';
        } else if (stats.pendingOperations > 10) {
            status = 'warning';
            statusClass = 'badge-warning';
            statusText = 'Alta Carga';
        }

        $('#modalQueueStatus').removeClass().addClass(`badge ${statusClass}`).text(statusText);
        $('#modalLastUpdated').text(new Date(stats.lastUpdated).toLocaleString('es-ES'));

        // Crear gráfico en modal
        this.createModalChart(stats);
    }

    createModalChart(stats) {
        const ctx = document.getElementById('modalChart').getContext('2d');

        if (this.charts.modal) {
            this.charts.modal.destroy();
        }

        const data = {
            labels: ['Pendientes', 'En Progreso', 'Completadas', 'Fallidas'],
            datasets: [{
                data: [
                    stats.pendingOperations || 0,
                    stats.inProgressOperations || 0,
                    stats.completedOperations || 0,
                    stats.failedOperations || 0
                ],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(13, 202, 240, 0.8)',
                    'rgba(25, 135, 84, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 193, 7, 1)',
                    'rgba(13, 202, 240, 1)',
                    'rgba(25, 135, 84, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        };

        this.charts.modal = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async refreshQueue(queueName) {
        try {
            // Simplemente recargamos los datos del dashboard
            await this.loadDashboardData();

            Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: `Cola ${queueName} actualizada correctamente`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al actualizar la cola');
        }
    }

    async showUserOperations(userId) {
        try {
            // Inicializar modal de operaciones de usuario
            $('#userOperationsModal').modal('show');

            // Si la tabla ya existe, destruirla
            if (this.userOperationsTable) {
                this.userOperationsTable.destroy();
            }

            // Crear nueva tabla con datos del usuario
            this.userOperationsTable = $('#userOperationsTable').DataTable({
                ajax: {
                    url: `/Admin/queue-metrics/api/user/${userId}/operations`,
                    data: function(d) {
                        const selectedStatuses = $('#statusFilter').val();
                        if (selectedStatuses && selectedStatuses.length > 0) {
                            d.statuses = selectedStatuses;
                        }
                    },
                    dataSrc: function(json) {
                        return json.success ? json.operations : [];
                    }
                },
                columns: [
                    { data: 'id' },
                    { data: 'operationType' },
                    { data: 'queueName' },
                    {
                        data: 'status',
                        render: function(data) {
                            const badgeClass = {
                                'PENDING': 'badge-warning',
                                'IN_PROGRESS': 'badge-info',
                                'COMPLETED': 'badge-success',
                                'FAILED': 'badge-danger',
                                'CANCELLED': 'badge-secondary'
                            };
                            return `<span class="badge ${badgeClass[data] || 'badge-secondary'}">${data}</span>`;
                        }
                    },
                    {
                        data: 'priority',
                        render: function(data) {
                            const badgeClass = {
                                'HIGH': 'badge-danger',
                                'MEDIUM': 'badge-warning',
                                'LOW': 'badge-success'
                            };
                            return `<span class="badge ${badgeClass[data] || 'badge-secondary'}">${data}</span>`;
                        }
                    },
                    {
                        data: 'enqueuedAt',
                        render: function(data) {
                            return data ? new Date(data).toLocaleString('es-ES') : '--';
                        }
                    },
                    {
                        data: 'processedAt',
                        render: function(data) {
                            return data ? new Date(data).toLocaleString('es-ES') : '--';
                        }
                    },
                    {
                        data: function(row) {
                            return `${row.retryCount || 0}/${row.maxRetries || 0}`;
                        }
                    },
                    {
                        data: function(row) {
                            const actions = [];

                            if (row.status === 'PENDING') {
                                actions.push(`
                                    <button class="btn btn-sm btn-outline-danger" 
                                            onclick="queueMetrics.cancelOperation(${row.id})"
                                            title="Cancelar">
                                        <i class="fas fa-times"></i>
                                    </button>
                                `);
                            }

                            actions.push(`
                                <button class="btn btn-sm btn-outline-info" 
                                        onclick="queueMetrics.showOperationDetails(${row.id})"
                                        title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                            `);

                            return actions.join(' ');
                        }
                    }
                ],
                responsive: true,
                pageLength: 10,
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
                }
            });
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al cargar operaciones del usuario');
        }
    }

    async cancelOperation(operationId) {
        const result = await Swal.fire({
            title: '¿Cancelar operación?',
            text: '¿Estás seguro de que deseas cancelar esta operación?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/Admin/queue-metrics/api/operations/${operationId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Operación cancelada',
                        text: 'La operación ha sido cancelada correctamente',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // Actualizar tabla de operaciones de usuario si está abierta
                    if (this.userOperationsTable) {
                        this.userOperationsTable.ajax.reload();
                    }

                    // Actualizar dashboard
                    this.loadDashboardData();
                } else {
                    this.showError('Error al cancelar operación: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                this.showError('Error de conexión al servidor');
            }
        }
    }

    async showOperationDetails(operationId) {
        try {
            const response = await fetch(`/Admin/queue-metrics/api/operations/${operationId}/status`);
            const data = await response.json();

            if (data.success) {
                // Mostrar detalles de la operación en un modal o expandir fila
                const operation = data.operation || data;

                Swal.fire({
                    title: `Operación ${operationId}`,
                    html: `
                        <div class="text-start">
                            <p><strong>Tipo:</strong> ${operation.operationType || '--'}</p>
                            <p><strong>Estado:</strong> ${operation.status || '--'}</p>
                            <p><strong>Cola:</strong> ${operation.queueName || '--'}</p>
                            <p><strong>Prioridad:</strong> ${operation.priority || '--'}</p>
                            <p><strong>Usuario:</strong> ${operation.userId || '--'}</p>
                            <p><strong>Reintentos:</strong> ${operation.retryCount || 0}/${operation.maxRetries || 0}</p>
                            ${operation.errorMessage ? `<p><strong>Error:</strong> ${operation.errorMessage}</p>` : ''}
                        </div>
                    `,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: '600px'
                });
            } else {
                this.showError('Error al cargar detalles: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión al servidor');
        }
    }

    // Métodos auxiliares
    formatNumber(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    }

    animateCounters() {
        $('.content-title, .card-body h3').each(function() {
            const $this = $(this);
            const countTo = parseInt($this.text().replace(/,/g, ''));

            if (isNaN(countTo)) return;

            $({ countNum: 0 }).animate({
                countNum: countTo
            }, {
                duration: 1000,
                easing: 'swing',
                step: function() {
                    $this.text(Math.floor(this.countNum).toLocaleString('es-ES'));
                },
                complete: function() {
                    $this.text(countTo.toLocaleString('es-ES'));
                }
            });
        });
    }

    updateLastRefreshTime() {
        const now = new Date();
        $('#lastRefresh').text(now.toLocaleTimeString('es-ES'));
    }

    showLoading() {
        $('#refreshBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');
    }

    hideLoading() {
        $('#refreshBtn').prop('disabled', false).html('<i class="fas fa-refresh"></i> <span class="d-none d-sm-inline">Actualizar</span>');
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonColor: '#d33'
        });
    }

    // Cleanup al salir de la página
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        if (this.dataTable) {
            this.dataTable.destroy();
        }

        if (this.userOperationsTable) {
            this.userOperationsTable.destroy();
        }
    }
}

// Inicializar cuando el documento esté listo
$(document).ready(function() {
    window.queueMetrics = new QueueMetricsManager();
});

// Cleanup al salir de la página
$(window).on('beforeunload', function() {
    if (window.queueMetrics) {
        window.queueMetrics.destroy();
    }
});