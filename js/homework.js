// Homework Module
const HomeworkModule = {
    currentFilter: 'all',
    
    init() {
        this.setupEventListeners();
        this.render();
    },
    
    setupEventListeners() {
        // Add homework button
        const addBtn = document.getElementById('addHomeworkBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }
        
        // Close modal
        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Form submit
        const form = document.getElementById('homeworkForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Filters
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });
        
        // Search
        const searchInput = document.getElementById('searchHomework');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.render(e.target.value);
            });
        }
        
        // Close modal on outside click
        const modal = document.getElementById('homeworkModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    },
    
    openModal(homework = null) {
        const modal = document.getElementById('homeworkModal');
        const form = document.getElementById('homeworkForm');
        const title = modal.querySelector('h2');
        
        if (homework) {
            title.textContent = 'Editar Lição';
            document.getElementById('subject').value = homework.subject;
            document.getElementById('title').value = homework.title;
            document.getElementById('description').value = homework.description || '';
            document.getElementById('dueDate').value = homework.dueDate;
            document.getElementById('priority').value = homework.priority;
            document.getElementById('estimatedTime').value = homework.estimatedTime || 30;
            form.dataset.editId = homework.id;
        } else {
            title.textContent = 'Nova Lição';
            form.reset();
            form.dataset.editId = '';
            document.getElementById('dueDate').valueAsDate = new Date();
        }
        
        modal.classList.add('active');
    },
    
    closeModal() {
        const modal = document.getElementById('homeworkModal');
        modal.classList.remove('active');
    },
    
    handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const editId = form.dataset.editId;
        
        const homeworkData = {
            id: editId || window.generateId(),
            subject: document.getElementById('subject').value,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            dueDate: document.getElementById('dueDate').value,
            priority: document.getElementById('priority').value,
            estimatedTime: parseInt(document.getElementById('estimatedTime').value),
            completed: false,
            actualTime: 0, // Inicializa tempo real
            createdAt: editId ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (editId) {
            const index = window.AppState.homeworks.findIndex(h => h.id === editId);
            if (index !== -1) {
                // Preserva o tempo real já registrado
                homeworkData.actualTime = window.AppState.homeworks[index].actualTime || 0;
                window.AppState.homeworks[index] = { 
                    ...window.AppState.homeworks[index], 
                    ...homeworkData 
                };
            }
        } else {
            window.AppState.homeworks.push(homeworkData);
            
            // Check achievements
            if (window.AchievementsModule) {
                window.AchievementsModule.checkAchievement('first_homework');
            }
        }
        
        window.saveData();
        this.render();
        this.closeModal();
        
        // Update dashboard if visible
        if (window.DashboardModule) {
            window.DashboardModule.update();
            window.DashboardModule.renderCalendar();
        }
        
        // Update notifications
        if (window.NotificationsModule) {
            window.NotificationsModule.checkDeadlines();
        }
        
        // Update statistics
        if (window.StatisticsModule) {
            window.StatisticsModule.update();
        }
        
        window.showNotification(editId ? 'Lição atualizada!' : 'Lição criada com sucesso!');
    },
    
    render(searchTerm = '') {
        const container = document.getElementById('homeworksGrid');
        if (!container) return;
        
        let homeworks = window.AppState.homeworks;
        
        // Apply filter
        if (this.currentFilter === 'pending') {
            homeworks = homeworks.filter(h => !h.completed);
        } else if (this.currentFilter === 'completed') {
            homeworks = homeworks.filter(h => h.completed);
        }
        
        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            homeworks = homeworks.filter(h => 
                h.title.toLowerCase().includes(term) ||
                h.subject.toLowerCase().includes(term) ||
                h.description?.toLowerCase().includes(term)
            );
        }
        
        // Sort by due date and priority
        homeworks = homeworks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.priority !== b.priority) {
                const priorities = { high: 0, medium: 1, low: 2 };
                return priorities[a.priority] - priorities[b.priority];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        if (homeworks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">Nenhuma lição encontrada</p>
                </div>
            `;
            return;
        }
        
        // Container com drag and drop
        container.innerHTML = `<div class="homeworks-dnd">${homeworks.map((homework, index) => {
            const isOverdue = !homework.completed && new Date(homework.dueDate) < new Date().setHours(0,0,0,0);
            const isRunning = window.TaskTimerModule?.activeTimers?.[homework.id];
            
            return `
            <div class="homework-card priority-${homework.priority} ${homework.completed ? 'completed' : ''} ${isRunning ? 'timer-running' : ''}" 
                 draggable="true" 
                 data-index="${index}"
                 data-id="${homework.id}"
                 style="position: relative; padding-left: 1.5rem;">
                <div class="drag-handle" style="position: absolute; left: 0; top: 0; bottom: 0; width: 12px; cursor: grab; background: var(--border-color); opacity: 0.3; display: flex; align-items: center; justify-content: center; border-radius: var(--radius) 0 0 var(--radius);">
                    <i class="fas fa-grip-vertical" style="font-size: 0.625rem; color: var(--text-muted);"></i>
                </div>
                <div class="homework-card-header">
                    <span class="homework-subject">
                        <i class="fas fa-book"></i>
                        ${homework.subject}
                    </span>
                    <div class="homework-actions">
                        <button class="action-btn" onclick="event.stopPropagation(); HomeworkModule.openModalById('${homework.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="event.stopPropagation(); HomeworkModule.delete('${homework.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <h3>${homework.title}</h3>
                <p>${homework.description || 'Sem descrição'}</p>
                
                <!-- TIMER INTEGRADO -->
                ${!homework.completed ? `
                <div class="task-timer-bar" style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <button class="timer-btn action-btn ${isRunning ? 'active' : ''}" 
                                onclick="event.stopPropagation(); 
                                if (window.TaskTimerModule) {
                                    if (window.TaskTimerModule.activeTimers['${homework.id}']) {
                                        window.TaskTimerModule.pauseTimer('${homework.id}');
                                    } else {
                                        window.TaskTimerModule.startTimer('${homework.id}');
                                    }
                                }"
                                title="${isRunning ? 'Pausar' : 'Iniciar'} timer"
                                style="width: 36px; height: 36px; border-radius: 50%; background: ${isRunning ? 'var(--danger)' : 'var(--success)'}; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                            <i class="fas ${isRunning ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                <span class="timer-display" data-timer="${homework.id}" style="font-family: monospace; font-weight: 600; font-size: 1rem;">
                                    ${window.TaskTimerModule ? window.TaskTimerModule.formatTime(homework.actualTime || 0) : '00:00'}
                                </span>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">
                                    Estimado: ${homework.estimatedTime || 30}min
                                </span>
                            </div>
                            <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
                                <div class="timer-progress" data-timer-progress="${homework.id}" 
                                     style="height: 100%; background: ${(homework.actualTime || 0) > ((homework.estimatedTime || 30) * 60) ? 'var(--danger)' : 'var(--success)'}; 
                                            width: ${Math.min(((homework.actualTime || 0) / ((homework.estimatedTime || 30) * 60)) * 100, 100)}%; 
                                            transition: width 1s;">
                                </div>
                            </div>
                        </div>
                        <div class="timer-pulse" style="width: 10px; height: 10px; border-radius: 50%; background: var(--success); opacity: ${isRunning ? '1' : '0'}; transition: opacity 0.3s; ${isRunning ? 'animation: pulse 1.5s infinite;' : ''}"></div>
                    </div>
                </div>
                ` : `
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius); display: flex; align-items: center; gap: 0.5rem; color: var(--success); font-size: 0.875rem;">
                    <i class="fas fa-check-circle"></i>
                    <span>Concluída em ${window.TaskTimerModule ? window.TaskTimerModule.formatTime(homework.actualTime || 0) : '00:00'}</span>
                    ${homework.actualTime && homework.estimatedTime ? `
                        <span style="margin-left: auto; ${homework.actualTime <= homework.estimatedTime * 60 ? 'color: var(--success);' : 'color: var(--warning);'}">
                            ${homework.actualTime <= homework.estimatedTime * 60 ? '✓ No prazo' : '⚠ Atrasada'}
                        </span>
                    ` : ''}
                </div>
                `}
                
                <div class="homework-card-footer">
                    <span class="due-date ${isOverdue ? 'urgent' : ''}">
                        <i class="fas fa-calendar-alt"></i>
                        ${isOverdue ? 'Atrasado: ' : ''}${window.formatDate(homework.dueDate)}
                    </span>
                    <button class="btn-primary" onclick="event.stopPropagation(); HomeworkModule.toggleComplete('${homework.id}')" 
                        style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        ${homework.completed ? 
                            '<i class="fas fa-undo"></i> Desfazer' : 
                            '<i class="fas fa-check"></i> Concluir'}
                    </button>
                </div>
            </div>
        `}).join('')}</div>`;
        
        this.setupDragAndDrop();
        
        // Atualiza displays de timer em tempo real
        if (window.TaskTimerModule) {
            Object.keys(window.TaskTimerModule.activeTimers).forEach(id => {
                window.TaskTimerModule.updateDisplay(id);
            });
        }
    },
    
    setupDragAndDrop() {
        const container = document.querySelector('.homeworks-dnd');
        if (!container) return;
        
        let draggedElement = null;
        
        container.querySelectorAll('.homework-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedElement = card;
                card.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
                card.style.cursor = 'grabbing';
            });
            
            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
                card.style.cursor = 'pointer';
                draggedElement = null;
                
                // Atualiza ordem no AppState
                const newOrder = Array.from(container.querySelectorAll('.homework-card')).map(c => c.dataset.id);
                const reordered = [];
                newOrder.forEach(id => {
                    const h = window.AppState.homeworks.find(x => x.id === id);
                    if (h) reordered.push(h);
                });
                window.AppState.homeworks = reordered;
                window.saveData();
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }
            });
        });
    },
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.homework-card:not([style*="opacity: 0.5"])')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },
    
    openModalById(id) {
        const homework = window.AppState.homeworks.find(h => h.id === id);
        if (homework) this.openModal(homework);
    },
    
    toggleComplete(id) {
        const homework = window.AppState.homeworks.find(h => h.id === id);
        if (!homework) return;
        
        // Se estiver com timer rodando, para e mostra estatísticas
        if (window.TaskTimerModule?.activeTimers?.[id]) {
            window.TaskTimerModule.pauseTimer(id);
        }
        
        homework.completed = !homework.completed;
        homework.completedAt = homework.completed ? new Date().toISOString() : null;
        
        // Se completou e tem tempo registrado, mostra comparação
        if (homework.completed && homework.actualTime > 0 && window.TaskTimerModule) {
            window.TaskTimerModule.showCompletionStats(homework);
        }
        
        window.saveData();
        this.render();
        
        if (window.DashboardModule) {
            window.DashboardModule.update();
            window.DashboardModule.renderCalendar();
        }
        
        if (window.NotificationsModule) {
            window.NotificationsModule.checkDeadlines();
        }
        
        if (window.StatisticsModule) {
            window.StatisticsModule.update();
        }
        
        if (homework.completed) {
            // Award XP
            if (window.XPSystem) {
                window.XPSystem.addXP(20, 'Lição concluída!');
            }
            
            // Check achievements
            if (window.AchievementsModule) {
                const completed = window.AppState.homeworks.filter(h => h.completed).length;
                if (completed >= 5) window.AchievementsModule.checkAchievement('complete_5');
                if (completed >= 10) window.AchievementsModule.checkAchievement('complete_10');
            }
            
            if (!homework.actualTime || homework.actualTime === 0) {
                window.showNotification('Lição concluída! +20 XP');
            }
        }
    },
    
    delete(id) {
        if (!confirm('Tem certeza que deseja excluir esta lição?')) return;
        
        // Para timer se estiver rodando
        if (window.TaskTimerModule?.activeTimers?.[id]) {
            window.TaskTimerModule.pauseTimer(id);
        }
        
        window.AppState.homeworks = window.AppState.homeworks.filter(h => h.id !== id);
        window.saveData();
        this.render();
        
        if (window.DashboardModule) {
            window.DashboardModule.update();
            window.DashboardModule.renderCalendar();
        }
        
        if (window.NotificationsModule) {
            window.NotificationsModule.checkDeadlines();
        }
        
        if (window.StatisticsModule) {
            window.StatisticsModule.update();
        }
        
        window.showNotification('Lição excluída');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('homeworks')) {
        HomeworkModule.init();
    }
});

window.HomeworkModule = HomeworkModule;