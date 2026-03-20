// Shortcuts Module
const ShortcutsModule = {
    init() {
        this.setupShortcuts();
        this.createHelpModal();
    },
    
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignora se estiver em input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Permite Ctrl+Enter em formulários
                if (e.ctrlKey && e.key === 'Enter') {
                    const form = e.target.closest('form');
                    if (form) form.dispatchEvent(new Event('submit'));
                }
                return;
            }
            
            const key = e.key.toLowerCase();
            
            switch(key) {
                case 'n':
                    e.preventDefault();
                    this.openNewHomework();
                    this.showToast('Nova lição (N)');
                    break;
                    
                case 'escape':
                    e.preventDefault();
                    this.closeModals();
                    break;
                    
                case 'f':
                    e.preventDefault();
                    this.goToFocus();
                    this.showToast('Modo Foco (F)');
                    break;
                    
                case 'c':
                    e.preventDefault();
                    this.toggleSelectedHomework();
                    break;
                    
                case '?':
                    e.preventDefault();
                    this.showHelp();
                    break;
                    
                case ' ':
                    // Espaço só no modo foco
                    if (document.getElementById('focus').classList.contains('active')) {
                        e.preventDefault();
                        if (window.FocusModeModule) {
                            window.FocusModeModule.toggle();
                        }
                    }
                    break;
            }
            
            // Navegação por números 1-5
            if (key >= '1' && key <= '5') {
                e.preventDefault();
                this.navigateToTab(parseInt(key));
            }
        });
    },
    
    openNewHomework() {
        const addBtn = document.getElementById('addHomeworkBtn');
        if (addBtn) {
            addBtn.click();
        } else {
            // Se não estiver na página de lições, vai para lá primeiro
            window.location.hash = 'homeworks';
            setTimeout(() => {
                document.getElementById('addHomeworkBtn')?.click();
            }, 100);
        }
    },
    
    closeModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => modal.classList.remove('active'));
    },
    
    goToFocus() {
        const focusLink = document.querySelector('[data-page="focus"]');
        if (focusLink) focusLink.click();
    },
    
    toggleSelectedHomework() {
        // Tenta encontrar uma lição em foco ou a primeira pendente
        const selected = document.querySelector('.homework-card:hover');
        if (selected) {
            const id = selected.dataset.id;
            if (id && window.HomeworkModule) {
                window.HomeworkModule.toggleComplete(id);
                this.showToast('Lição concluída (C)');
            }
        }
    },
    
    navigateToTab(num) {
        const pages = ['dashboard', 'homeworks', 'focus', 'achievements', 'profile'];
        const page = pages[num - 1];
        if (page) {
            const link = document.querySelector(`[data-page="${page}"]`);
            if (link) {
                link.click();
                this.showToast(`${link.querySelector('span').textContent} (${num})`);
            }
        }
    },
    
    showToast(message) {
        // Remove toast anterior
        const existing = document.querySelector('.shortcut-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'shortcut-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 0.75rem 1.5rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--border-color);
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 9999;
            animation: fadeInUp 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        toast.innerHTML = `<i class="fas fa-keyboard" style="color: var(--primary);"></i> ${message}`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOutDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 1500);
    },
    
    createHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'shortcutsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-keyboard"></i> Atalhos de Teclado</h2>
                    <button class="close-modal" onclick="document.getElementById('shortcutsModal').classList.remove('active')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="shortcuts-list" style="padding: 1.5rem;">
                    <div class="shortcut-item">
                        <kbd>N</kbd>
                        <span>Nova lição</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Fechar modal</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>F</kbd>
                        <span>Modo Foco</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>C</kbd>
                        <span>Concluir lição (hover)</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                        <span>Salvar formulário</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>1</kbd> - <kbd>5</kbd>
                        <span>Navegar entre abas</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Espaço</kbd>
                        <span>Iniciar/pausar timer (no foco)</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>?</kbd>
                        <span>Mostrar esta ajuda</span>
                    </div>
                </div>
            </div>
        `;
        
        // CSS para o modal
        const style = document.createElement('style');
        style.textContent = `
            .shortcuts-list {
                display: grid;
                gap: 0.75rem;
            }
            .shortcut-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.5rem;
                border-radius: var(--radius);
            }
            .shortcut-item:hover {
                background: var(--bg-tertiary);
            }
            .shortcut-item kbd {
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                padding: 0.25rem 0.5rem;
                font-family: monospace;
                font-size: 0.875rem;
                min-width: 30px;
                text-align: center;
                box-shadow: 0 2px 0 var(--border-color);
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translate(-50%, 20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
            @keyframes fadeOutDown {
                from { opacity: 1; transform: translate(-50%, 0); }
                to { opacity: 0; transform: translate(-50%, 20px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    },
    
    showHelp() {
        document.getElementById('shortcutsModal').classList.add('active');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard')) {
        ShortcutsModule.init();
    }
});

window.ShortcutsModule = ShortcutsModule;