// Theme Toggle System - Perfect Green/Red Theme
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Apply saved theme
        this.setTheme(this.theme);
        
        // Create theme toggle button
        this.createThemeToggle();
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    createThemeToggle() {
        const toggle = document.createElement('div');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = `
            <i class="fas ${this.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
            <span>${this.theme === 'dark' ? 'Light' : 'Dark'}</span>
        `;
        
        toggle.addEventListener('click', () => this.toggleTheme());
        
        // Add to all pages
        document.body.appendChild(toggle);
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.theme = theme;
        
        // Update DOM
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update toggle button
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.innerHTML = `
                <i class="fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
                <span>${theme === 'dark' ? 'Light' : 'Dark'}</span>
            `;
        }
        
        // Save preference
        localStorage.setItem('theme', theme);
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
    }

    getCurrentTheme() {
        return this.theme;
    }

    isDark() {
        return this.theme === 'dark';
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other scripts
window.themeManager = themeManager;
