// Statistics Module
const StatisticsModule = {
    chartInstance: null,
    
    init() {
        this.createStatsSection();
        this.setupEventListeners();
    },
    
    createStatsSection() {
        // Cria a seção de estatísticas no HTML
        const main = document.querySelector('.main-content');
        if (!main) return;
        
        const section = document.createElement('section');
        section.id = 'statistics';
        section.className = 'page-section';
        section.innerHTML = `
            <h1 class="page-title">Estatísticas</h1>
            
            <div class="stats-overview">
                <div class="stat-card wide">
                    <div class="stat-icon gradient">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="weeklyProductivity">0%</h3>
                        <p>Produtividade Semanal</p>
                    </div>
                </div>
                
                <div class="stat-card wide">
                    <div class="stat-icon blue">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="avgCompletionTime">0min</h3>
                        <p>Tempo Médio por Tarefa</p>
                    </div>
                </div>
                
                <div class="stat-card wide">
                    <div class="stat-icon green">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="accuracyRate">0%</h3>
                        <p>Precisão de Estimativa</p>
                    </div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="card chart-card">
                    <div class="card-header">
                        <h2>Produtividade Semanal</h2>
                        <div class="chart-legend">
                            <span class="legend-item"><span class="dot current"></span> Esta semana</span>
                            <span class="legend-item"><span class="dot previous"></span> Semana anterior</span>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="weeklyChart"></canvas>
                    </div>
                </div>
                
                <div class="card chart-card">
                    <div class="card-header">
                        <h2>Distribuição por Matéria</h2>
                    </div>
                    <div class="chart-container doughnut">
                        <canvas id="subjectsChart"></canvas>
                    </div>
                </div>
                
                <div class="card chart-card wide">
                    <div class="card-header">
                        <h2>Tendência de Conclusão</h2>
                        <select id="trendPeriod">
                            <option value="7">Últimos 7 dias</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 3 meses</option>
                        </select>
                    </div>
                    <div class="chart-container">
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>
                
                <div class="card stats-detail-card">
                    <div class="card-header">
                        <h2>Resumo por Matéria</h2>
                    </div>
                    <div class="subject-stats-list" id="subjectStatsList">
                        <!-- Preenchido via JS -->
                    </div>
                </div>
            </div>
        `;
        
        // Adiciona CSS específico
        const style = document.createElement('style');
        style.textContent = `
            .stats-overview {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .stat-card.wide {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.5rem;
            }
            
            .stat-icon.gradient {
                background: linear-gradient(135deg, var(--primary), var(--secondary));
                color: white;
            }
            
            .charts-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 1.5rem;
            }
            
            .chart-card {
                padding: 1.5rem;
            }
            
            .chart-card.wide {
                grid-column: 1 / -1;
            }
            
            .chart-container {
                position: relative;
                height: 300px;
                margin-top: 1rem;
            }
            
            .chart-container.doughnut {
                height: 250px;
            }
            
            .chart-legend {
                display: flex;
                gap: 1rem;
                font-size: 0.875rem;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-secondary);
            }
            
            .dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
            }
            
            .dot.current {
                background: var(--primary);
            }
            
            .dot.previous {
                background: var(--text-muted);
                opacity: 0.5;
            }
            
            .subject-stats-list {
                padding: 1rem;
            }
            
            .subject-stat-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .subject-stat-item:last-child {
                border-bottom: none;
            }
            
            .subject-color {
                width: 16px;
                height: 16px;
                border-radius: 50%;
            }
            
            .subject-info {
                flex: 1;
            }
            
            .subject-name {
                font-weight: 500;
                margin-bottom: 0.25rem;
            }
            
            .subject-count {
                font-size: 0.75rem;
                color: var(--text-muted);
            }
            
            .subject-rate {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--success);
            }
            
            @media (max-width: 1024px) {
                .stats-overview {
                    grid-template-columns: 1fr;
                }
                
                .charts-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Insere antes do primeiro page-section existente
        const firstSection = main.querySelector('.page-section');
        if (firstSection) {
            main.insertBefore(section, firstSection);
        } else {
            main.appendChild(section);
        }
        
        // Adiciona ao menu
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            const statsLink = document.createElement('li');
            statsLink.setAttribute('data-page', 'statistics');
            statsLink.innerHTML = `
                <a href="#statistics">
                    <i class="fas fa-chart-bar"></i>
                    <span>Estatísticas</span>
                </a>
            `;
            
            // Insere antes do profile
            const profileLink = navLinks.querySelector('[data-page="profile"]');
            if (profileLink) {
                navLinks.insertBefore(statsLink, profileLink);
            } else {
                navLinks.appendChild(statsLink);
            }
            
            // Re-setup navigation
            if (window.setupNavigation) {
                setupNavigation();
            }
        }
    },
    
    setupEventListeners() {
        document.getElementById('trendPeriod')?.addEventListener('change', () => {
            this.renderTrendChart();
        });
    },
    
    update() {
        this.calculateOverview();
        this.renderWeeklyChart();
        this.renderSubjectsChart();
        this.renderTrendChart();
        this.renderSubjectStats();
    },
    
    calculateOverview() {
        const homeworks = window.AppState.homeworks;
        const completed = homeworks.filter(h => h.completed);
        
        // Produtividade semanal (lições completadas / total da semana)
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const thisWeekHomeworks = homeworks.filter(h => {
            const created = new Date(h.createdAt);
            return created >= weekStart;
        });
        
        const thisWeekCompleted = thisWeekHomeworks.filter(h => h.completed).length;
        const productivity = thisWeekHomeworks.length > 0 
            ? Math.round((thisWeekCompleted / thisWeekHomeworks.length) * 100) 
            : 0;
        
        document.getElementById('weeklyProductivity').textContent = `${productivity}%`;
        
        // Tempo médio de conclusão
        const withTime = completed.filter(h => h.actualTime);
        const avgTime = withTime.length > 0
            ? Math.round(withTime.reduce((sum, h) => sum + h.actualTime, 0) / withTime.length / 60)
            : 0;
        
        document.getElementById('avgCompletionTime').textContent = `${avgTime}min`;
        
        // Precisão de estimativa
        const withEstimate = completed.filter(h => h.estimatedTime && h.actualTime);
        let accurate = 0;
        withEstimate.forEach(h => {
            const estimated = h.estimatedTime * 60;
            const actual = h.actualTime;
            // Considera preciso se estiver dentro de 20% de diferença
            if (Math.abs(actual - estimated) / estimated <= 0.2) {
                accurate++;
            }
        });
        
        const accuracy = withEstimate.length > 0
            ? Math.round((accurate / withEstimate.length) * 100)
            : 0;
        
        document.getElementById('accuracyRate').textContent = `${accuracy}%`;
    },
    
    renderWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;
        
        // Dados da semana atual
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const today = new Date();
        const currentData = new Array(7).fill(0);
        const previousData = new Array(7).fill(0);
        
        window.AppState.homeworks.forEach(h => {
            if (!h.completed || !h.completedAt) return;
            
            const completed = new Date(h.completedAt);
            const dayOfWeek = completed.getDay();
            
            // Verifica se é desta semana
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const prevWeekStart = new Date(weekStart);
            prevWeekStart.setDate(prevWeekStart.getDate() - 7);
            
            if (completed >= weekStart) {
                currentData[dayOfWeek]++;
            } else if (completed >= prevWeekStart) {
                previousData[dayOfWeek]++;
            }
        });
        
        // Destrói gráfico anterior se existir
        if (this.weeklyChartInstance) {
            this.weeklyChartInstance.destroy();
        }
        
        this.weeklyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Esta semana',
                        data: currentData,
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderRadius: 6,
                    },
                    {
                        label: 'Semana anterior',
                        data: previousData,
                        backgroundColor: 'rgba(148, 163, 184, 0.4)',
                        borderRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    },
    
    renderSubjectsChart() {
        const ctx = document.getElementById('subjectsChart');
        if (!ctx) return;
        
        // Agrupa por matéria
        const subjects = {};
        window.AppState.homeworks.forEach(h => {
            if (!subjects[h.subject]) {
                subjects[h.subject] = { total: 0, completed: 0 };
            }
            subjects[h.subject].total++;
            if (h.completed) subjects[h.subject].completed++;
        });
        
        const labels = Object.keys(subjects);
        const data = labels.map(s => subjects[s].total);
        const colors = this.generateColors(labels.length);
        
        if (this.subjectsChartInstance) {
            this.subjectsChartInstance.destroy();
        }
        
        this.subjectsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12 }
                    }
                }
            }
        });
    },
    
    renderTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        const period = parseInt(document.getElementById('trendPeriod')?.value || 7);
        const today = new Date();
        const dates = [];
        const completed = [];
        const created = [];
        
        for (let i = period - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }));
            
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayCompleted = window.AppState.homeworks.filter(h => {
                if (!h.completedAt) return false;
                const d = new Date(h.completedAt);
                return d >= dayStart && d <= dayEnd;
            }).length;
            
            const dayCreated = window.AppState.homeworks.filter(h => {
                const d = new Date(h.createdAt);
                return d >= dayStart && d <= dayEnd;
            }).length;
            
            completed.push(dayCompleted);
            created.push(dayCreated);
        }
        
        if (this.trendChartInstance) {
            this.trendChartInstance.destroy();
        }
        
        this.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Concluídas',
                        data: completed,
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Criadas',
                        data: created,
                        borderColor: 'rgba(99, 102, 241, 1)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    },
    
    renderSubjectStats() {
        const container = document.getElementById('subjectStatsList');
        if (!container) return;
        
        const subjects = {};
        window.AppState.homeworks.forEach(h => {
            if (!subjects[h.subject]) {
                subjects[h.subject] = { total: 0, completed: 0, time: 0 };
            }
            subjects[h.subject].total++;
            if (h.completed) {
                subjects[h.subject].completed++;
                subjects[h.subject].time += h.actualTime || 0;
            }
        });
        
        const sorted = Object.entries(subjects)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);
        
        const colors = this.generateColors(sorted.length);
        
        container.innerHTML = sorted.map(([subject, data], index) => {
            const rate = Math.round((data.completed / data.total) * 100);
            const avgTime = data.completed > 0 
                ? Math.round((data.time / data.completed) / 60) 
                : 0;
            
            return `
                <div class="subject-stat-item">
                    <div class="subject-color" style="background: ${colors[index]}"></div>
                    <div class="subject-info">
                        <div class="subject-name">${subject}</div>
                        <div class="subject-count">${data.completed}/${data.total} concluídas • média ${avgTime}min</div>
                    </div>
                    <div class="subject-rate" style="color: ${rate >= 70 ? 'var(--success)' : rate >= 40 ? 'var(--warning)' : 'var(--danger)'}">
                        ${rate}%
                    </div>
                </div>
            `;
        }).join('');
    },
    
    generateColors(count) {
        const baseColors = [
            '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6',
            '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#64748b'
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Carrega Chart.js dinamicamente
    if (!window.Chart) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            if (document.getElementById('dashboard')) {
                StatisticsModule.init();
            }
        };
        document.head.appendChild(script);
    } else {
        if (document.getElementById('dashboard')) {
            StatisticsModule.init();
        }
    }
});

window.StatisticsModule = StatisticsModule;