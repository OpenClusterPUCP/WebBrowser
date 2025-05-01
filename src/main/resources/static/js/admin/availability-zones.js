// Script para la gestión de zonas de disponibilidad
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de la interfaz
    initSidebar();
    initUserDropdown();
    updateLastRefreshTime();
    initCharts();
    initZoneModals();
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

// Configurar todos los event listeners
function setupEventListeners() {
    // Botón de refrescar
    const refreshBtn = document.getElementById('btnRefreshZones');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            fetchZoneData();
            updateLastRefreshTime();
        });
    }

    // Selector de rango de tiempo para gráficos de sobreaprovisionamiento
    const timeRangeSelect = document.getElementById('overProvisionTimeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', function() {
            updateOverprovisionCharts(this.value);
        });
    }

    // Botones de detalles en tarjetas de zona
    const detailBtns = document.querySelectorAll('.details-btn, .btn-icon[data-zone-id]');
    detailBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const zoneId = this.getAttribute('data-zone-id');
            openZoneDetails(zoneId);
        });
    });

    // Botón de monitoreo detallado en modal
    const monitoringBtn = document.getElementById('btnViewDetailedMonitoring');
    if (monitoringBtn) {
        monitoringBtn.addEventListener('click', function() {
            // Aquí iría la navegación a la página de monitoreo detallado
            window.location.href = '/Admin/monitoring/detailed';
        });
    }
}

// Inicializar gráficos
function initCharts() {
    initOverprovisionCharts();
}

// Inicializar gráficos de sobreaprovisionamiento
function initOverprovisionCharts() {
    // Configuración común para todos los gráficos de sobreaprovisionamiento
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return value + ':1';
                    }
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    // Datos para el gráfico de CPU
    const cpuChartCtx = document.getElementById('cpuOverprovisionChart');
    if (cpuChartCtx) {
        const cpuData = {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
                {
                    label: 'Ratio asignado',
                    data: [2.2, 2.4, 2.6, 2.3, 2.8, 3.1, 2.5],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Uso real',
                    data: [0.7, 0.8, 0.6, 0.9, 0.7, 0.5, 0.7],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        };

        new Chart(cpuChartCtx, {
            type: 'line',
            data: cpuData,
            options: commonOptions
        });
    }

    // Datos para el gráfico de RAM
    const ramChartCtx = document.getElementById('ramOverprovisionChart');
    if (ramChartCtx) {
        const ramData = {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
                {
                    label: 'Ratio asignado',
                    data: [1.5, 1.6, 1.8, 2.0, 2.2, 1.9, 1.8],
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Uso real',
                    data: [0.8, 0.7, 0.9, 1.0, 0.8, 0.6, 0.7],
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        };

        new Chart(ramChartCtx, {
            type: 'line',
            data: ramData,
            options: commonOptions
        });
    }

    // Datos para el gráfico de almacenamiento
    const diskChartCtx = document.getElementById('diskOverprovisionChart');
    if (diskChartCtx) {
        const diskData = {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
                {
                    label: 'Ratio asignado',
                    data: [1.3, 1.3, 1.4, 1.5, 1.6, 1.4, 1.4],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Uso real',
                    data: [0.4, 0.5, 0.5, 0.6, 0.5, 0.4, 0.4],
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        };

        new Chart(diskChartCtx, {
            type: 'line',
            data: diskData,
            options: commonOptions
        });
    }
}

// Actualizar gráficos de sobreaprovisionamiento según el rango de tiempo
function updateOverprovisionCharts(timeRange) {
    // Simulación de datos para diferentes rangos de tiempo
    // En una implementación real, aquí se cargarían datos del servidor
    console.log(`Actualizando gráficos para rango: ${timeRange}`);

    // Aquí iría la lógica para cargar y actualizar los datos de los gráficos
    // según el rango de tiempo seleccionado
}

// Inicializar modales de detalles de zona
function initZoneModals() {
    // Inicializar gráficos en el modal cuando se abre
    const zoneDetailsModal = document.getElementById('zoneDetailsModal');
    if (zoneDetailsModal) {
        zoneDetailsModal.addEventListener('shown.bs.modal', function() {
            initZoneDetailsCharts();
        });
    }
}

// Abrir modal con detalles de una zona específica
function openZoneDetails(zoneId) {
    // Cargar datos de la zona seleccionada
    // En una implementación real, aquí se cargarían datos del servidor
    console.log(`Abriendo detalles de zona: ${zoneId}`);

    // Actualizar contenido del modal según la zona
    updateZoneDetailsModal(zoneId);

    // Mostrar el modal
    const zoneModal = new bootstrap.Modal(document.getElementById('zoneDetailsModal'));
    zoneModal.show();
}

// Actualizar contenido del modal según la zona seleccionada
function updateZoneDetailsModal(zoneId) {
    // Datos de demostración para cada zona
    const zoneData = {
        'zone-a': {
            name: 'Zona A',
            status: 'En línea',
            statusClass: 'online',
            description: 'Zona principal de producción con alta disponibilidad.',
            servers: [
                { hostname: 'server-a1', ip: '10.20.12.215', status: 'Online', statusClass: 'bg-success', vcpu: '12/16', ram: '24/32 GB', storage: '320/500 GB', vms: 4 },
                { hostname: 'server-a2', ip: '10.20.12.216', status: 'Online', statusClass: 'bg-success', vcpu: '10/16', ram: '20/32 GB', storage: '280/500 GB', vms: 4 },
                { hostname: 'server-a3', ip: '10.20.12.217', status: 'Online', statusClass: 'bg-success', vcpu: '10/16', ram: '24/32 GB', storage: '200/500 GB', vms: 4 }
            ],
            slices: [
                { name: 'web-app-1', owner: 'Juan Díaz', type: 'Lineal', vms: 3, resources: '6 vCPU, 12GB RAM, 80GB', created: '12/04/2025', status: 'Activo', statusClass: 'bg-success' },
                { name: 'db-cluster', owner: 'Ana López', type: 'Anillo', vms: 4, resources: '12 vCPU, 32GB RAM, 120GB', created: '08/04/2025', status: 'Activo', statusClass: 'bg-success' },
                { name: 'test-env', owner: 'Carlos Ruiz', type: 'Malla', vms: 5, resources: '10 vCPU, 16GB RAM, 100GB', created: '15/04/2025', status: 'Activo', statusClass: 'bg-success' }
            ],
            ratios: { cpu: '2.5:1', ram: '1.8:1', disk: '1.4:1' }
        },
        'zone-b': {
            name: 'Zona B',
            status: 'Advertencia',
            statusClass: 'warning',
            description: 'Zona secundaria para desarrollo y pruebas.',
            servers: [
                { hostname: 'server-b1', ip: '10.20.12.218', status: 'Online', statusClass: 'bg-success', vcpu: '14/16', ram: '26/32 GB', storage: '350/500 GB', vms: 3 },
                { hostname: 'server-b2', ip: '10.20.12.219', status: 'Warning', statusClass: 'bg-warning', vcpu: '15/16', ram: '30/32 GB', storage: '420/500 GB', vms: 4 },
                { hostname: 'server-b3', ip: '10.20.12.220', status: 'Online', statusClass: 'bg-success', vcpu: '12/16', ram: '22/32 GB', storage: '350/500 GB', vms: 1 }
            ],
            slices: [
                { name: 'dev-stack', owner: 'María Gómez', type: 'Árbol', vms: 4, resources: '8 vCPU, 16GB RAM, 120GB', created: '05/04/2025', status: 'Activo', statusClass: 'bg-success' },
                { name: 'staging', owner: 'Pedro Sánchez', type: 'Lineal', vms: 4, resources: '12 vCPU, 24GB RAM, 160GB', created: '10/04/2025', status: 'Activo', statusClass: 'bg-success' }
            ],
            ratios: { cpu: '3.1:1', ram: '2.2:1', disk: '1.6:1' }
        },
        'zone-c': {
            name: 'Zona C',
            status: 'En línea',
            statusClass: 'online',
            description: 'Zona para investigación y nuevos desarrollos.',
            servers: [
                { hostname: 'server-c1', ip: '10.20.12.221', status: 'Online', statusClass: 'bg-success', vcpu: '8/16', ram: '16/32 GB', storage: '200/500 GB', vms: 3 },
                { hostname: 'server-c2', ip: '10.20.12.222', status: 'Online', statusClass: 'bg-success', vcpu: '6/16', ram: '12/32 GB', storage: '150/500 GB', vms: 2 }
            ],
            slices: [
                { name: 'research-env', owner: 'Laura Torres', type: 'Malla', vms: 3, resources: '6 vCPU, 12GB RAM, 80GB', created: '18/04/2025', status: 'Activo', statusClass: 'bg-success' },
                { name: 'poc-cluster', owner: 'Roberto Méndez', type: 'Bus', vms: 2, resources: '4 vCPU, 8GB RAM, 60GB', created: '20/04/2025', status: 'Activo', statusClass: 'bg-success' }
            ],
            ratios: { cpu: '1.8:1', ram: '1.5:1', disk: '1.2:1' }
        }
    };

    // Obtener datos de la zona
    const zone = zoneData[zoneId];
    if (!zone) return;

    // Actualizar título y descripción
    document.getElementById('modalZoneName').textContent = zone.name;
    document.getElementById('modalZoneStatus').textContent = zone.status;
    document.getElementById('modalZoneStatus').className = `zone-status ${zone.statusClass}`;
    document.getElementById('modalZoneDescription').textContent = zone.description;

    // Actualizar tabla de servidores
    const serversTableBody = document.querySelector('#serversTable tbody');
    if (serversTableBody) {
        serversTableBody.innerHTML = '';
        zone.servers.forEach(server => {
            serversTableBody.innerHTML += `
                <tr>
                    <td>${server.hostname}</td>
                    <td>${server.ip}</td>
                    <td><span class="badge ${server.statusClass}">${server.status}</span></td>
                    <td>${server.vcpu}</td>
                    <td>${server.ram}</td>
                    <td>${server.storage}</td>
                    <td>${server.vms}</td>
                </tr>
            `;
        });
    }

    // Actualizar tabla de slices
    const slicesTableBody = document.querySelector('#slicesTable tbody');
    if (slicesTableBody) {
        slicesTableBody.innerHTML = '';
        zone.slices.forEach(slice => {
            slicesTableBody.innerHTML += `
                <tr>
                    <td>${slice.name}</td>
                    <td>${slice.owner}</td>
                    <td>${slice.type}</td>
                    <td>${slice.vms}</td>
                    <td>${slice.resources}</td>
                    <td>${slice.created}</td>
                    <td><span class="badge ${slice.statusClass}">${slice.status}</span></td>
                </tr>
            `;
        });
    }

    // Actualizar valores de ratio
    const ratioElements = document.querySelectorAll('.ratio-value');
    if (ratioElements.length >= 3) {
        ratioElements[0].textContent = zone.ratios.cpu;
        ratioElements[1].textContent = zone.ratios.ram;
        ratioElements[2].textContent = zone.ratios.disk;
    }
}

// Inicializar gráficos en el modal de detalles
function initZoneDetailsCharts() {
    // Gráfico de uso de recursos
    const resourcesChartCtx = document.getElementById('zoneResourcesChart');
    if (resourcesChartCtx) {
        new Chart(resourcesChartCtx, {
            type: 'bar',
            data: {
                labels: ['CPU', 'RAM', 'Almacenamiento'],
                datasets: [
                    {
                        label: 'Capacidad física',
                        data: [32, 96, 1500],
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Asignado',
                        data: [80, 172, 2100],
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'En uso',
                        data: [21, 64, 580],
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
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
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                let unit = '';

                                if (context.dataIndex === 0) unit = ' vCPU';
                                else if (context.dataIndex === 1) unit = ' GB';
                                else if (context.dataIndex === 2) unit = ' GB';

                                return label + ': ' + value + unit;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value, index, values) {
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de presión de recursos
    const pressureChartCtx = document.getElementById('zonePressureChart');
    if (pressureChartCtx) {
        new Chart(pressureChartCtx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'CPU',
                        data: [65, 72, 80, 68, 75, 60, 67],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'RAM',
                        data: [55, 60, 65, 70, 60, 50, 58],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'I/O',
                        data: [40, 45, 50, 55, 47, 42, 44],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
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
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                return label + ': ' + value + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Función para obtener datos de zonas (simulado)
function fetchZoneData() {
    // En una implementación real, aquí se realizaría una llamada AJAX
    // para obtener datos actualizados del servidor
    console.log('Obteniendo datos actualizados de zonas...');

    // Simular carga de datos
    showLoading(true);

    // Simular retardo de red
    setTimeout(function() {
        // Actualizar gráficos y métricas con nuevos datos
        updateResourceMetrics();
        updateZoneCards();

        // Ocultar indicador de carga
        showLoading(false);
    }, 1000);
}

// Mostrar/ocultar indicador de carga
function showLoading(show) {
    const refreshBtn = document.getElementById('btnRefreshZones');
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

// Actualizar métricas generales de recursos
function updateResourceMetrics() {
    // Simulación de datos actualizados
    const metrics = {
        cpu: { total: 48, used: 31, percent: 65 },
        ram: { total: 128, used: 61, percent: 48 },
        storage: { total: 2, used: 0.7, percent: 35 },
        hosts: { total: 8, online: 7, warning: 1, offline: 0 }
    };

    // Actualizar valores en el DOM
    document.getElementById('totalCPU').textContent = metrics.cpu.total;
    document.getElementById('cpuProgressBar').style.width = metrics.cpu.percent + '%';
    document.getElementById('cpuUsagePercent').textContent = metrics.cpu.percent;

    document.getElementById('totalRAM').textContent = metrics.ram.total;
    document.getElementById('ramProgressBar').style.width = metrics.ram.percent + '%';
    document.getElementById('ramUsagePercent').textContent = metrics.ram.percent;

    document.getElementById('totalStorage').textContent = metrics.storage.total;
    document.getElementById('storageProgressBar').style.width = metrics.storage.percent + '%';
    document.getElementById('storageUsagePercent').textContent = metrics.storage.percent;

    document.getElementById('totalHosts').textContent = metrics.hosts.total;
    document.getElementById('hostsOnline').textContent = metrics.hosts.online;
    document.getElementById('hostsWarning').textContent = metrics.hosts.warning;
    document.getElementById('hostsOffline').textContent = metrics.hosts.offline;
}

// Actualizar tarjetas de zonas
function updateZoneCards() {
    // En una implementación real, aquí se actualizarían los datos
    // de las tarjetas de zonas con información del servidor
    console.log('Actualizando tarjetas de zonas...');

    // Por ahora, solo actualizamos la hora de última actualización
    updateLastRefreshTime();
}

// Exportar funciones para uso global (si es necesario)
window.openZoneDetails = openZoneDetails;