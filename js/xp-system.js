// XP System Module
const XPSystem = {
    levels: [
        { level: 1, xpRequired: 0, title: 'Iniciante' },
        { level: 2, xpRequired: 100, title: 'Estudante' },
        { level: 3, xpRequired: 250, title: 'Dedicado' },
        { level: 4, xpRequired: 450, title: 'Esforçado' },
        { level: 5, xpRequired: 700, title: 'Brilhante' },
        { level: 6, xpRequired: 1000, title: 'Expert' },
        { level: 7, xpRequired: 1350, title: 'Mestre' },
        { level: 8, xpRequired: 1750, title: 'Gênio' },
        { level: 9, xpRequired: 2200, title: 'Lendário' },
        { level: 10, xpRequired: 2700, title: 'Mítico' }
    ],
    
    addXP(amount, message = '') {
        const user = window.AppState.currentUser;
        if (!user) return;
        
        const oldLevel = this.getCurrentLevel(user.xp || 0);
        user.xp = (user.xp || 0) + amount;
        const newLevel = this.getCurrentLevel(user.xp);
        
        // Update user data
        this.updateUserData(user);
        
        // Show notification
        this.showXPNotification(amount, message);
        
        // Check level up
        if (newLevel.level > oldLevel.level) {
            this.handleLevelUp(newLevel);
        }
        
        // Update UI
        if (window.DashboardModule) {
            window.DashboardModule.updateXPBar();
        }
        
        // Save to localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        currentUser.xp = user.xp;
        currentUser.level = newLevel.level;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update users list
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
            users[userIndex].xp = user.xp;
            users[userIndex].level = newLevel.level;
            localStorage.setItem('users', JSON.stringify(users));
        }
    },
    
    getCurrentLevel(xp) {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (xp >= this.levels[i].xpRequired) {
                return this.levels[i];
            }
        }
        return this.levels[0];
    },
    
    getXPForNextLevel(currentXP) {
        const currentLevel = this.getCurrentLevel(currentXP);
        const nextLevel = this.levels.find(l => l.level === currentLevel.level + 1);
        return nextLevel ? nextLevel.xpRequired : currentLevel.xpRequired;
    },
    
    updateUserData(user) {
        window.AppState.currentUser = user;
    },
    
    handleLevelUp(newLevel) {
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification show';
            notification.innerHTML = `
                <div class="achievement-icon" style="background: linear-gradient(135deg, #fbbf24, #f59e0b);">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <div class="achievement-info">
                    <h4>Level Up!</h4>
                    <p>Você alcançou o nível ${newLevel.level} - ${newLevel.title}</p>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }, 1000);
        
        // Play sound if enabled
        if (window.AppState.settings.sound) {
            this.playLevelUpSound();
        }
    },
    
    showXPNotification(amount, message) {
        const notification = document.getElementById('xpNotification');
        if (!notification) return;
        
        document.getElementById('xpGained').textContent = amount;
        document.getElementById('xpMessage').textContent = message || 'XP ganho!';
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    },
    
    playLevelUpSound() {
        // Simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    },
    
    // Streak management
    updateStreak() {
        const user = window.AppState.currentUser;
        if (!user) return;
        
        const lastActive = user.lastActive ? new Date(user.lastActive) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!lastActive) {
            user.streak = 1;
        } else {
            const lastActiveDate = new Date(lastActive);
            lastActiveDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Consecutive day
                user.streak = (user.streak || 0) + 1;
                
                // Bonus XP for streak
                if (user.streak % 3 === 0) {
                    this.addXP(50, `${user.streak} dias seguidos! Bônus de streak!`);
                    if (window.AchievementsModule) {
                        window.AchievementsModule.checkAchievement('streak_3');
                    }
                }
            } else if (diffDays > 1) {
                // Streak broken
                user.streak = 1;
            }
        }
        
        user.lastActive = new Date().toISOString();
        this.updateUserData(user);
        
        // Save to localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        currentUser.streak = user.streak;
        currentUser.lastActive = user.lastActive;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update users list
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
            users[userIndex].streak = user.streak;
            users[userIndex].lastActive = user.lastActive;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
};

// Initialize streak on load
document.addEventListener('DOMContentLoaded', () => {
    if (window.AppState.currentUser) {
        XPSystem.updateStreak();
    }
});

window.XPSystem = XPSystem;