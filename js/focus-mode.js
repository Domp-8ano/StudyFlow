// Focus Mode Module
const FocusModeModule = {
    timer: null,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    currentMode: 25,
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.populateTaskSelect();
        this.updateStats();
    },
    
    setupEventListeners() {
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        const modeBtns = document.querySelectorAll('.mode-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) return;
                
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const minutes = parseInt(btn.dataset.time);
                this.currentMode = minutes;
                this.totalTime = minutes * 60;
                this.timeLeft = this.totalTime;
                this.updateDisplay();
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('focus').classList.contains('active')) return;
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggle();
            } else if (e.code === 'KeyR' && e.ctrlKey) {
                e.preventDefault();
                this.reset();
            }
        });
    },
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        document.querySelector('.timer-display').classList.add('active');
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
        
        // Enter focus mode visually
        document.body.classList.add('focus-active');
    },
    
    pause() {
        this.isRunning = false;
        clearInterval(this.timer);
        document.querySelector('.timer-display').classList.remove('active');
        document.body.classList.remove('focus-active');
    },
    
    reset() {
        this.pause();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
    },
    
    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    },
    
    complete() {
        this.pause();
        
        const session = {
            id: window.generateId(),
            duration: this.totalTime / 60,
            mode: this.currentMode,
            completedAt: new Date().toISOString(),
            taskId: document.getElementById('focusTaskSelect').value || null
        };
        
        window.AppState.focusSessions.push(session);
        window.saveData();
        
        // Award XP
        const xpGained = Math.floor(this.totalTime / 60) * 5;
        if (window.XPSystem) {
            window.XPSystem.addXP(xpGained, 'Sessão de foco concluída!');
        }
        
        // Check achievements
        if (window.AchievementsModule) {
            window.AchievementsModule.checkAchievement('focus_30');
            window.AchievementsModule.checkAchievement('focus_120');
        }
        
        // Notification
        this.showCompletionNotification();
        
        // Update stats
        this.updateStats();
        
        // Reset timer
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        
        // Play sound
        if (window.AppState.settings.sound) {
            this.playCompletionSound();
        }
    },
    
    updateDisplay() {
        const display = document.getElementById('timerDisplay');
        if (!display) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update page title
        if (this.isRunning) {
            document.title = `(${minutes}:${seconds.toString().padStart(2, '0')}) Modo Foco - StudyFlow`;
        }
    },
    
    populateTaskSelect() {
        const select = document.getElementById('focusTaskSelect');
        if (!select) return;
        
        const pending = window.AppState.homeworks.filter(h => !h.completed);
        
        select.innerHTML = '<option value="">Selecione uma lição...</option>' +
            pending.map(h => `<option value="${h.id}">${h.subject}: ${h.title}</option>`).join('');
    },
    
    updateStats() {
        const totalMinutes = window.AppState.focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        const totalTimeEl = document.getElementById('totalFocusTime');
        if (totalTimeEl) {
            totalTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
        }
        
        const sessionsEl = document.getElementById('completedSessions');
        if (sessionsEl) {
            sessionsEl.textContent = window.AppState.focusSessions.length;
        }
        
        // Update profile stat
        const profileFocusTime = document.getElementById('profileFocusTime');
        if (profileFocusTime) {
            profileFocusTime.textContent = `${hours}h`;
        }
    },
    
    showCompletionNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('StudyFlow - Sessão Concluída!', {
                body: `Você completou ${this.currentMode} minutos de foco!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3233/3233483.png'
            });
        }
        
        window.showNotification(`Sessão concluída! +${Math.floor(this.totalTime / 60) * 5} XP`);
    },
    
    playCompletionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a pleasant chime
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            const now = audioContext.currentTime;
            
            notes.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                const startTime = now + (i * 0.1);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.5);
            });
        } catch (e) {
            console.log('Audio not supported');
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('focus')) {
        FocusModeModule.init();
    }
});

window.FocusModeModule = FocusModeModule;