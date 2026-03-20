// Auth Module
const AuthModule = {
    isLoginMode: true,
    
    init() {
        this.setupEventListeners();
        this.checkRememberedUser();
    },
    
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const switchBtn = document.getElementById('switchAuthBtn');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        if (switchBtn) {
            switchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }
    },
    
    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        // Validação básica
        if (!email || !password) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }
        
        // Validate user
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Set current user
            const currentUser = { 
                id: user.id,
                name: user.name,
                email: user.email,
                level: user.level || 1,
                xp: user.xp || 0,
                streak: user.streak || 0,
                lastActive: user.lastActive || new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Redirect to main app
            window.location.href = 'index.html';
        } else {
            this.showError('Email ou senha incorretos');
        }
    },
    
    handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validações
        if (!name || !email || !password || !confirmPassword) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }
        
        if (name.length < 2) {
            this.showError('O nome deve ter pelo menos 2 caracteres');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('Por favor, insira um email válido');
            return;
        }
        
        if (password.length < 6) {
            this.showError('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('As senhas não coincidem');
            return;
        }
        
        // Check if email exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
            this.showError('Este email já está cadastrado');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: password,
            createdAt: new Date().toISOString(),
            level: 1,
            xp: 0,
            streak: 0,
            lastActive: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Initialize user data
        const initialData = {
            homeworks: [],
            achievements: [],
            focusSessions: [],
            settings: {
                theme: 'light',
                notifications: true,
                sound: true
            }
        };
        localStorage.setItem(`data_${email}`, JSON.stringify(initialData));
        
        // Auto login
        const currentUser = { 
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            level: 1,
            xp: 0,
            streak: 0,
            lastActive: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Show success and redirect
        this.showSuccess('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    },
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    toggleAuthMode() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const switchText = document.getElementById('authSwitchText');
        
        this.isLoginMode = !this.isLoginMode;
        
        if (!this.isLoginMode) {
            // Mostrar formulário de registro
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            switchText.innerHTML = 'Já tem uma conta? <button type="button" class="btn-link" id="switchAuthBtn">Entrar</button>';
        } else {
            // Mostrar formulário de login
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            switchText.innerHTML = 'Não tem uma conta? <button type="button" class="btn-link" id="switchAuthBtn">Cadastre-se</button>';
        }
        
        // Re-attach event listener ao novo botão
        const newSwitchBtn = document.getElementById('switchAuthBtn');
        if (newSwitchBtn) {
            newSwitchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }
        
        // Limpar mensagens de erro
        this.removeMessages();
    },
    
    checkRememberedUser() {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            const emailInput = document.getElementById('loginEmail');
            const rememberCheckbox = document.getElementById('rememberMe');
            if (emailInput) emailInput.value = rememberedEmail;
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    },
    
    showError(message) {
        this.removeMessages();
        const form = document.querySelector('.auth-form:not(.hidden)');
        if (!form) return;
        
        const error = document.createElement('div');
        error.className = 'error-message';
        error.style.cssText = `
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            animation: slideIn 0.3s ease;
        `;
        error.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        form.insertBefore(error, form.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (error.parentNode) {
                error.remove();
            }
        }, 5000);
    },
    
    showSuccess(message) {
        this.removeMessages();
        const form = document.querySelector('.auth-form:not(.hidden)');
        if (!form) return;
        
        const success = document.createElement('div');
        success.className = 'success-message';
        success.style.cssText = `
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            animation: slideIn 0.3s ease;
        `;
        success.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        form.insertBefore(success, form.firstChild);
    },
    
    removeMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());
    }
};

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize auth module
document.addEventListener('DOMContentLoaded', () => {
    AuthModule.init();
});