// Task Timer Module
const TaskTimerModule = {
    activeTimers: {},
    
    init() {
        this.loadActiveTimers();
        this.setupBeforeUnload();
    },
    
    startTimer(homeworkId) {
        // Pausa outros timers
        Object.keys(this.activeTimers).forEach(id => {
            if (id !== homeworkId) this.pauseTimer(id);
        });
        
        const homework = window.AppState.homeworks.find(h => h.id === homeworkId);
        if (!homework) return;
        
        // Inicializa se não existir
        if (!homework.actualTime) homework.actualTime = 0;
        
        this.activeTimers[homeworkId] = {
            startTime: Date.now(),
            interval: setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.activeTimers[homeworkId].startTime) / 1000);
                homework.actualTime = (homework.actualTime || 0) + 1;
                this.updateDisplay(homeworkId);
            }, 1000)
        };
        
        this.updateUIState(homeworkId, 'running');
        this.showNotification(`Timer iniciado: ${homework.title}`);
        
        // Salva estado
        this.saveActiveTimers();
    },
    
    pauseTimer(homeworkId) {
        const timer = this.activeTimers[homeworkId];
        if (!timer) return;
        
        clearInterval(timer.interval);
        delete this.activeTimers[homeworkId];
        
        this.updateUIState(homeworkId, 'paused');
        this.saveActiveTimers();
        window.saveData();
        
        const homework = window.AppState.homeworks.find(h => h.id === homeworkId);
        if (homework) {
            this.showNotification(`Timer pausado: ${this.formatTime(homework.actualTime || 0)}`);
        }
    },
    
    stopTimer(homeworkId) {
        this.pauseTimer(homeworkId);
        this.updateUIState(homeworkId, 'stopped');
    },
    
    updateDisplay(homeworkId) {
        const display = document.querySelector(`[data-timer="${homeworkId}"]`);
        if (!display) return;
        
        const homework = window.AppState.homeworks.find(h => h.id === homeworkId);
        if (!homework) return;
        
        display.textContent = this.formatTime(homework.actualTime || 0);
        
        // Compara com estimado
        const estimated = (homework.estimatedTime || 30) * 60;
        const actual = homework.actualTime || 0;
        const percent = Math.min((actual / estimated) * 100, 100);
        
        const progressBar = document.querySelector(`[data-timer-progress="${homeworkId}"]`);
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            
            // Muda cor se passou do tempo
            if (actual > estimated) {
                progressBar.style.background = 'var(--danger)';
            } else if (actual > estimated * 0.8) {
                progressBar.style.background = 'var(--warning)';
            }
        }
    },
    
    updateUIState(homeworkId, state) {
        const card = document.querySelector(`.homework-card[data-id="${homeworkId}"]`);
        if (!card) return;
        
        const btn = card.querySelector('.timer-btn');
        const indicator = card.querySelector('.timer-indicator');
        
        if (state === 'running') {
            if (btn) {
                btn.innerHTML = '<i class="fas fa-pause"></i>';
                btn.onclick = () => this.pauseTimer(homeworkId);
                btn.classList.add('active');
            }
            if (indicator) indicator.classList.add('active');
            card.classList.add('timer-running');
        } else {
            if (btn) {
                btn.innerHTML = '<i class="fas fa-play"></i>';
                btn.onclick = () => this.startTimer(homeworkId);
                btn.classList.remove('active');
            }
            if (indicator) indicator.classList.remove('active');
            card.classList.remove('timer-running');
        }
    },
    
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    showNotification(message) {
        // Usa o sistema de notificação existente ou cria um simples
        if (window.showNotification) {
            window.showNotification(message);
        } else {
            console.log(message);
        }
    },
    
    saveActiveTimers() {
        const toSave = {};
        Object.keys(this.activeTimers).forEach(id => {
            toSave[id] = { startTime: this.activeTimers[id].startTime };
        });
        sessionStorage.setItem('activeTimers', JSON.stringify(toSave));
    },
    
    loadActiveTimers() {
        const saved = sessionStorage.getItem('activeTimers');
        if (!saved) return;
        
        try {
            const timers = JSON.parse(saved);
            Object.keys(timers).forEach(id => {
                // Não reinicia automaticamente, só marca como pausado
                const homework = window.AppState.homeworks.find(h => h.id === id);
                if (homework) {
                    // Calcula tempo perdido se a página foi fechada
                    const elapsed = Math.floor((Date.now() - timers[id].startTime) / 1000);
                    homework.actualTime = (homework.actualTime || 0) + elapsed;
                }
            });
            sessionStorage.removeItem('activeTimers');
            window.saveData();
        } catch (e) {
            console.error('Erro ao carregar timers:', e);
        }
    },
    
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            this.saveActiveTimers();
        });
    },
    
    // Adiciona botão de timer ao card
    addTimerButton(card, homework) {
        const footer = card.querySelector('.homework-card-footer');
        if (!footer) return;
        
        const timerContainer = document.createElement('div');
        timerContainer.className = 'task-timer-container';
        timerContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
        `;
        
        const time = homework.actualTime || 0;
        const estimated = (homework.estimatedTime || 30) * 60;
        
        timerContainer.innerHTML = `
            <button class="timer-btn action-btn ${this.activeTimers[homework.id] ? 'active' : ''}" 
                    onclick="event.stopPropagation(); TaskTimerModule.${this.activeTimers[homework.id] ? 'pause' : 'start'}Timer('${homework.id}')"
                    title="Iniciar/Pausar timer">
                <i class="fas ${this.activeTimers[homework.id] ? 'fa-pause' : 'fa-play'}"></i>
            </button>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;">
                    <span data-timer="${homework.id}">${this.formatTime(time)}</span>
                    <span style="color: var(--text-muted);">est: ${homework.estimatedTime || 30}min</span>
                </div>
                <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px; overflow: hidden;">
                    <div data-timer-progress="${homework.id}" 
                         style="height: 100%; background: var(--success); width: ${Math.min((time / estimated) * 100, 100)}%; transition: width 1s;">
                    </div>
                </div>
            </div>
            <div class="timer-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: var(--success); opacity: 0; transition: opacity 0.3s;"></div>
        `;
        
        // Insere antes do botão de concluir
        const completeBtn = footer.querySelector('.btn-primary');
        if (completeBtn) {
            footer.insertBefore(timerContainer, completeBtn);
        } else {
            footer.appendChild(timerContainer);
        }
        
        // Se estiver rodando, atualiza display
        if (this.activeTimers[homework.id]) {
            this.updateDisplay(homework.id);
        }
    },
    
    // Mostra comparação ao concluir
    showCompletionStats(homework) {
        const estimated = (homework.estimatedTime || 30) * 60;
        const actual = homework.actualTime || 0;
        const diff = actual - estimated;
        const percent = Math.round((actual / estimated) * 100);
        
        let message, icon, color;
        if (diff <= 0) {
            message = `Muito bem! Você foi ${this.formatTime(Math.abs(diff))} mais rápido que o estimado!`;
            icon = 'fa-bolt';
            color = 'var(--success)';
        } else if (diff <= 300) { // 5 minutos
            message = `Quase no tempo! Só ${this.formatTime(diff)} a mais.`;
            icon = 'fa-check';
            color = 'var(--warning)';
        } else {
            message = `Levou ${this.formatTime(diff)} a mais que o estimado. Na próxima você acerta!`;
            icon = 'fa-clock';
            color = 'var(--info)';
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div style="padding: 2rem;">
                    <div style="width: 80px; height: 80px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: white; font-size: 2rem;">
                        <i class="fas ${icon}"></i>
                    </div>
                    <h2 style="margin-bottom: 0.5rem;">Lição Concluída!</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${message}</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius);">
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Estimado</div>
                            <div style="font-size: 1.25rem; font-weight: 600;">${this.formatTime(estimated)}</div>
                        </div>
                        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius);">
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Real</div>
                            <div style="font-size: 1.25rem; font-weight: 600; color: ${color};">${this.formatTime(actual)}</div>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                        Eficiência: ${percent}%
                    </div>
                    
                    <button class="btn-primary btn-full" onclick="this.closest('.modal').remove()">
                        Continuar
                    </button>
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
    if (document.getElementById('homeworks')) {
        TaskTimerModule.init();
    }
});

window.TaskTimerModule = TaskTimerModule;