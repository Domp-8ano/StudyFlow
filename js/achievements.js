// Achievements Module
const AchievementsModule = {
    defaultAchievements: [
        {
            id: 'first_homework',
            name: 'Primeiros Passos',
            description: 'Crie sua primeira lição',
            icon: 'fa-shoe-prints',
            xpReward: 50,
            condition: (data) => data.homeworks.length >= 1
        },
        {
            id: 'complete_5',
            name: 'Produtivo',
            description: 'Complete 5 lições',
            icon: 'fa-check-double',
            xpReward: 100,
            condition: (data) => data.homeworks.filter(h => h.completed).length >= 5
        },
        {
            id: 'complete_10',
            name: 'Estudante Dedicado',
            description: 'Complete 10 lições',
            icon: 'fa-graduation-cap',
            xpReward: 200,
            condition: (data) => data.homeworks.filter(h => h.completed).length >= 10
        },
        {
            id: 'complete_25',
            name: 'Mestre das Tarefas',
            description: 'Complete 25 lições',
            icon: 'fa-crown',
            xpReward: 500,
            condition: (data) => data.homeworks.filter(h => h.completed).length >= 25
        },
        {
            id: 'streak_3',
            name: 'Consistência',
            description: 'Estude 3 dias seguidos',
            icon: 'fa-fire',
            xpReward: 100,
            condition: (data) => (data.user?.streak || 0) >= 3
        },
        {
            id: 'streak_7',
            name: 'Semana Perfeita',
            description: 'Estude 7 dias seguidos',
            icon: 'fa-calendar-check',
            xpReward: 300,
            condition: (data) => (data.user?.streak || 0) >= 7
        },
        {
            id: 'focus_30',
            name: 'Foco Total',
            description: 'Acumule 30 minutos em modo foco',
            icon: 'fa-clock',
            xpReward: 100,
            condition: (data) => {
                const totalMinutes = data.focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                return totalMinutes >= 30;
            }
        },
        {
            id: 'focus_120',
            name: 'Maratonista',
            description: 'Acumule 2 horas em modo foco',
            icon: 'fa-stopwatch',
            xpReward: 300,
            condition: (data) => {
                const totalMinutes = data.focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                return totalMinutes >= 120;
            }
        },
        {
            id: 'all_subjects',
            name: 'Polivalente',
            description: 'Crie lições em 5 matérias diferentes',
            icon: 'fa-layer-group',
            xpReward: 150,
            condition: (data) => {
                const subjects = new Set(data.homeworks.map(h => h.subject));
                return subjects.size >= 5;
            }
        },
        {
            id: 'night_owl',
            name: 'Coruja Noturna',
            description: 'Complete uma lição após as 22h',
            icon: 'fa-moon',
            xpReward: 75,
            condition: (data) => {
                return data.homeworks.some(h => {
                    if (!h.completedAt) return false;
                    const hour = new Date(h.completedAt).getHours();
                    return hour >= 22;
                });
            }
        },
        {
            id: 'early_bird',
            name: 'Madrugador',
            description: 'Complete uma lição antes das 8h',
            icon: 'fa-sun',
            xpReward: 75,
            condition: (data) => {
                return data.homeworks.some(h => {
                    if (!h.completedAt) return false;
                    const hour = new Date(h.completedAt).getHours();
                    return hour < 8;
                });
            }
        },
        {
            id: 'perfect_day',
            name: 'Dia Perfeito',
            description: 'Complete todas as lições do dia',
            icon: 'fa-star',
            xpReward: 100,
            condition: (data) => {
                const today = new Date().toDateString();
                const todayHomeworks = data.homeworks.filter(h => {
                    const dueDate = new Date(h.dueDate).toDateString();
                    return dueDate === today;
                });
                return todayHomeworks.length > 0 && todayHomeworks.every(h => h.completed);
            }
        }
    ],
    
    init() {
        this.initializeAchievements();
        this.render();
    },
    
    initializeAchievements() {
        // Merge default achievements with saved ones
        const saved = window.AppState.achievements || [];
        
        this.defaultAchievements.forEach(defaultAch => {
            const savedAch = saved.find(a => a.id === defaultAch.id);
            if (!savedAch) {
                window.AppState.achievements.push({
                    ...defaultAch,
                    unlockedAt: null
                });
            }
        });
        
        window.saveData();
    },
    
    checkAchievement(achievementId) {
        const achievement = window.AppState.achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.unlockedAt) return;
        
        const defaultAch = this.defaultAchievements.find(a => a.id === achievementId);
        if (!defaultAch) return;
        
        const data = {
            homeworks: window.AppState.homeworks,
            user: window.AppState.currentUser,
            focusSessions: window.AppState.focusSessions
        };
        
        if (defaultAch.condition(data)) {
            this.unlockAchievement(achievement);
        }
    },
    
    checkAllAchievements() {
        this.defaultAchievements.forEach(ach => this.checkAchievement(ach.id));
    },
    
    unlockAchievement(achievement) {
        achievement.unlockedAt = new Date().toISOString();
        window.saveData();
        
        // Award XP
        if (window.XPSystem && achievement.xpReward) {
            window.XPSystem.addXP(achievement.xpReward, `Conquista: ${achievement.name}`);
        }
        
        // Show notification
        this.showAchievementNotification(achievement);
        
        // Update UI
        this.render();
        
        // Update dashboard
        if (window.DashboardModule) {
            window.DashboardModule.update();
        }
    },
    
    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievementNotification');
        if (!notification) return;
        
        document.getElementById('achievementName').textContent = achievement.name;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
        
        // Play sound
        if (window.AppState.settings.sound) {
            this.playAchievementSound();
        }
    },
    
    playAchievementSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a triumphant sound
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            let currentNote = 0;
            
            function playNote() {
                if (currentNote >= notes.length) return;
                
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = notes[currentNote];
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                
                currentNote++;
                setTimeout(playNote, 150);
            }
            
            playNote();
        } catch (e) {
            console.log('Audio not supported');
        }
    },
    
    render() {
        const container = document.getElementById('achievementsList');
        const progressCircle = document.getElementById('achievementsProgress');
        const unlockedCount = document.getElementById('unlockedCount');
        const totalCount = document.getElementById('totalAchievements');
        
        if (!container) return;
        
        const achievements = window.AppState.achievements;
        const unlocked = achievements.filter(a => a.unlockedAt);
        const total = achievements.length;
        const progress = total > 0 ? (unlocked.length / total) * 100 : 0;
        
        // Update progress
        if (progressCircle) {
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (progress / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }
        
        if (unlockedCount) unlockedCount.textContent = unlocked.length;
        if (totalCount) totalCount.textContent = total;
        
        // Sort: unlocked first, then by name
        const sorted = [...achievements].sort((a, b) => {
            if (a.unlockedAt && !b.unlockedAt) return -1;
            if (!a.unlockedAt && b.unlockedAt) return 1;
            return a.name.localeCompare(b.name);
        });
        
        container.innerHTML = sorted.map(ach => `
            <div class="achievement-card ${ach.unlockedAt ? 'unlocked' : 'locked'}">
                <div class="achievement-icon-large">
                    <i class="fas ${ach.icon}"></i>
                </div>
                <div class="achievement-details">
                    <h3>${ach.name}</h3>
                    <p>${ach.description}</p>
                    <div class="achievement-progress">
                        <div class="achievement-progress-bar" style="width: ${ach.unlockedAt ? '100%' : '0%'}"></div>
                    </div>
                    ${ach.unlockedAt ? 
                        `<small style="color: var(--success); margin-top: 0.5rem; display: block;">
                            <i class="fas fa-check"></i> Desbloqueado em ${new Date(ach.unlockedAt).toLocaleDateString('pt-BR')}
                        </small>` : 
                        `<small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">
                            <i class="fas fa-lock"></i> Bloqueado
                        </small>`
                    }
                </div>
                ${ach.xpReward ? `<span style="color: var(--warning); font-weight: 600; font-size: 0.875rem;">+${ach.xpReward} XP</span>` : ''}
            </div>
        `).join('');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('achievements')) {
        AchievementsModule.init();
        // Check achievements on load
        setTimeout(() => AchievementsModule.checkAllAchievements(), 1000);
    }
});

window.AchievementsModule = AchievementsModule;