// Notifications Module
const NotificationsModule = {
    init() {
        this.checkDeadlines();
        // Verifica a cada hora
        setInterval(() => this.checkDeadlines(), 60 * 60 * 1000);
    },
    
    checkDeadlines() {
        const homeworks = window.AppState.homeworks;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const urgent = homeworks.filter(h => {
            if (h.completed) return false;
            const due = new Date(h.dueDate);
            due.setHours(0,0,0,0);
            return due.getTime() === today.getTime() || due.getTime() === tomorrow.getTime();
        });
        
        if (urgent.length > 0) {
            this.showNotification(urgent);
        }
        
        // Atualiza badge na sidebar
        const badge = document.getElementById('pendingCount');
        if (badge) {
            badge.textContent = urgent.length;
            badge.style.display = urgent.length > 0 ? 'flex' : 'none';
        }
    },
    
    showNotification(urgent) {
        const titles = urgent.map(h => h.title).join(', ');
        const message = urgent.length === 1 
            ? `A lição "${titles}" vence ${urgent[0].dueDate === new Date().toISOString().split('T')[0] ? 'hoje' : 'amanhã'}!`
            : `Você tem ${urgent.length} lições para entregar em breve!`;
        
        // Notificação visual no app
        const existing = document.querySelector('.deadline-alert');
        if (existing) existing.remove();
        
        const alert = document.createElement('div');
        alert.className = 'deadline-alert';
        alert.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #f97316);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
            z-index: 9999;
            max-width: 350px;
            animation: slideInRight 0.4s ease;
            cursor: pointer;
        `;
        alert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem;"></i>
                <div>
                    <strong style="display: block; margin-bottom: 0.25rem;">Atenção!</strong>
                    <span style="font-size: 0.875rem; opacity: 0.95;">${message}</span>
                </div>
                <button onclick="event.stopPropagation(); this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        alert.addEventListener('click', () => {
            window.location.hash = 'homeworks';
            alert.remove();
        });
        
        document.body.appendChild(alert);
        
        // Auto-remove após 10 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOutRight 0.4s ease';
                setTimeout(() => alert.remove(), 400);
            }
        }, 10000);
    }
};

// CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicializa
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard')) {
        setTimeout(() => NotificationsModule.init(), 1000);
    }
});

window.NotificationsModule = NotificationsModule;