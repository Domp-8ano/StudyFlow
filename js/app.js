// App State
const AppState = {
    currentUser: null,
    homeworks: [],
    achievements: [],
    focusSessions: [],
    settings: {
        theme: 'light',
        notifications: true,
        sound: true
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    checkAuth();
    loadData();
    setupEventListeners();
    setupNavigation();
    updateTheme();
}

// Check Authentication
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user) {
        AppState.currentUser = JSON.parse(user);
        updateUserInterface();
    }
}

// Load Data from LocalStorage
function loadData() {
    if (AppState.currentUser) {
        const userData = localStorage.getItem(`data_${AppState.currentUser.email}`);
        if (userData) {
            const data = JSON.parse(userData);
            AppState.homeworks = data.homeworks || [];
            AppState.achievements = data.achievements || [];
            AppState.focusSessions = data.focusSessions || [];
            AppState.settings = { ...AppState.settings, ...data.settings };
        }
        
        // Apply saved theme
        if (AppState.settings.theme) {
            document.documentElement.setAttribute('data-theme', AppState.settings.theme);
        }
    }
}

// Save Data to LocalStorage
function saveData() {
    if (AppState.currentUser) {
        const data = {
            homeworks: AppState.homeworks,
            achievements: AppState.achievements,
            focusSessions: AppState.focusSessions,
            settings: AppState.settings
        };
        localStorage.setItem(`data_${AppState.currentUser.email}`, JSON.stringify(data));
    }
}

// Update User Interface
function updateUserInterface() {
    if (!AppState.currentUser) return;
    
    const user = AppState.currentUser;
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userInitials').textContent = getInitials(user.name);
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileInitials').textContent = getInitials(user.name);
    document.getElementById('profileEmail').textContent = user.email;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.page-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetPage) {
                    section.classList.add('active');
                }
            });
            
            // Update page title
            document.title = `StudyFlow - ${link.querySelector('span').textContent}`;
            
            // Refresh data for the page
            refreshPageData(targetPage);
        });
    });
    
    // Handle hash navigation
    const hash = window.location.hash.slice(1) || 'dashboard';
    const targetLink = document.querySelector(`[data-page="${hash}"]`);
    if (targetLink) targetLink.click();
}

function refreshPageData(page) {
    switch(page) {
        case 'dashboard':
            if (window.DashboardModule) DashboardModule.update();
            break;
        case 'homeworks':
            if (window.HomeworkModule) HomeworkModule.render();
            break;
        case 'achievements':
            if (window.AchievementsModule) AchievementsModule.render();
            break;
        case 'profile':
            if (window.ProfileModule) ProfileModule.update();
            break;
    }
}

// Event Listeners
// Event Listeners
function setupEventListeners() {
    // Sidebar toggle
    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Theme toggle - REMOVIDO DAQUI (agora está no ThemeModule)
    // const themeToggle = document.getElementById('themeToggle');
    // if (themeToggle) {
    //     themeToggle.addEventListener('click', toggleTheme);
    // }
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Theme Toggle
function toggleTheme() {
    // Delega para o ThemeModule se existir
    if (window.ThemeModule) {
        window.ThemeModule.toggle();
    } else {
        // Fallback caso ThemeModule não esteja carregado
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (typeof AppState !== 'undefined') {
            AppState.settings.theme = newTheme;
        }
        
        updateThemeButton(newTheme);
    }
}

function updateThemeButton(theme) {
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
// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Amanhã';
    } else {
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export modules
window.AppState = AppState;
window.saveData = saveData;
window.generateId = generateId;
window.formatDate = formatDate;
window.showNotification = showNotification;