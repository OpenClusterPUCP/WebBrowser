// Script para la vista de detalle de zona
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de la interfaz
    initSidebar();
    initUserDropdown();
    updateLastRefreshTime();
    initCharts();
    setupEventListeners();

    // Simular actualización inicial de datos
    fetchZoneData();
});

// Función para inicializar la barra lateral
function initSidebar() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuToggle = document.querySelector('.menu-toggle');
    const appContainer = document.querySelector('.app-container');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            appContainer.classList.toggle('sidebar-collapsed');
        });
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            appContainer.classList.toggle('sidebar-mobile-open');
        });
    }
}

// Función para el dropdown de usuario
function initUserDropdown() {
    const userProfile = document.querySelector('.user-profile');

    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            userProfile.classList.toggle('dropdown-open');
            e.stopPropagation();
        });

        document.addEventListener('click', function() {
            userProfile.classList.remove('dropdown-open');
        });
    }
}

// Función para actualizar la hora de último refresco
function updateLastRefreshTime() {
    const lastUpdateElement = document.getElementById('lastUpdateTime');
    if (lastUpdateElement) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        lastUpdateElement.textContent = `Última actualización: ${hours}:${minutes}`;
    }
}

// Inicializar gráficos de uso de recursos
function initCharts() {
    // Inicializar gráficos de uso de CPU
    const cpuCtx = document.getElementById('cpuUsageChart');
    if (cpuCtx) {
        new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Capacidad física',
                        data: [48, 48, 48, 48, 48, 48, 48],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Asignado',
                        data: [75, 78, 82, 79, 84, 80, 80],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Uso real',
                        data: [20, 18, 23, 25, 19, 15, 21],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'vCPUs'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Inicializar gráficos de uso de RAM
    const ramCtx = document.getElementById('ramUsageChart');
    if (ramCtx) {
        new Chart(ramCtx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Capacidad física',
                        data: [128, 128, 128, 128, 128, 128, 128],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Asignado',
                        data: [160, 168, 172, 165, 175, 170, 172],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Uso real',
                        data: [55, 58, 65, 62, 70, 60, 64],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'GB RAM'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Inicializar gráficos de uso de almacenamiento
    const storageCtx = document.getElementById('storageUsageChart');
    if (storageCtx) {
        new Chart(storageCtx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Capacidad física',
                        data: [1500, 1500, 1500, 1500, 1500, 1500, 1500],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Asignado',
                        data: [2000, 2050, 2100, 2080, 2120, 2110, 2100],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Uso real',
                        data: [520, 540, 560, 570, 580, 570, 580],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'GB Almacenamiento'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Inicializar gráficos de recursos de servidor en modal
    initServerModalCharts();
}

// Inicializar gráficos de recursos en modal de servidor
function initServerModalCharts() {
    // Función para crear gráfico tipo dona
    function createDonutChart(ctx, used, total, label, color) {
        const usedPercent = (used / total) * 100;
        const remaining = 100 - usedPercent;

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [label, 'Disponible'],
                datasets: [{
                    data: [usedPercent, remaining],
                    backgroundColor: [color, '#f1f5f9'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.raw.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Referencias a los canvas (se inicializarán cuando se abra el modal)
    let cpuChart, ramChart, storageChart;

    // Modal de servidor
    const serverModal = document.getElementById('serverDetailsModal');
    if (serverModal) {
        const modal = new bootstrap.Modal(serverModal);

        // Inicializar gráficos cuando se abre el modal
        serverModal.addEventListener('shown.bs.modal', function() {
            const serverCpuCanvas = document.getElementById('serverCpuChart');
            const serverRamCanvas = document.getElementById('serverRamChart');
            const serverStorageCanvas = document.getElementById('serverStorageChart');

            if (serverCpuCanvas) {
                cpuChart = createDonutChart(serverCpuCanvas, 12, 16, 'CPU', 'rgba(54, 162, 235, 0.8)');
            }

            if (serverRamCanvas) {
                ramChart = createDonutChart(serverRamCanvas, 24, 32, 'RAM', 'rgba(75, 192, 192, 0.8)');
            }

            if (serverStorageCanvas) {
                storageChart = createDonutChart(serverStorageCanvas, 320, 500, 'Almacenamiento', 'rgba(255, 99, 132, 0.8)');
            }
        });

        // Destruir gráficos cuando se cierra el modal para evitar conflictos
        serverModal.addEventListener('hidden.bs.modal', function() {
            if (cpuChart) cpuChart.destroy();
            if (ramChart) ramChart.destroy();
            if (storageChart) storageChart.destroy();
        });
    }
}

// Configurar todos los event listeners
function setupEventListeners() {
    // Botón de refrescar
    const refreshBtn = document.getElementById('btnRefreshZoneData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            fetchZoneData();
            updateLastRefreshTime();
        });
    }

    // Selector de rango de tiempo para gráficos
    const timeRangeSelect = document.getElementById('resourceTimeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', function() {
            updateResourceCharts(this.value);
        });
    }

    // Búsqueda de servidores
    const serverSearchInput = document.getElementById('serverSearchInput');
    if (serverSearchInput) {
        serverSearchInput.addEventListener('keyup', function() {
            filterTable('serversTable', this.value);
        });
    }

    // Búsqueda de slices
    const sliceSearchInput = document.getElementById('sliceSearchInput');
    if (sliceSearchInput) {
        sliceSearchInput.addEventListener('keyup', function() {
            filterTable('slicesTable', this.value);
        });
    }
}

// Función para filtrar tablas
function filterTable(tableId, query) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const lowercaseQuery = query.toLowerCase();

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(lowercaseQuery)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Actualizar gráficos de recursos según el rango de tiempo
function updateResourceCharts(timeRange) {
    // Simulación de datos para diferentes rangos de tiempo
    // En una implementación real, aquí se cargarían datos del servidor
    console.log(`Actualizando gráficos para rango: ${timeRange}`);

    // Aquí iría la lógica para actualizar los gráficos con datos reales
}

// Mostrar detalles del servidor en modal
function showServerDetails(serverId) {
    console.log(`Mostrando detalles del servidor ID: ${serverId}`);

    // En una implementación real, se cargarían los datos del servidor desde la API
    // Para esta demo, usamos datos estáticos
    let serverData;

    switch(serverId) {
        case 1:
            serverData = {
                hostname: 'server-a1',
                ip: '10.20.12.215',
                status: 'Online',
                infraType: 'Linux',
                vmCount: 4,
                sshPort: '5801',
                sshUser: 'ubuntu',
                cpuTotal: 16,
                cpuUsed: 12,
                cpuActual: 8,
                ramTotal: 32,
                ramUsed: 24,
                ramActual: 16,
                storageTotal: 500,
                storageUsed: 320,
                storageActual: 210
            };
            break;
        case 2:
            serverData = {
                hostname: 'server-a2',
                ip: '10.20.12.216',
                status: 'Online',
                infraType: 'Linux',
                vmCount: 4,
                sshPort: '5802',
                sshUser: 'ubuntu',
                cpuTotal: 16,
                cpuUsed: 10,
                cpuActual: 7,
                ramTotal: 32,
                ramUsed: 20,
                ramActual: 14,
                storageTotal: 500,
                storageUsed: 280,
                storageActual: 190
            };
            break;
        case 3:
            serverData = {
                hostname: 'server-a3',
                ip: '10.20.12.217',
                status: 'Online',
                infraType: 'Linux',
                vmCount: 4,
                sshPort: '5803',
                sshUser: 'ubuntu',
                cpuTotal: 16,
                cpuUsed: 10,
                cpuActual: 6,
                ramTotal: 32,
                ramUsed: 24,
                ramActual: 18,
                storageTotal: 500,
                storageUsed: 200,
                storageActual: 180
            };
            break;
        default:
            serverData = {
                hostname: 'server-unknown',
                ip: '0.0.0.0',
                status: 'Unknown',
                infraType: 'Unknown',
                vmCount: 0,
                sshPort: '22',
                sshUser: 'ubuntu',
                cpuTotal: 0,
                cpuUsed: 0,
                cpuActual: 0,
                ramTotal: 0,
                ramUsed: 0,
                ramActual: 0,
                storageTotal: 0,
                storageUsed: 0,
                storageActual: 0
            };
    }

    // Actualizar los datos en el modal
    updateServerModal(serverData);

    // Mostrar el modal
    const serverModal = new bootstrap.Modal(document.getElementById('serverDetailsModal'));
    serverModal.show();
}

// Actualizar datos en el modal de servidor
function updateServerModal(serverData) {
    // Actualizar texto en el modal
    document.getElementById('serverHostname').textContent = serverData.hostname;
    document.getElementById('serverIp').textContent = serverData.ip;
    document.getElementById('serverStatus').textContent = serverData.status;
    document.getElementById('serverInfraType').textContent = serverData.infraType;
    document.getElementById('serverVMCount').textContent = serverData.vmCount;
    document.getElementById('sshPort').textContent = serverData.sshPort;
    document.getElementById('sshUser').textContent = serverData.sshUser;

    // Actualizar comando SSH
    document.getElementById('sshCommand').value = `ssh ${serverData.sshUser}@${serverData.ip} -p ${serverData.sshPort}`;

    // Actualizar datos de recursos
    document.getElementById('serverCpuUsed').textContent = `${serverData.cpuUsed}/${serverData.cpuTotal} vCPU`;
    document.getElementById('serverCpuActual').textContent = `${serverData.cpuActual} vCPU`;
    document.getElementById('serverRamUsed').textContent = `${serverData.ramUsed}/${serverData.ramTotal} GB`;
    document.getElementById('serverRamActual').textContent = `${serverData.ramActual} GB`;
    document.getElementById('serverStorageUsed').textContent = `${serverData.storageUsed}/${serverData.storageTotal} GB`;
    document.getElementById('serverStorageActual').textContent = `${serverData.storageActual} GB`;

    // Actualizar URL del botón de monitoreo
    const monitoringBtn = document.getElementById('btnViewServerMonitoring');
    if (monitoringBtn) {
        monitoringBtn.href = `/Admin/availability-zones/1/monitoring?server=${serverData.hostname}`;
    }
}

// Función para copiar comando SSH al portapapeles
function copySshCommand() {
    const sshCommand = document.getElementById('sshCommand');
    sshCommand.select();
    document.execCommand('copy');

    // Mostrar tooltip o notificación
    alert('Comando SSH copiado al portapapeles');
}

// Función para obtener datos de la zona (simulado)
function fetchZoneData() {
    // En una implementación real, aquí se realizaría una llamada AJAX
    // para obtener datos actualizados del servidor
    console.log('Obteniendo datos actualizados de la zona...');

    // Simular carga de datos
    showLoading(true);

    // Simular retardo de red
    setTimeout(function() {
        // Actualizar gráficos y métricas con nuevos datos
        // updateZoneDetails(data);

        // Ocultar indicador de carga
        showLoading(false);
    }, 1000);
}

// Mostrar/ocultar indicador de carga
function showLoading(show) {
    const refreshBtn = document.getElementById('btnRefreshZoneData');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        if (show) {
            icon.classList.add('fa-spin');
            refreshBtn.disabled = true;
        } else {
            icon.classList.remove('fa-spin');
            refreshBtn.disabled = false;
        }
    }
}

// Exponer funciones para uso global
window.showServerDetails = showServerDetails;
window.copySshCommand = copySshCommand;