// Dashboard Module
const DashboardModule = {
    currentCalendarDate: new Date(),
    
    init() {
        this.update();
        this.initCalendar();
    },
    
    update() {
        this.updateStats();
        this.updateRecentHomeworks();
        this.updateRecentAchievements();
        this.updateXPBar();
        
        // Atualiza estatísticas se existirem
        if (window.StatisticsModule) {
            window.StatisticsModule.update();
        }
    },
    
    updateStats() {
        const homeworks = window.AppState.homeworks;
        const completed = homeworks.filter(h => h.completed).length;
        const pending = homeworks.filter(h => !h.completed).length;
        
        // Animate numbers
        this.animateNumber('totalHomeworks', homeworks.length);
        this.animateNumber('completedHomeworks', completed);
        this.animateNumber('pendingHomeworks', pending);
        this.animateNumber('currentStreak', window.AppState.currentUser?.streak || 0);
        
        // Update badge
        const badge = document.getElementById('pendingCount');
        if (badge) badge.textContent = pending;
    },
    
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    },
    
    updateRecentHomeworks() {
        const container = document.getElementById('recentHomeworksList');
        if (!container) return;
        
        const recent = window.AppState.homeworks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhuma lição cadastrada</p>';
            return;
        }
        
        container.innerHTML = recent.map(homework => `
            <div class="homework-item ${homework.completed ? 'completed' : ''}" onclick="HomeworkModule.toggleComplete('${homework.id}')">
                <div class="homework-checkbox ${homework.completed ? 'checked' : ''}">
                    ${homework.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="homework-content">
                    <div class="homework-title">${homework.title}</div>
                    <div class="homework-meta">
                        <span><i class="fas fa-book"></i> ${homework.subject}</span>
                        <span><i class="fas fa-calendar"></i> ${window.formatDate(homework.dueDate)}</span>
                    </div>
                </div>
                <span class="priority-badge priority-${homework.priority}">
                    ${homework.priority === 'high' ? 'Alta' : homework.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
            </div>
        `).join('');
    },
    
    updateRecentAchievements() {
        const container = document.getElementById('recentAchievements');
        if (!container) return;
        
        const unlocked = window.AppState.achievements
            .filter(a => a.unlockedAt)
            .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
            .slice(0, 4);
        
        const allAchievements = this.getDefaultAchievements();
        
        if (unlocked.length === 0) {
            // Show locked achievements preview
            container.innerHTML = allAchievements.slice(0, 4).map(a => `
                <div class="achievement-item locked">
                    <i class="fas ${a.icon}"></i>
                    <span>${a.name}</span>
                </div>
            `).join('');
            return;
        }
        
        container.innerHTML = unlocked.map(a => `
            <div class="achievement-item">
                <i class="fas ${a.icon}"></i>
                <span>${a.name}</span>
            </div>
        `).join('');
    },
    
    updateXPBar() {
        const user = window.AppState.currentUser;
        if (!user) return;
        
        const currentLevel = user.level || 1;
        const currentXP = user.xp || 0;
        const nextLevelXP = currentLevel * 100;
        const progress = (currentXP / nextLevelXP) * 100;
        
        document.getElementById('userLevel').textContent = currentLevel;
        document.getElementById('currentXP').textContent = currentXP;
        document.getElementById('nextLevelXP').textContent = nextLevelXP;
        document.getElementById('xpProgress').style.width = `${progress}%`;
        
        // Update profile level too
        const profileLevel = document.getElementById('profileLevel');
        if (profileLevel) profileLevel.textContent = currentLevel;
    },
    
    getDefaultAchievements() {
        return [
            { id: 'first_homework', name: 'Primeiros Passos', icon: 'fa-shoe-prints', description: 'Crie sua primeira lição' },
            { id: 'complete_5', name: 'Produtivo', icon: 'fa-check-double', description: 'Complete 5 lições' },
            { id: 'complete_10', name: 'Estudante Dedicado', icon: 'fa-graduation-cap', description: 'Complete 10 lições' },
            { id: 'streak_3', name: 'Consistência', icon: 'fa-fire', description: 'Estude 3 dias seguidos' },
            { id: 'focus_30', name: 'Foco Total', icon: 'fa-clock', description: 'Complete 30 minutos em modo foco' },
            { id: 'all_subjects', name: 'Polivalente', icon: 'fa-layer-group', description: 'Crie lições em 5 matérias diferentes' }
        ];
    },
    
    // CALENDÁRIO
    initCalendar() {
        this.renderCalendar();
        
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
            this.renderCalendar();
        });
        
        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
            this.renderCalendar();
        });
    },
    
    renderCalendar() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;
        
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        // Atualiza título
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        // Dias da semana
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        let html = weekDays.map(d => `<div class="calendar-day-header">${d}</div>`).join('');
        
        // Primeiro dia do mês
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Espaços vazios
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day" style="visibility: hidden;"></div>';
        }
        
        // Dias
        const today = new Date();
        const homeworks = window.AppState.homeworks;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayHomeworks = homeworks.filter(h => h.dueDate === dateStr);
            const hasPending = dayHomeworks.some(h => !h.completed);
            const allCompleted = dayHomeworks.length > 0 && dayHomeworks.every(h => h.completed);
            
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (dayHomeworks.length > 0) classes += ' has-homework';
            if (allCompleted) classes += ' completed';
            
            html += `<div class="${classes}" onclick="DashboardModule.showDayHomeworks('${dateStr}')">${day}</div>`;
        }
        
        calendar.innerHTML = html;
    },
    
    showDayHomeworks(dateStr) {
        const homeworks = window.AppState.homeworks.filter(h => h.dueDate === dateStr);
        if (homeworks.length === 0) return;
        
        const date = new Date(dateStr);
        const formatted = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        
        // Cria modal rápido
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 style="text-transform: capitalize;">${formatted}</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="padding: 1rem;">
                    ${homeworks.map(h => `
                        <div style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 8px; height: 8px; background: ${h.completed ? 'var(--success)' : 'var(--danger)'}; border-radius: 50%;"></div>
                            <div style="flex: 1;">
                                <div style="font-weight: 500;">${h.title}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${h.subject}</div>
                            </div>
                            ${h.completed ? '<i class="fas fa-check" style="color: var(--success);"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        document.body.appendChild(modal);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard')) {
        DashboardModule.init();
    }
});

window.DashboardModule = DashboardModule;