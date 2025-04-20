// /js/admin.js
document.addEventListener('DOMContentLoaded', function() {
    // Manejar toggle de sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');

            sidebar.classList.toggle('hidden');
            mainContent.classList.toggle('full-width');

            // Guardar preferencia en localStorage
            localStorage.setItem('sidebarHidden', sidebar.classList.contains('hidden'));
        });
    }

    // Manejar toggle para dispositivos móviles
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('visible');
        });
    }

    // Restaurar preferencia de sidebar
    const sidebarHidden = localStorage.getItem('sidebarHidden') === 'true';
    if (sidebarHidden) {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        if (sidebar && mainContent) {
            sidebar.classList.add('hidden');
            mainContent.classList.add('full-width');
        }
    }

    // Comprobar autenticación
    checkAuthentication();
});

// Verificar si el usuario está autenticado
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const currentPath = window.location.pathname;

    // Si no hay token y no estamos en la página de login, redirigir al login
    if (!token && !currentPath.includes('/login')) {
        window.location.href = '/login';
        return;
    }

    // Si hay token y estamos en la página de login, redirigir al dashboard
    if (token && currentPath.includes('/login')) {
        window.location.href = '/Admin/dashboard';
        return;
    }
}