document.addEventListener('DOMContentLoaded', function() {
    console.log("Cargando vista de métricas de usuario");

    // Referencias a elementos del DOM
    const timeRangeSelector = document.getElementById('timeRangeSelector');
    const btnRefreshMetrics = document.getElementById('btnRefreshMetrics');

    // ID del usuario desde la URL o data attribute
    const userId = document.querySelector('.user-details').getAttribute('data-userid');

    // Inicializar gráficos
    let cpuChart, ramChart, storageChart, networkChart;

    // Función para obtener datos de Prometheus
    async function fetchMetricsData(userId, timeRange) {
        try {
            // En una implementación real, esta URL apuntaría a tu API que consulta Prometheus
            const response = await fetch(`/api/metrics/user/${userId}?timeRange=${timeRange}`);

            if (!response.ok) {
                throw new Error(`Error al obtener métricas: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error al obtener datos de métricas:", error);
            return null;
        }
    }

    // Función para actualizar todos los gráficos
    async function updateCharts() {
        const timeRange = timeRangeSelector.value;
        const metricsData = await fetchMetricsData(userId, timeRange);

        if (!metricsData) {
            alert("No se pudieron cargar las métricas. Por favor, intente nuevamente.");
            return;
        }

        // Actualizar gráficos con nuevos datos
        updateCpuChart(metricsData.cpu);
        updateRamChart(metricsData.ram);
        updateStorageChart(metricsData.storage);
        updateNetworkChart(metricsData.network);
    }

    // Funciones para actualizar cada gráfico
    function updateCpuChart(cpuData) {
        const ctx = document.getElementById('cpuChart').getContext('2d');

        // Destruir gráfico existente si ya existe
        if (cpuChart) {
            cpuChart.destroy();
        }

        cpuChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: cpuData.timestamps,
                datasets: [{
                    label: 'Uso de CPU (vCPU)',
                    data: cpuData.values,
                    borderColor: 'rgba(67, 97, 238, 1)',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'vCPU'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Tiempo'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    // Implementaciones similares para RAM, almacenamiento y red
    function updateRamChart(ramData) {
        // Implementación similar a updateCpuChart
    }

    function updateStorageChart(storageData) {
        // Implementación similar a updateCpuChart
    }

    function updateNetworkChart(networkData) {
        // Implementación similar a updateCpuChart
    }

    // Asignar eventos
    timeRangeSelector.addEventListener('change', updateCharts);
    btnRefreshMetrics.addEventListener('click', updateCharts);

    // Inicializar la página
    updateCharts();
});