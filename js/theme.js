// Theme Module
const ThemeModule = {
    init() {
        this.loadSavedTheme();
        this.setupEventListeners();
    },
    
    loadSavedTheme() {
        // Verifica se há tema salvo no localStorage
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            // Usa o tema salvo
            this.setTheme(savedTheme);
        } else {
            // Verifica preferência do sistema
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.setTheme('dark');
            } else {
                this.setTheme('light');
            }
        }
    },
    
    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }
        
        // Ouve mudanças na preferência do sistema
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Só muda automaticamente se o usuário não tiver escolhido manualmente
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    },
    
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Salva a preferência do usuário
        localStorage.setItem('theme', newTheme);
        
        // Atualiza o AppState se existir
        if (typeof AppState !== 'undefined') {
            AppState.settings.theme = newTheme;
            // Salva nos dados do usuário se estiver logado
            if (typeof saveData === 'function') {
                saveData();
            }
        }
    },
    
    setTheme(theme) {
        // Aplica o tema no HTML
        document.documentElement.setAttribute('data-theme', theme);
        
        // Atualiza o botão
        this.updateButton(theme);
        
        console.log(`Tema alterado para: ${theme}`);
    },
    
    updateButton(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span');
        
        if (theme === 'dark') {
            if (icon) icon.className = 'fas fa-sun';
            if (text) text.textContent = 'Modo Claro';
        } else {
            if (icon) icon.className = 'fas fa-moon';
            if (text) text.textContent = 'Modo Escuro';
        }
    }
};

// Initialize quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ThemeModule.init();
    });
} else {
    // DOM já carregou
    ThemeModule.init();
}

// Expõe globalmente
window.ThemeModule = ThemeModule;