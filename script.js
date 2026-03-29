function initializePageInteractions() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (sidebar) {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }

        document.documentElement.classList.remove('sidebar-collapsed-init');

        requestAnimationFrame(() => {
            sidebar.classList.add('sidebar-ready');
        });
    }

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem(
                'sidebar-collapsed',
                String(sidebar.classList.contains('collapsed'))
            );
        });
    }

    const navItems = document.querySelectorAll('.top-nav .nav-item');
    navItems.forEach((item) => {
        item.addEventListener('click', (event) => {
            if (item.getAttribute('href') === '#') {
                event.preventDefault();
            }

            navItems.forEach((nav) => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    const submenuToggles = document.querySelectorAll('.has-submenu');
    submenuToggles.forEach((toggle) => {
        toggle.addEventListener('click', (event) => {
            if (event.target.closest('.submenu')) {
                return;
            }

            event.preventDefault();

            const submenu = toggle.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('expanded');
                toggle.classList.toggle('active-submenu');
            }
        });
    });

    const sideNavItems = document.querySelectorAll('.side-nav > .side-nav-item');
    sideNavItems.forEach((item, index) => {
        item.classList.add('sidebar-entrance');
        item.style.setProperty('--sidebar-entrance-delay', `${index * 0.05}s`);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageInteractions, { once: true });
} else {
    initializePageInteractions();
}
