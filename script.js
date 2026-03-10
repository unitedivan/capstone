document.addEventListener('DOMContentLoaded', () => {
    // Left Sidebar Toggle Functionality
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');

            // Optional: Save state to localStorage so it persists across page loads
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed);
        });

        // Initialize state from localStorage if it exists
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    // Interactive Top Navigation highlights
    const navItems = document.querySelectorAll('.top-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.getAttribute('href') === '#') {
                e.preventDefault(); // Prevent jump to top for demo purposes
            }

            // Note: For multi-page setups, adding 'active' class via JS on click 
            // doesn't persist across navigation. The HTML handles active states now.
            // We just keep this for the # links
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Submenu Expansion Logic
    const submenuToggles = document.querySelectorAll('.has-submenu');
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            // Make sure we didn't click on an actual submenu link inside the toggle area
            if (e.target.closest('.submenu')) {
                return; // Let normal link navigation happen
            }

            e.preventDefault(); // Prevent default for parent toggle only

            // Find the immediate next sibling which assumes to be the submenu
            const submenu = toggle.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('expanded');

                // Add visual indicator to the parent if needed
                toggle.classList.toggle('active-submenu');
            }
        });
    });

    // Add subtle entrance animation to the content
    const sideNavItems = document.querySelectorAll('.side-nav-item:not(.has-submenu)');
    document.querySelectorAll('.side-nav-item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transitionDelay = `${index * 0.05}s`;

        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            // Reset transition delay after entrance animation
            setTimeout(() => {
                item.style.transitionDelay = '0s';
            }, 300);
        }, 100);
    });
});
