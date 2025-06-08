class AdminScreenController {
    constructor() {
        this.updateInterval = null;
        this.chartInstances = {};
        this.init();
    }

    init() {
        this.loadUserData(); //  加载用户数据
        this.initTimeDisplay(); //  初始化时间显示
        this.initLogout(); //  初始化退出登录功能
        this.initSystemStatus(); //  初始化系统状态
        this.initUserManagement(); //  初始化用户管理
        this.initSystemLogs(); //  初始化系统日志
        this.initControlPanel(); //  初始化控制面板
        this.initResourceCharts(); //  初始化资源图表
        this.startDataUpdates(); // 启动数据更新
        
        console.log('车载系统管理员界面初始化完成');
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
            });
            const users = await response.json();
            
            const totaluserCount = users.length;
            const userCount = users.filter(user => user.status === 'online').length;
            const driverCount = users.filter(user => user.role === 'driver').length;
            const decayFactor = 0.2; // 衰减系数设为0.2
            const currentLoad = (userCount / totaluserCount * 100) || 0;
            
            this.systemData.users = userCount;
            this.systemData.systemLoad = this.systemData.systemLoad * decayFactor + currentLoad * (1 - decayFactor);;
            this.systemData.connectedVehicles = driverCount;
            this.systemData.dataThroughput = (this.systemData.dataThroughput * decayFactor) + (userCount * 0.3 * (1 - decayFactor));
            this.systemData.responseTime = (this.systemData.responseTime * decayFactor) + (userCount * 2 * (1 - decayFactor));
            this.systemData.errorRate = (this.systemData.errorRate * decayFactor) + (userCount * 0.0005 * (1 - decayFactor));
            if (response.ok) {
                this.renderUserList(users);
                console.log('用户加载成功');
            } else {
                console.error('用户加载失败:', users.error);
            }
        } catch (error) {
            console.error('用户加载失败:', error);
        }
    }

    //  初始化时间显示
    initTimeDisplay() {
        this.updateTimeDisplay();
        setInterval(() => this.updateTimeDisplay(), 1000);
    }

    updateTimeDisplay() {
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        
        const hourElement = document.querySelector('.hour');
        const minuteElement = document.querySelector('.minute');
        const dateElement = document.querySelector('.date');
        const weekdayElement = document.querySelector('.weekday');
        
        if (hourElement) hourElement.textContent = hour;
        if (minuteElement) minuteElement.textContent = minute;
        
        if (dateElement) {
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            dateElement.textContent = `${year}年${month}月${day}日`;
        }
        
        if (weekdayElement) {
            const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            weekdayElement.textContent = weekdays[now.getDay()];
        }
    }

    //  初始化系统状态
    initSystemStatus() {
        this.systemData = {
            users: 0,
            systemLoad: 0,
            connectedVehicles: 0,
            dataThroughput: 0,
            responseTime: 0,
            errorRate: 0
        };
        this.updateSystemStatus();        
        this.updateSystemHealthIndicator();
        
        // 每5秒更新一次系统状态
        setInterval(() => {
            this.loadUserData();
            this.updateSystemStatus();
            this.updateSystemHealthIndicator();
        }, 5000);
    }

    //  初始化退出登录功能
    async initLogout() {
        const logoutBtn = document.querySelector('.action-btn.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    //  退出登录
    async handleLogout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
            });
            if (response.ok) {
                window.parent.location.href = '/login.html'; 
                // 清空localStorage
                localStorage.clear();
                alert('退出登录成功');
            }
        }
        catch (error) {
            console.error('退出登录失败:', error);
            alert('退出登录失败');
        }
    }

    updateSystemHealthIndicator() {
        const indicator = document.querySelector('.system-health-indicator');
        if (!indicator) return;

        const avgLoad = (this.systemData.systemLoad + this.systemData.errorRate * 100) / 2;
        
        indicator.className = 'system-health-indicator';
        if (avgLoad < 50) {
            indicator.classList.add('healthy');
        } else if (avgLoad < 80) {
            indicator.classList.add('warning');
        } else {
            indicator.classList.add('error');
        }
    }

    updateSystemStatus() {
        // // 模拟数据变化
        // this.systemData.users += Math.floor(Math.random() * 10 - 5);
        // this.systemData.systemLoad += Math.floor(Math.random() * 10 - 5);
        // this.systemData.connectedVehicles += Math.floor(Math.random() * 6 - 3);
        // this.systemData.dataThroughput += (Math.random() * 0.2 - 0.1);
        // this.systemData.responseTime += Math.floor(Math.random() * 4 - 2);
        // this.systemData.errorRate += (Math.random() * 0.01 - 0.005);

        // // 确保数据在合理范围内
        // this.systemData.users = Math.max(1000, Math.min(2000, this.systemData.users));
        // this.systemData.systemLoad = Math.max(30, Math.min(100, this.systemData.systemLoad));
        // this.systemData.connectedVehicles = Math.max(500, Math.min(1500, this.systemData.connectedVehicles));
        // this.systemData.dataThroughput = Math.max(1.0, Math.min(5.0, this.systemData.dataThroughput));
        // this.systemData.responseTime = Math.max(5, Math.min(50, this.systemData.responseTime));
        // this.systemData.errorRate = Math.max(0.001, Math.min(0.1, this.systemData.errorRate));

        console.log('系统状态更新:', this.systemData);
        // 更新显示
        const statusItems = document.querySelectorAll('.status-item');
        if (statusItems.length >= 6) {
            statusItems[0].querySelector('.status-value').textContent = this.systemData.users.toLocaleString();
            statusItems[1].querySelector('.status-value').textContent = `${this.systemData.systemLoad.toFixed(2)}%`;
            statusItems[2].querySelector('.status-value').textContent = this.systemData.connectedVehicles.toLocaleString();
            statusItems[3].querySelector('.status-value').textContent = `${this.systemData.dataThroughput.toFixed(1)}GB/s`;
            statusItems[4].querySelector('.status-value').textContent = `${this.systemData.responseTime.toFixed(2)}ms`;
            statusItems[5].querySelector('.status-value').textContent = `${(this.systemData.errorRate * 100).toFixed(3)}%`;
        }
    }

    //  初始化用户管理
    initUserManagement() {
        this.initEventListeners();

        this.getRoleIcon = (role) => {
            const icons = { driver: '🚗',
                passenger: '👤',
                admin: '👨‍💼',
                maintenance: '🔧'
            }
            if (role in icons) {
                return icons[role];
            }
        }
    
        this.getRoleName = (role) => {
            const names = { driver: '驾驶员',
                passenger: '乘客',
                admin: '系统管理员',
                maintenance: '维修人员'
            }
            if (role in names) {
                return names[role];
            }
        }
        this.getStatusName = (status) => {
            const names = { online: '在线',
                offline: '离线'
            }
            if (status in names) {
                return names[status];
            }
        }
    }
    
    renderUserList(users) {
        const userList = document.querySelector('.user-list');
        userList.innerHTML = users.map(user => `
            <div class="user-item ${user.role}" data-id="${user.id}">
                <div class="user-avatar">${this.getRoleIcon(user.role)}</div>
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-role">${this.getRoleName(user.role)}</div>
                    <div class="user-last-login">最后登录: ${user.last_login}</div>
                </div>
                <div class="user-status ${user.status}">${this.getStatusName(user.status)}</div>
                <div class="user-actions">
                    <button class="action-btn edit"">编辑</button>
                    <button class="action-btn delete"">删除</button>
                </div>
            </div>
        `).join('');
    }

    initEventListeners() {
        const addUserBtn = document.querySelector('.add-user-btn');

        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserDialog());
        }

        // 动态生成编辑、删除按钮，使用事件委托监听点击事件
        document.querySelector('.user-list').addEventListener('click', (e) => {
            if (e.target.closest('.action-btn.edit')) {
                this.showEditUserDialog(e);
            }
            if (e.target.closest('.action-btn.delete')) {
                this.deleteUser(e);
            }
        });
    }

    showAddUserDialog() {
        const userName = prompt('请输入新的用户名:');
        if (userName) {
            const userRole = prompt('请选择用户角色:\n1. 驾驶员\n2. 乘客\n3. 系统管理员\n4. 维修人员\n请输入数字:');
            if (userRole && userRole >= 1 && userRole <= 4) {
                this.addNewUser(userName, userRole);
            }
        }
    }

    async addNewUser(name, roleNum) {
        try {
            const role = ['driver', 'passenger', 'admin', 'maintenance'][roleNum-1];
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    username: name,
                    role: role
                })
            });
            const data = await response.json();
            if (response.ok) {
                await this.loadUserData();
                console.log('用户添加成功');
                this.showNotification('用户添加成功', 'success');
            } else {
                console.error('添加用户失败:', data.error);
                this.showNotification(`添加用户失败: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('添加用户失败', 'error');
            console.error('添加用户失败:', error);
        }
    }

    showEditUserDialog(event) {
        const userId = event.target.closest('.user-item').dataset.id;
        const userName = prompt('请输入新的用户名:');
        if (userName) {
            const userType = prompt('请选择用户权限:\n1. 普通用户\n2. 特权用户\n请输入数字:');
            if (userType && userType >= 1 && userType <= 2) {
                this.editUser(userId, userName, userType);
            }
        }
    }

    async editUser(userId, userName, userType) {
        if (userId && userName && userType) {
            try {
                const response = await fetch(`/api/admin/manage_user/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        username: userName,
                        type: userType === '1' ? 'normal' : 'privileged'
                    })
                })
                const data = await response.json();
                if (response.ok) {
                    const userItem = document.querySelector(`.user-item[data-id="${userId}"]`);
                    if (userItem) {
                        userItem.querySelector('.user-name').textContent = userName;
                    }
                    console.log('用户更新成功');
                    this.showNotification('用户更新成功','success');
                } else {
                    console.error('更新用户失败:', data.error);
                    this.showNotification(`更新用户失败: ${data.error}`, 'error');
                }
            }
            catch (error) {
                this.showNotification('更新用户失败', 'error');
                console.error('更新用户失败:', error.message || error);
            }
        }
    }

    async deleteUser(event) {
        const userId = event.target.closest('.user-item').dataset.id;
        if (!userId) {
            console.error('无法找到用户ID');
            return;
        }
        if (confirm('确定要删除用户吗？')) {
            try {
                const response = await fetch(`/api/admin/manage_user/${userId}`, {
                    method: 'DELETE',
                    headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
                });
                const data = await response.json();
                if (response.ok) {
                    event.target.closest('.user-item').remove();
                    console.log('用户删除成功');
                    this.showNotification('用户删除成功', 'warning');
                } else {
                    console.error('删除用户失败:', data.error);
                    this.showNotification(`删除用户失败: ${data.error}`, 'error');
                }
            } catch (error) {
                console.error('删除用户失败:', error);
                this.showNotification('删除用户失败', 'error');
            }
        }
    }

    updateUserStatus() {
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach(item => {
            const statusElement = item.querySelector('.user-status');
            if (Math.random() < 0.1) { // 10%概率改变状态
                if (statusElement.classList.contains('online')) {
                    statusElement.classList.remove('online');
                    statusElement.classList.add('offline');
                    statusElement.textContent = '离线';
                } else {
                    statusElement.classList.remove('offline');
                    statusElement.classList.add('online');
                    statusElement.textContent = '在线';
                }
            }
        });
    }

    //  初始化系统日志
    initSystemLogs() {
        const logFilter = document.querySelector('.log-level-filter');
        if (logFilter) {
            logFilter.addEventListener('change', (e) => this.filterLogs(e.target.value));
        }

        // 定期添加新日志
        setInterval(() => this.addRandomLog(), 10000);
    }

    filterLogs(level) {
        const logEntries = document.querySelectorAll('.log-entry');
        logEntries.forEach(entry => {
            if (level === 'all' || entry.classList.contains(level)) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    addRandomLog() {
        const logTypes = ['info', 'warning', 'error'];
        const messages = {
            info: [
                '系统健康检查通过',
                '定时备份任务完成',
                '用户认证成功',
                '数据同步完成',
                '服务重启成功'
            ],
            warning: [
                'CPU使用率较高',
                '内存使用率超过80%',
                '网络延迟异常',
                '磁盘空间不足',
                '连接数接近上限'
            ],
            error: [
                '数据库连接失败',
                '服务响应超时',
                '认证服务异常',
                '网络连接中断',
                '系统组件崩溃'
            ]
        };

        const type = logTypes[Math.floor(Math.random() * logTypes.length)];
        const message = messages[type][Math.floor(Math.random() * messages[type].length)];
        
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const logEntries = document.querySelector('.log-entries');
        if (!logEntries) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <div class="log-time">${timeStr}</div>
            <div class="log-level">${type.toUpperCase()}</div>
            <div class="log-message">${message}</div>
        `;

        logEntries.insertBefore(logEntry, logEntries.firstChild);

        // 限制日志数量
        const allLogs = logEntries.querySelectorAll('.log-entry');
        if (allLogs.length > 50) {
            allLogs[allLogs.length - 1].remove();
        }
    }

    //  初始化控制面板
    initControlPanel() {
        // 系统操作按钮
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSystemControl(e));
        });

        // 服务开关
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', (e) => this.handleServiceToggle(e));
        });

        // 数据管理按钮
        document.querySelectorAll('.data-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDataOperation(e));
        });
    }

    handleSystemControl(event) {
        const btnText = event.currentTarget.querySelector('.btn-text').textContent;
        
        switch(btnText) {
            case '重启系统':
                if (confirm('确定要重启系统吗？这将影响所有在线用户。')) {
                    this.showNotification('系统重启指令已发送', 'warning');
                    this.simulateSystemRestart();
                }
                break;
            case '系统备份':
                this.showNotification('系统备份已开始', 'info');
                this.simulateBackup();
                break;
            case '安全模式':
                this.showNotification('系统已切换到安全模式', 'warning');
                break;
            case '紧急停机':
                if (confirm('确定要紧急停机吗？这是不可逆操作！')) {
                    this.showNotification('紧急停机指令已发送', 'error');
                }
                break;
        }
    }

    handleServiceToggle(event) {
        const serviceItem = event.target.closest('.service-control-item');
        const serviceName = serviceItem.querySelector('.service-name').textContent;
        const isEnabled = event.target.checked;
        
        this.showNotification(
            `${serviceName} 已${isEnabled ? '启用' : '禁用'}`, 
            isEnabled ? 'success' : 'warning'
        );

        // 更新对应的服务状态显示
        this.updateServiceStatus(serviceName, isEnabled);
    }

    updateServiceStatus(serviceName, isEnabled) {
        const serviceItems = document.querySelectorAll('.service-item');
        serviceItems.forEach(item => {
            const name = item.querySelector('.service-name').textContent;
            if (name.includes(serviceName.replace('服务', ''))) {
                const status = item.querySelector('.service-status');
                if (isEnabled) {
                    status.className = 'service-status online';
                    status.textContent = '运行中';
                    item.className = 'service-item active';
                } else {
                    status.className = 'service-status offline';
                    status.textContent = '已停止';
                    item.className = 'service-item error';
                }
            }
        });
    }

    handleDataOperation(event) {
        const btnText = event.currentTarget.querySelector('.btn-text').textContent;
        
        switch(btnText) {
            case '生成报告':
                this.showNotification('正在生成系统报告...', 'info');
                setTimeout(() => {
                    this.showNotification('系统报告生成完成', 'success');
                }, 3000);
                break;
            case '数据归档':
                this.showNotification('数据归档任务已启动', 'info');
                break;
            case '清理缓存':
                this.showNotification('缓存清理完成', 'success');
                break;
        }
    }

    simulateSystemRestart() {
        const indicator = document.querySelector('.system-health-indicator');
        if (indicator) {
            indicator.classList.add('scanning');
            setTimeout(() => {
                indicator.classList.remove('scanning');
                this.showNotification('系统重启完成', 'success');
            }, 5000);
        }
    }

    simulateBackup() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            this.showNotification(`备份进度: ${progress}%`, 'info');
            if (progress >= 100) {
                clearInterval(interval);
                this.showNotification('系统备份完成', 'success');
            }
        }, 500);
    }

    // 初始化资源图表
    initResourceCharts() {
        this.createCPUChart();
        this.createMemoryChart();
        
        // 每2秒更新图表数据
        setInterval(() => this.updateCharts(), 2000);
    }

    createCPUChart() {
        const canvas = document.getElementById('cpu-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.chartInstances.cpu = {
            canvas: canvas,
            ctx: ctx,
            data: Array(20).fill(0).map(() => Math.random() * 100)
        };
        
        this.drawChart(this.chartInstances.cpu, '#2196f3');
    }

    createMemoryChart() {
        const canvas = document.getElementById('memory-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.chartInstances.memory = {
            canvas: canvas,
            ctx: ctx,
            data: Array(20).fill(0).map(() => Math.random() * 100)
        };
        
        this.drawChart(this.chartInstances.memory, '#4caf50');
    }

    drawChart(chart, color) {
        const { ctx, canvas, data } = chart;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // 绘制网格
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 绘制数据线
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = (width / (data.length - 1)) * index;
            const y = height - (value / 100) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 填充区域
        ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
    }

    updateCharts() {
        // 更新CPU图表
        if (this.chartInstances.cpu) {
            this.chartInstances.cpu.data.shift();
            this.chartInstances.cpu.data.push(this.systemData.systemLoad + Math.random() * 20 - 10);
            this.drawChart(this.chartInstances.cpu, '#2196f3');
        }
        
        // 更新内存图表
        if (this.chartInstances.memory) {
            this.chartInstances.memory.data.shift();
            this.chartInstances.memory.data.push(Math.random() * 100);
            this.drawChart(this.chartInstances.memory, '#4caf50');
        }
    }

    // 开始数据更新
    startDataUpdates() {
        // 每分钟更新一次多模态服务状态
        setInterval(() => this.updateServiceLoad(), 60000);
    }

    updateServiceLoad() {
        const serviceItems = document.querySelectorAll('.service-item');
        serviceItems.forEach(item => {
            const loadElement = item.querySelector('.service-load');
            if (loadElement) {
                const currentText = loadElement.textContent;
                if (currentText.includes('CPU:')) {
                    const newLoad = Math.floor(Math.random() * 50 + 30);
                    loadElement.textContent = `CPU: ${newLoad}%`;
                    
                    // 根据负载更新状态
                    if (newLoad > 85) {
                        item.className = 'service-item warning';
                        item.querySelector('.service-status').className = 'service-status warning';
                        item.querySelector('.service-status').textContent = '高负载';
                    } else {
                        item.className = 'service-item active';
                        item.querySelector('.service-status').className = 'service-status online';
                        item.querySelector('.service-status').textContent = '运行中';
                    }
                } else if (currentText.includes('GPU:')) {
                    const newLoad = Math.floor(Math.random() * 40 + 50);
                    loadElement.textContent = `GPU: ${newLoad}%`;
                }
            }
        });
    }

    // 通知系统
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10000',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '250px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
            backgroundColor: this.getNotificationColor(type)
        });
        
        document.body.appendChild(notification);
        
        // 动画显示
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196f3'
        };
        return colors[type] || colors.info;
    }

    // 销毁方法
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // 清理图表实例
        Object.values(this.chartInstances).forEach(chart => {
            if (chart.ctx) {
                chart.ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
            }
        });
        
        console.log('车载系统管理员界面已销毁');
    }
}

// 全局变量
let adminScreen = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    adminScreen = new AdminScreenController();
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (adminScreen) {
        adminScreen.destroy();
    }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminScreenController;
}
