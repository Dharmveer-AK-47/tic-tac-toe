// Professional Theme Manager for Tic Tac Toe
if (typeof ThemeManager === 'undefined') {
    class ThemeManager {
        constructor() {
            // Defined theme order for cycling
            this.themes = ['light', 'dark', 'cyberpunk', 'ocean', 'gradient'];
            this.currentThemeIndex = 0;
            
            // Initialize theme system
            this.init();
        }

        init() {
            // Load saved theme or default to 'light'
            const savedTheme = localStorage.getItem('ttt_theme');
            const themeToApply = this.themes.includes(savedTheme) ? savedTheme : 'light';
            
            // Use existing method to set initial state without animation
            this.applyTheme(themeToApply);
            
            // Find theme toggle button and attach click handler
            const toggleBtn = document.getElementById('themeToggle');
            if (toggleBtn) {
                this.updateIcon(toggleBtn, themeToApply);
                
                toggleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.cycleTheme();
                });
            }
        }

        cycleTheme() {
            // Find current theme dynamically from classList
            let currentTheme = 'light';
            for (const theme of this.themes) {
                if (document.body.classList.contains(theme)) {
                    currentTheme = theme;
                    break;
                }
            }
                                
            let index = this.themes.indexOf(currentTheme);
            if (index === -1) index = 0;
            
            // Calculate next index
            const nextIndex = (this.themes.indexOf(currentTheme) + 1) % this.themes.length;
            const nextTheme = this.themes[nextIndex];
            
            // Apply new theme
            this.applyTheme(nextTheme);
        }

        applyTheme(theme) {
            // Remove all theme classes first
            this.themes.forEach(t => document.body.classList.remove(t));
            
            // Add new theme class
            document.body.classList.add(theme);
            
            // Save to localStorage
            localStorage.setItem('ttt_theme', theme);
            
            // Update toggle button icon if it exists
            const toggleBtn = document.getElementById('themeToggle');
            if (toggleBtn) {
                this.updateIcon(toggleBtn, theme);
            }
        }
        
        updateIcon(btn, theme) {
            // Icon logic: Show icon representing the current mode
            const icons = {
                'light': 'fa-sun',
                'dark': 'fa-moon',
                'cyberpunk': 'fa-bolt',
                'ocean': 'fa-water',
                'gradient': 'fa-magic'
            };
            
            const iconClass = icons[theme] || 'fa-sun';
            btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
        }
    }

    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
}
