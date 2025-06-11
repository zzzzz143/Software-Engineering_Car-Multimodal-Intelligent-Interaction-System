// 维修界面管理类
class MaintenanceScreen {
    constructor() {
        this.diagnosticProgress = 75;
        this.isScanning = false;
        this.logs = [];
        this.systemStatus = {
            cpu: 45,
            memory: 62,
            network: 'online'
        };
        this.vehicleInfo = {
            plateNumber: '京A12345',
            model: 'Model Y',
            mileage: '25,680 km'
        };
        this.init();
    }

    init() {
        this.initEventListeners(); // 初始化事件监听器
        this.initSystemMonitoring(); // 初始化系统监控
        this.initDiagnosticSystem(); // 初始化诊断系统
        this.loadMaintenanceLogs(); // 加载维修日志
        this.initVehicleInteraction(); // 初始化车辆交互
        console.log('维修界面初始化完成');
    }

    // 初始化事件监听器
    initEventListeners() {
        // 退出登录按钮
        const logoutBtn = document.querySelector('.action-btn.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // 日志按钮
        const addLogBtn = document.querySelector('.add-log-btn');
        if (addLogBtn) {
            addLogBtn.addEventListener('click', () => this.showAddLogModal());
        }

        // 日志条目点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.log-entry')) {
                this.showLogDetails(e.target.closest('.log-entry'));
            }
        });

        // 部件指示器点击事件
        const partIndicators = document.querySelectorAll('.part-indicator');
        partIndicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => this.showPartDetails(e.target.closest('.part-indicator')));
        });

        // 快速操作按钮
        const startDiagnosticBtn = document.querySelector('.action-btn.primary');
        if (startDiagnosticBtn) {
            startDiagnosticBtn.addEventListener('click', () => this.startDiagnostic());
        }

        const historyBtn = document.querySelectorAll('.action-btn.secondary')[0];
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistory());
        }

        const reportBtn = document.querySelectorAll('.action-btn.secondary')[1];
        if (reportBtn) {
            reportBtn.addEventListener('click', () => this.generateReport());
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

    // 初始化系统监控
    initSystemMonitoring() {
        // 模拟系统资源变化
        setInterval(() => {
            this.updateSystemStatus();
        }, 3000);
    }

    // 更新系统状态
    updateSystemStatus() {
        // 模拟CPU使用率变化
        this.systemStatus.cpu = Math.max(20, Math.min(80, this.systemStatus.cpu + (Math.random() - 0.5) * 10));
        
        // 模拟内存使用变化
        this.systemStatus.memory = Math.max(30, Math.min(90, this.systemStatus.memory + (Math.random() - 0.5) * 8));

        // 更新显示
        this.updateMonitoringDisplay();
    }

    // 更新监控显示
    updateMonitoringDisplay() {
        const cpuValue = document.querySelector('.monitor-item:nth-child(1) .monitor-value');
        const cpuBar = document.querySelector('.monitor-item:nth-child(1) .bar-fill');
        const memoryValue = document.querySelector('.monitor-item:nth-child(2) .monitor-value');
        const memoryBar = document.querySelector('.monitor-item:nth-child(2) .bar-fill');

        if (cpuValue && cpuBar) {
            cpuValue.textContent = `${Math.round(this.systemStatus.cpu)}%`;
            cpuBar.style.width = `${this.systemStatus.cpu}%`;
        }

        if (memoryValue && memoryBar) {
            memoryValue.textContent = `${Math.round(this.systemStatus.memory)}%`;
            memoryBar.style.width = `${this.systemStatus.memory}%`;
        }
    }

    // 初始化诊断系统
    initDiagnosticSystem() {
        this.updateDiagnosticProgress();
    }

    // 开始诊断
    startDiagnostic() {
        if (this.isScanning) {
            this.showNotification('诊断正在进行中...', 'warning');
            return;
        }

        this.isScanning = true;
        this.diagnosticProgress = 0;
        
        // 更新按钮状态
        const startBtn = document.querySelector('.action-btn.primary');
        if (startBtn) {
            startBtn.textContent = '诊断中...';
            startBtn.disabled = true;
        }

        // 更新状态指示器
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.add('scanning');
        }

        // 模拟诊断进度
        const progressInterval = setInterval(() => {
            this.diagnosticProgress += Math.random() * 15;
            
            if (this.diagnosticProgress >= 100) {
                this.diagnosticProgress = 100;
                clearInterval(progressInterval);
                this.completeDiagnostic();
            }
            
            this.updateDiagnosticProgress();
        }, 500);

        this.showNotification('开始系统诊断...', 'info');
    }

    // 完成诊断
    completeDiagnostic() {
        this.isScanning = false;
        
        // 恢复按钮状态
        const startBtn = document.querySelector('.action-btn.primary');
        if (startBtn) {
            startBtn.textContent = '开始诊断';
            startBtn.disabled = false;
        }

        // 移除扫描状态
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.remove('scanning');
        }

        // 添加诊断完成日志
        this.addMaintenanceLog({
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            title: '系统诊断完成',
            description: '全面诊断已完成，发现2个需要关注的项目',
            status: 'completed'
        });

        this.showNotification('诊断完成！', 'success');
    }

    // 更新诊断进度
    updateDiagnosticProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');

        if (progressFill) {
            progressFill.style.width = `${this.diagnosticProgress}%`;
        }

        if (progressText) {
            progressText.textContent = `扫描进度: ${Math.round(this.diagnosticProgress)}%`;
        }
    }

    // 加载维修日志
    loadMaintenanceLogs() {
        // 模拟从服务器加载日志数据
        this.logs = [
            {
                id: 1,
                time: '14:20',
                title: '更换机油滤芯',
                description: '已完成机油滤芯更换，检查无泄漏',
                status: 'completed'
            },
            {
                id: 2,
                time: '13:45',
                title: '发动机故障诊断',
                description: '正在检查P0301故障码，疑似点火线圈问题',
                status: 'in-progress'
            },
            {
                id: 3,
                time: '13:30',
                title: '刹车系统检查',
                description: '待检查刹车片磨损情况',
                status: 'pending'
            }
        ];
    }

    // 添加维修日志
    addMaintenanceLog(logData) {
        const newLog = {
            id: Date.now(),
            ...logData
        };
        
        this.logs.unshift(newLog);
        this.renderLogEntry(newLog, true);
    }

    // 渲染日志条目
    renderLogEntry(log, prepend = false) {
        const logEntries = document.querySelector('.log-entries');
        if (!logEntries) return;

        const logElement = document.createElement('div');
        logElement.className = `log-entry ${log.status}`;
        logElement.dataset.logId = log.id;

        const statusEmoji = {
            'completed': '✅ 完成',
            'in-progress': '🔄 进行中',
            'pending': '⏳ 待处理'
        };

        logElement.innerHTML = `
            <div class="log-time">${log.time}</div>
            <div class="log-content">
                <div class="log-title">${log.title}</div>
                <div class="log-description">${log.description}</div>
            </div>
            <div class="log-status">${statusEmoji[log.status] || '❓ 未知'}</div>
        `;

        if (prepend) {
            logEntries.insertBefore(logElement, logEntries.firstChild);
        } else {
            logEntries.appendChild(logElement);
        }

        // 添加动画效果
        logElement.style.opacity = '0';
        logElement.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            logElement.style.transition = 'all 0.3s ease';
            logElement.style.opacity = '1';
            logElement.style.transform = 'translateX(0)';
        }, 100);
    }

    // 显示添加日志模态框
    showAddLogModal() {
        const title = prompt('请输入维修项目标题:');
        if (!title) return;

        const description = prompt('请输入详细描述:');
        if (!description) return;

        const now = new Date();
        const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

        this.addMaintenanceLog({
            time: time,
            title: title,
            description: description,
            status: 'pending'
        });

        this.showNotification('维修日志已添加', 'success');
    }

    // 显示日志详情
    showLogDetails(logElement) {
        const logId = logElement.dataset.logId;
        const log = this.logs.find(l => l.id == logId);
        
        if (log) {
            alert(`维修详情:\n标题: ${log.title}\n时间: ${log.time}\n描述: ${log.description}\n状态: ${log.status}`);
        }
    }

    // 初始化车辆交互
    initVehicleInteraction() {
        // 为车辆图片添加加载失败处理
        const carImage = document.querySelector('.car-image');
        if (carImage) {
            carImage.addEventListener('error', () => {
                carImage.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'car-placeholder';
                placeholder.innerHTML = `
                    <div style="
                        width: 300px; 
                        height: 200px; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 15px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 18px;
                        font-weight: bold;
                    ">
                        🚗 ${this.vehicleInfo.model}
                    </div>
                `;
                carImage.parentNode.insertBefore(placeholder, carImage);
            });
        }
    }

    // 显示部件详情
    showPartDetails(indicator) {
        const partName = indicator.querySelector('.indicator-label').textContent;
        const partClass = indicator.classList.contains('error') ? '故障' : 
                         indicator.classList.contains('warning') ? '警告' : '正常';
        
        let detailMessage = `部件: ${partName}\n状态: ${partClass}\n`;
        
        switch(partName) {
            case '发动机':
                detailMessage += '故障码: P0301\n建议: 检查点火线圈和火花塞';
                break;
            case '前刹车':
            case '后刹车':
                detailMessage += '磨损程度: 15%\n建议: 继续监控，磨损达到70%时更换';
                break;
            case '电池':
                detailMessage += '电量: 85%\n健康度: 良好\n预计寿命: 5年';
                break;
        }
        
        alert(detailMessage);
    }

    // 查看历史记录
    showHistory() {
        this.showNotification('正在加载历史记录...', 'info');
        // 这里可以实现历史记录查看功能
        setTimeout(() => {
            alert('历史维修记录:\n2024-05-15: 定期保养\n2024-04-20: 更换刹车片\n2024-03-10: 发动机检修');
        }, 1000);
    }

    // 生成报告
    generateReport() {
        this.showNotification('正在生成维修报告...', 'info');
        
        setTimeout(() => {
            const report = this.createMaintenanceReport();
            this.downloadReport(report);
            this.showNotification('报告生成完成', 'success');
        }, 2000);
    }

    // 创建维修报告
    createMaintenanceReport() {
        const now = new Date();
        const reportData = {
            vehicle: this.vehicleInfo,
            date: now.toLocaleDateString('zh-CN'),
            time: now.toLocaleTimeString('zh-CN'),
            diagnosticResults: [
                { item: '发动机', status: '故障', code: 'P0301', description: '点火线圈故障' },
                { item: '刹车系统', status: '警告', description: '刹车片磨损15%' },
                { item: '电池系统', status: '正常', description: '电池健康状态良好' }
            ],
            recommendations: [
                '建议更换发动机点火线圈',
                '继续监控刹车片磨损情况',
                '下次保养时间: 3个月后'
            ]
        };

        return reportData;
    }

    // 下载报告
    downloadReport(reportData) {
        const reportText = `
维修报告
========

车辆信息:
- 车牌号: ${reportData.vehicle.plateNumber}
- 车型: ${reportData.vehicle.model}
- 里程: ${reportData.vehicle.mileage}

检查时间: ${reportData.date} ${reportData.time}

诊断结果:
${reportData.diagnosticResults.map(result => 
    `- ${result.item}: ${result.status} ${result.code ? `(${result.code})` : ''}\n  ${result.description}`
).join('\n')}

维修建议:
${reportData.recommendations.map(rec => `- ${rec}`).join('\n')}

报告生成时间: ${new Date().toLocaleString('zh-CN')}
        `;

        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `维修报告_${reportData.vehicle.plateNumber}_${reportData.date.replace(/\//g, '')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
        `;

        // 根据类型设置背景色
        const colors = {
            'info': 'linear-gradient(135deg, #007bff, #0056b3)',
            'success': 'linear-gradient(135deg, #28a745, #1e7e34)',
            'warning': 'linear-gradient(135deg, #ffc107, #e0a800)',
            'error': 'linear-gradient(135deg, #dc3545, #c82333)'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 销毁方法
    destroy() {
        // 清理定时器和事件监听器
        console.log('维修界面已销毁');
    }
}

// 全局变量
let maintenanceScreen;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    maintenanceScreen = new MaintenanceScreen();
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', function() {
    if (maintenanceScreen) {
        maintenanceScreen.destroy();
    }
});