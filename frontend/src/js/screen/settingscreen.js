//--------------------------------滑动切换功能----------------------------------------
class SettingsSwiper {
    constructor() {
        this.container = document.querySelector('.swiper-container');
        this.wrapper = document.querySelector('.swiper-wrapper');
        this.slides = document.querySelectorAll('.swiper-slide');
        this.bullets = document.querySelectorAll('.pagination-bullet');
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;
        this.isTransitioning = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.isDragging = false;
        this.hasMoved = false; // 添加移动标记
        this.minSwipeDistance = 50; // 最小滑动距离
        this.dragThreshold = 10; // 拖动阈值，超过这个距离才算拖动
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updatePagination();
        this.updateSlidePosition();
        this.adjustContainerHeight();
        
        // 添加加载完成动画
        setTimeout(() => {
            this.container.classList.add('loaded');
        }, 100);
    }
    
    bindEvents() {
        // 分页点击事件
        this.bullets.forEach((bullet, index) => {
            bullet.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                this.goToSlide(index);
            });
        });
        
        // 触摸滑动事件
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // 鼠标滑动事件（桌面端）
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.container.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        // 键盘导航
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 防止默认的拖拽行为
        this.container.addEventListener('dragstart', (e) => e.preventDefault());
        
        // 防止点击事件触发滑动
        this.container.addEventListener('click', this.handleClick.bind(this));
    }
    
    // 处理点击事件
    handleClick(e) {
        // 如果发生了拖动，阻止点击事件
        if (this.hasMoved) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
    
    // 触摸事件处理
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchCurrentX = this.touchStartX;
        this.touchCurrentY = this.touchStartY;
        this.isDragging = false; // 初始时不是拖动状态
        this.hasMoved = false; // 重置移动标记
        this.wrapper.style.transition = 'none';
    }
    
    handleTouchMove(e) {
        this.touchCurrentX = e.touches[0].clientX;
        this.touchCurrentY = e.touches[0].clientY;
        
        const diffX = Math.abs(this.touchStartX - this.touchCurrentX);
        const diffY = Math.abs(this.touchStartY - this.touchCurrentY);
        
        // 只有当移动距离超过阈值时才开始拖动
        if (!this.isDragging && diffX > this.dragThreshold && diffX > diffY) {
            this.isDragging = true;
            this.hasMoved = true;
        }
        
        if (this.isDragging) {
            e.preventDefault(); // 阻止默认滚动
            
            const dragX = this.touchStartX - this.touchCurrentX;
            
            // 实时更新位置
            const currentTransform = -this.currentSlide * (100 / this.totalSlides);
            const dragOffset = -(dragX / this.container.offsetWidth) * (100 / this.totalSlides);
            const newTransform = Math.max(-100 * (this.totalSlides - 1) / this.totalSlides, 
                                Math.min(0, currentTransform + dragOffset));
            
            this.wrapper.style.transform = `translateX(${newTransform}%)`;
        }
    }
    
    handleTouchEnd(e) {
        // 恢复过渡动画
        this.wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        if (this.isDragging) {
            const diffX = this.touchStartX - this.touchCurrentX;
            
            // 判断滑动方向和距离
            if (Math.abs(diffX) > this.minSwipeDistance) {
                if (diffX > 0) {
                    // 向左滑动，显示下一页
                    this.nextSlide();
                } else {
                    // 向右滑动，显示上一页
                    this.prevSlide();
                }
            } else {
                // 滑动距离不够，回到当前页
                this.updateSlidePosition();
            }
        } else {
            // 没有拖动，保持当前位置
            this.updateSlidePosition();
        }
        
        this.isDragging = false;
        
        // 延迟重置移动标记，避免影响其他点击事件
        setTimeout(() => {
            this.hasMoved = false;
        }, 100);
    }
    
    // 鼠标事件处理（桌面端）
    handleMouseDown(e) {
        // 排除分页指示器的点击
        if (e.target.closest('.swiper-pagination')) {
            return;
        }
        
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.touchCurrentX = this.touchStartX;
        this.touchCurrentY = this.touchStartY;
        this.isDragging = false;
        this.hasMoved = false;
        this.wrapper.style.transition = 'none';
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        if (this.touchStartX === 0) return; // 没有按下鼠标
        
        this.touchCurrentX = e.clientX;
        this.touchCurrentY = e.clientY;
        
        const diffX = Math.abs(this.touchStartX - this.touchCurrentX);
        const diffY = Math.abs(this.touchStartY - this.touchCurrentY);
        
        // 只有当移动距离超过阈值时才开始拖动
        if (!this.isDragging && diffX > this.dragThreshold && diffX > diffY) {
            this.isDragging = true;
            this.hasMoved = true;
        }
        
        if (this.isDragging) {
            e.preventDefault();
            
            const dragX = this.touchStartX - this.touchCurrentX;
            
            const currentTransform = -this.currentSlide * (100 / this.totalSlides);
            const dragOffset = -(dragX / this.container.offsetWidth) * (100 / this.totalSlides);
            const newTransform = Math.max(-100 * (this.totalSlides - 1) / this.totalSlides, 
                                Math.min(0, currentTransform + dragOffset));
            
            this.wrapper.style.transform = `translateX(${newTransform}%)`;
        }
    }
    
    handleMouseUp(e) {
        if (this.touchStartX === 0) return; // 没有按下鼠标
        
        this.wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        if (this.isDragging) {
            const diffX = this.touchStartX - this.touchCurrentX;
            
            if (Math.abs(diffX) > this.minSwipeDistance) {
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            } else {
                this.updateSlidePosition();
            }
        } else {
            this.updateSlidePosition();
        }
        
        this.isDragging = false;
        this.touchStartX = 0; // 重置鼠标状态
        
        // 延迟重置移动标记
        setTimeout(() => {
            this.hasMoved = false;
        }, 100);
    }
    
    // 键盘导航
    handleKeyDown(e) {
        if (this.isTransitioning) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case '1':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case '2':
                e.preventDefault();
                this.goToSlide(1);
                break;
            case '3':
                e.preventDefault();
                this.goToSlide(2);
                break;
        }
    }
    
    // 切换到指定页面
    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide || index < 0 || index >= this.totalSlides) {
            return;
        }
        
        this.isTransitioning = true;
        this.currentSlide = index;
        
        this.updateSlidePosition();
        this.updatePagination();
        
        // 添加切换动画类
        this.wrapper.classList.add('transitioning');
        
        setTimeout(() => {
            this.isTransitioning = false;
            this.wrapper.classList.remove('transitioning');
        }, 500);
    }
    
    // 下一页
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }
    
    // 上一页
    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }
    
    // 更新滑块位置
    updateSlidePosition() {
        const translateX = -this.currentSlide * (100 / this.totalSlides);
        this.wrapper.style.transform = `translateX(${translateX}%)`;
    }
    
    // 更新分页指示器
    updatePagination() {
        this.bullets.forEach((bullet, index) => {
            if (index === this.currentSlide) {
                bullet.classList.add('active');
            } else {
                bullet.classList.remove('active');
            }
        });
    }
    
    // 动态高度调整
    adjustContainerHeight() {
        const windowHeight = window.innerHeight;
        
        // 设置容器高度为视口高度
        this.container.style.height = `${windowHeight}px`;
        
        // 确保主内容区域占满剩余空间
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.height = `${windowHeight}px`;
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            const newHeight = window.innerHeight;
            this.container.style.height = `${newHeight}px`;
            if (mainContent) {
                mainContent.style.height = `${newHeight}px`;
            }
        });
    }
    
    // 自动播放功能（可选）
    startAutoPlay(interval = 5000) {
        this.autoPlayInterval = setInterval(() => {
            if (!this.isDragging && !this.isTransitioning) {
                if (this.currentSlide < this.totalSlides - 1) {
                    this.nextSlide();
                } else {
                    this.goToSlide(0);
                }
            }
        }, interval);
    }
    
    // 停止自动播放
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    // 销毁实例
    destroy() {
        this.stopAutoPlay();
        // 移除事件监听器
        this.bullets.forEach((bullet, index) => {
            bullet.removeEventListener('click', () => this.goToSlide(index));
        });
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

// ---------------------------------------车辆信息部分-----------------------------------------
class VehicleInfoManager {
    constructor() {
        this.vehicleData = this.initializeVehicleData();
        this.updateInterval = null;
        this.isRealTimeMode = true;
    }

    // 初始化车辆数据
    initializeVehicleData() {
        return {
            // 基本车辆信息
            basicInfo: {
                name: "Tesla Model Y",
                plate: "沪A·88888",
                vin: "5YJ3E1EA4MF123456",
                location: "上海市浦东新区张江高科技园区",
                status: "online",
                image: "🚙"
            },
            
            // 快速状态信息
            quickStatus: {
                locked: { icon: "🔐", text: "已锁定", active: true },
                aircon: { icon: "❄️", text: "空调开启", active: true },
                parked: { icon: "🅿️", text: "已停车", active: true },
                sentry: { icon: "🛡️", text: "哨兵模式", active: true }
            },

            // 详细信息卡片数据
            infoCards: {
                battery: {
                    icon: "🔋",
                    label: "电池状态",
                    value: "85%",
                    status: "success",
                    description: "充电中 · 预计2小时",
                    details: {
                        chargingPower: "11 kW",
                        temperature: "28°C"
                    },
                    progressBar: 85
                },
                
                range: {
                    icon: "🛣️",
                    label: "续航里程",
                    value: "420 km",
                    status: "success",
                    description: "预估剩余"
                },
                
                totalMileage: {
                    icon: "📊",
                    label: "总里程",
                    value: "12,580 km",
                    description: "累计行驶"
                },
                
                monthlyMileage: {
                    icon: "📈",
                    label: "本月里程",
                    value: "1,245 km",
                    description: "较上月+15%"
                },
                
                energyConsumption: {
                    icon: "⚡",
                    label: "平均能耗",
                    value: "15.8 kWh",
                    status: "success",
                    description: "每100公里"
                },
                
                ecoScore: {
                    icon: "🌱",
                    label: "节能评分",
                    value: "92分",
                    description: "优秀驾驶"
                },
                
                softwareVersion: {
                    icon: "💾",
                    label: "软件版本",
                    value: "2024.8.7",
                    status: "success",
                    description: "最新版本"
                },
                
                systemUpdate: {
                    icon: "🔄",
                    label: "系统更新",
                    value: "可用",
                    status: "info",
                    description: "2024.9.1"
                },
                
                maintenance: {
                    icon: "🔧",
                    label: "上次保养",
                    value: "70天前",
                    status: "warning",
                    description: "建议保养"
                },
                
                tirePressure: {
                    icon: "🛞",
                    label: "轮胎压力",
                    value: "正常",
                    status: "success",
                    description: "2.4 bar"
                },
                
                insurance: {
                    icon: "🛡️",
                    label: "保险状态",
                    value: "有效",
                    status: "success",
                    description: "至2025年3月"
                },
                
                security: {
                    icon: "🔒",
                    label: "防盗系统",
                    value: "正常",
                    status: "success",
                    description: "已激活"
                },
                
                interiorTemp: {
                    icon: "🌡️",
                    label: "车内温度",
                    value: "22°C",
                    description: "舒适范围"
                },
                
                exteriorTemp: {
                    icon: "🌤️",
                    label: "外部温度",
                    value: "28°C",
                    description: "晴朗天气"
                },
                
                network: {
                    icon: "📶",
                    label: "网络连接",
                    value: "4G",
                    status: "success",
                    description: "信号强度良好"
                },
                
                gps: {
                    icon: "🛰️",
                    label: "GPS定位",
                    value: "精确",
                    status: "success",
                    description: "8颗卫星"
                },
                
                dailyUsage: {
                    icon: "⏱️",
                    label: "今日使用",
                    value: "2.5小时",
                    description: "行驶时间"
                },
                
                drivingMode: {
                    icon: "🚗",
                    label: "行驶模式",
                    value: "舒适",
                    description: "当前模式"
                },
                
                systemDiagnostic: {
                    icon: "🔍",
                    label: "系统诊断",
                    value: "正常",
                    status: "success",
                    description: "无故障代码"
                },
                
                checkItems: {
                    icon: "📋",
                    label: "检查项目",
                    value: "12/12",
                    description: "通过检查"
                }
            },
            
            // 充电历史数据
            chargingHistory: [
                {
                    time: "今天 14:30",
                    location: "家用充电桩",
                    amount: "+45%"
                },
                {
                    time: "昨天 09:15",
                    location: "超级充电站",
                    amount: "+80%"
                }
            ]
        };
    }

    // 渲染车辆基本信息
    renderBasicInfo() {
        const basicInfo = this.vehicleData.basicInfo;
        
        const vehicleName = document.querySelector('.vehicle-name');
        const vehiclePlate = document.querySelector('.vehicle-plate');
        const vehicleVin = document.querySelector('.vehicle-vin');
        const vehicleLocation = document.querySelector('.vehicle-location');
        const carIcon = document.querySelector('.car-icon');
        const panelBadge = document.querySelector('.panel-badge');
        const statusDot = document.querySelector('.status-dot');
        
        if (vehicleName) vehicleName.textContent = basicInfo.name;
        if (vehiclePlate) vehiclePlate.textContent = basicInfo.plate;
        if (vehicleVin) vehicleVin.textContent = `VIN: ${basicInfo.vin}`;
        if (vehicleLocation) vehicleLocation.textContent = `📍 ${basicInfo.location}`;
        if (carIcon) carIcon.textContent = basicInfo.image;
        if (panelBadge) panelBadge.textContent = basicInfo.status === 'online' ? '在线' : '离线';
        
        // 更新状态点
        if (statusDot) {
            statusDot.className = `status-dot ${basicInfo.status === 'online' ? 'active' : 'inactive'}`;
        }
    }

    // 渲染快速状态栏
    renderQuickStatus() {
        const statusContainer = document.querySelector('.quick-status');
        if (!statusContainer) return;
        
        const quickStatus = this.vehicleData.quickStatus;
        statusContainer.innerHTML = '';
        
        Object.values(quickStatus).forEach(status => {
            const statusItem = document.createElement('div');
            statusItem.className = `status-item ${status.active ? 'active' : 'inactive'}`;
            statusItem.innerHTML = `
                <div class="status-icon">${status.icon}</div>
                <div class="status-text">${status.text}</div>
            `;
            statusContainer.appendChild(statusItem);
        });
    }

    // 渲染信息卡片
    renderInfoCards() {
        const infoGrid = document.querySelector('.info-grid');
        if (!infoGrid) return;
        
        const infoCards = this.vehicleData.infoCards;
        
        // 清空现有内容
        infoGrid.innerHTML = '';
        
        // 渲染电池卡片（大卡片）
        this.renderBatteryCard(infoGrid, infoCards.battery);
        
        // 渲染其他普通卡片
        Object.entries(infoCards).forEach(([key, card]) => {
            if (key !== 'battery') {
                this.renderInfoCard(infoGrid, card);
            }
        });
        
        // 渲染充电历史卡片
        this.renderChargingHistoryCard(infoGrid);
    }

    // 渲染电池卡片
    renderBatteryCard(container, batteryData) {
        const batteryCard = document.createElement('div');
        batteryCard.className = `info-card large-card`;
        batteryCard.setAttribute('data-status', batteryData.status);
        
        batteryCard.innerHTML = `
            <div class="info-header">
                <div class="info-icon">${batteryData.icon}</div>
                <div class="info-label">${batteryData.label}</div>
            </div>
            <div class="info-value">${batteryData.value}</div>
            <div class="info-bar">
                <div class="bar-fill" style="width: ${batteryData.progressBar}%"></div>
            </div>
            <div class="info-desc">${batteryData.description}</div>
            <div class="battery-details">
                <div class="battery-item">
                    <span>充电功率</span>
                    <span>${batteryData.details.chargingPower}</span>
                </div>
                <div class="battery-item">
                    <span>电池温度</span>
                    <span>${batteryData.details.temperature}</span>
                </div>
            </div>
        `;
        
        container.appendChild(batteryCard);
    }

    // 渲染普通信息卡片
    renderInfoCard(container, cardData) {
        const infoCard = document.createElement('div');
        infoCard.className = 'info-card';
        if (cardData.status) {
            infoCard.setAttribute('data-status', cardData.status);
        }
        
        infoCard.innerHTML = `
            <div class="info-header">
                <div class="info-icon">${cardData.icon}</div>
                <div class="info-label">${cardData.label}</div>
            </div>
            <div class="info-value">${cardData.value}</div>
            <div class="info-desc">${cardData.description}</div>
        `;
        
        container.appendChild(infoCard);
    }

    // 渲染充电历史卡片
    renderChargingHistoryCard(container) {
        const historyCard = document.createElement('div');
        historyCard.className = 'info-card large-card';
        
        const historyItems = this.vehicleData.chargingHistory.map(item => `
            <div class="history-item">
                <div class="history-time">${item.time}</div>
                <div class="history-location">${item.location}</div>
                <div class="history-amount">${item.amount}</div>
            </div>
        `).join('');
        
        historyCard.innerHTML = `
            <div class="info-header">
                <div class="info-icon">🔌</div>
                <div class="info-label">充电历史</div>
            </div>
            <div class="charging-history">
                ${historyItems}
            </div>
        `;
        
        container.appendChild(historyCard);
    }

    // 初始化渲染所有内容
    initializeVehiclePanel() {
        this.renderBasicInfo();
        this.renderQuickStatus();
        this.renderInfoCards();
        this.setupActionButtons();
        
        // 启动实时更新
        if (this.isRealTimeMode) {
            this.startRealTimeUpdates();
        }
    }

    // 设置操作按钮事件
    setupActionButtons() {
        const refreshBtn = document.querySelector('.action-btn.primary');
        const reportBtn = document.querySelectorAll('.action-btn.secondary')[0];
        const maintenanceBtn = document.querySelectorAll('.action-btn.secondary')[1];
        
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshVehicleData());
        if (reportBtn) reportBtn.addEventListener('click', () => this.showDetailedReport());
        if (maintenanceBtn) maintenanceBtn.addEventListener('click', () => this.scheduleMaintenace());
    }

    // 刷新车辆数据
    async refreshVehicleData() {
        try {
            this.showLoadingState();
            await this.fetchLatestVehicleData();
            this.initializeVehiclePanel();
            this.showNotification('数据刷新成功', 'success');
        } catch (error) {
            console.error('刷新数据失败:', error);
            this.showNotification('数据刷新失败', 'error');
        }
    }

    // 模拟获取最新车辆数据
    async fetchLatestVehicleData() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.vehicleData.infoCards.battery.value = `${Math.floor(Math.random() * 20) + 80}%`;
                this.vehicleData.infoCards.range.value = `${Math.floor(Math.random() * 100) + 350} km`;
                this.vehicleData.infoCards.interiorTemp.value = `${Math.floor(Math.random() * 6) + 20}°C`;
                resolve();
            }, 1000);
        });
    }

    // 启动实时更新
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateRealTimeData();
        }, 30000);
    }

    // 更新实时数据
    updateRealTimeData() {
        const currentBattery = parseInt(this.vehicleData.infoCards.battery.value);
        if (currentBattery < 100) {
            this.vehicleData.infoCards.battery.value = `${currentBattery + 1}%`;
            this.vehicleData.infoCards.battery.progressBar = currentBattery + 1;
        }
        
        const tempVariation = Math.random() * 2 - 1;
        const currentTemp = parseInt(this.vehicleData.infoCards.interiorTemp.value);
        this.vehicleData.infoCards.interiorTemp.value = `${Math.round(currentTemp + tempVariation)}°C`;
        
        this.renderInfoCards();
    }

    // 显示加载状态
    showLoadingState() {
        const refreshBtn = document.querySelector('.action-btn.primary .btn-text');
        if (refreshBtn) {
            refreshBtn.textContent = '刷新中...';
            refreshBtn.parentElement.disabled = true;
        }
    }

    // 显示详细报告
    showDetailedReport() {
        const reportData = this.generateDetailedReport();
        console.log('详细报告:', reportData);
        this.showNotification('正在生成详细报告...', 'info');
    }

    // 预约保养
    scheduleMaintenace() {
        this.showNotification('正在跳转到保养预约页面...', 'info');
    }

    // 生成详细报告
    generateDetailedReport() {
        return {
            reportDate: new Date().toISOString(),
            vehicleInfo: this.vehicleData.basicInfo,
            performanceMetrics: {
                batteryHealth: '优秀',
                energyEfficiency: '92%',
                systemStatus: '正常',
                maintenanceScore: '良好'
            },
            recommendations: [
                '建议在70天内进行常规保养',
                '轮胎压力正常，继续保持',
                '电池状态良好，充电习惯优秀'
            ]
        };
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 停止实时更新
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // 获取特定信息
    getVehicleInfo(category) {
        switch (category) {
            case 'basic':
                return this.vehicleData.basicInfo;
            case 'status':
                return this.vehicleData.quickStatus;
            case 'battery':
                return this.vehicleData.infoCards.battery;
            case 'all':
                return this.vehicleData;
            default:
                return null;
        }
    }

    // 更新特定数据 - 增强版本，支持深度合并
    updateVehicleData(category, newData) {
        try {
            switch (category) {
                case 'basic':
                    this.vehicleData.basicInfo = { ...this.vehicleData.basicInfo, ...newData };
                    this.renderBasicInfo();
                    break;
                case 'status':
                    // 深度合并快速状态数据
                    Object.keys(newData).forEach(key => {
                        if (this.vehicleData.quickStatus[key]) {
                            this.vehicleData.quickStatus[key] = { 
                                ...this.vehicleData.quickStatus[key], 
                                ...newData[key] 
                            };
                        } else {
                            this.vehicleData.quickStatus[key] = newData[key];
                        }
                    });
                    this.renderQuickStatus();
                    break;
                case 'cards':
                    // 深度合并信息卡片数据
                    Object.keys(newData).forEach(key => {
                        if (this.vehicleData.infoCards[key]) {
                            this.vehicleData.infoCards[key] = { 
                                ...this.vehicleData.infoCards[key], 
                                ...newData[key] 
                            };
                        } else {
                            this.vehicleData.infoCards[key] = newData[key];
                        }
                    });
                    this.renderInfoCards();
                    break;
            }
            
            // 触发自定义事件通知数据更新
            this.dispatchUpdateEvent(category, newData);
            
        } catch (error) {
            console.error('更新车辆数据时出错:', error);
        }
    }

    // 触发数据更新事件
    dispatchUpdateEvent(category, data) {
        const event = new CustomEvent('vehicleDataUpdated', {
            detail: { category, data, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }
}

// ---------------------------------------车内控制板块-----------------------------------------
class VehicleControlManager {
    constructor(vehicleInfoManagerInstance = null) {
        this.controlData = this.initializeControlData();
        this.vehicleInfoManager = vehicleInfoManagerInstance;
        this.eventListeners = new Map();
        this.animationDuration = 300;
        
        // 如果没有传入实例，尝试从全局获取
        if (!this.vehicleInfoManager) {
            // 延迟获取，确保实例已创建
            setTimeout(() => {
                this.vehicleInfoManager = window.vehicleInfoManager;
            }, 100);
        }
    }

    // 初始化控制数据
    initializeControlData() {
        return {
            // 温度控制
            climate: {
                currentTemp: 22,
                targetTemp: 24,
                mode: 'auto',
                status: '舒适',
                isActive: true
            },
            
            // 空调系统
            airCondition: {
                power: true,
                autoMode: true,
                internalCirculation: false,
                seatHeating: false,
                fanSpeed: 3,
                mode: 'cool'
            },
            
            // 安全系统
            security: {
                sentryMode: false,
                autoLock: true,
                antiTheft: true,
                securityEnabled: true
            },
            
            // 网络连接
            network: {
                wifi: {
                    connected: true,
                    ssid: 'Tesla_WiFi_5G',
                    signal: 'strong',
                    availableNetworks: [
                        { ssid: 'Home_WiFi', type: 'WPA2', strength: 3 },
                        { ssid: 'Office_5G', type: 'WPA3', strength: 2 }
                    ]
                },
                bluetooth: true,
                mobileHotspot: false,
                connectionType: '5G'
            },
            
            // 设备状态
            deviceStatus: {
                onlineDevices: 6,
                totalDevices: 8
            }
        };
    }

    // 初始化车内控制面板
    initializeControlPanel() {
        this.renderTemperatureControl();
        this.renderAirConditionControls();
        this.renderSecurityControls();
        this.renderNetworkControls();
        this.setupEventListeners();
        this.updatePanelStatus();
    }

    // 渲染温度控制
    renderTemperatureControl() {
        const currentTempElement = document.querySelector('.temp-value');
        const targetTempElement = document.querySelector('.target-value');
        const tempStatusElement = document.querySelector('.temp-status');
        const sectionStatusElement = document.querySelector('.section-status');
        
        if (currentTempElement) currentTempElement.textContent = this.controlData.climate.currentTemp;
        if (targetTempElement) targetTempElement.textContent = this.controlData.climate.targetTemp;
        if (tempStatusElement) tempStatusElement.textContent = this.controlData.climate.status;
        if (sectionStatusElement) sectionStatusElement.textContent = this.controlData.climate.mode === 'auto' ? '自动模式' : '手动模式';
    }

    // 渲染空调控制
    renderAirConditionControls() {
        const acControls = this.controlData.airCondition;
        
        this.updateToggleSwitch('ac-power', acControls.power);
        this.updateToggleSwitch('ac-auto', acControls.autoMode);
        this.updateToggleSwitch('ac-recirculate', acControls.internalCirculation);
        this.updateToggleSwitch('seat-heat', acControls.seatHeating);
    }

    // 渲染安全控制
    renderSecurityControls() {
        const securityControls = this.controlData.security;
        
        this.updateToggleSwitch('sentry-mode', securityControls.sentryMode);
        this.updateToggleSwitch('auto-lock', securityControls.autoLock);
        this.updateToggleSwitch('alarm', securityControls.antiTheft);
        
        const securityIndicator = document.querySelector('.security-indicator');
        if (securityIndicator) {
            securityIndicator.textContent = securityControls.securityEnabled ? '已启用' : '已禁用';
            securityIndicator.className = `security-indicator ${securityControls.securityEnabled ? 'active' : 'inactive'}`;
        }
    }

    // 渲染网络控制
    renderNetworkControls() {
        const networkData = this.controlData.network;
        
        const wifiName = document.querySelector('.wifi-name');
        const wifiSignal = document.querySelector('.wifi-signal');
        const networkStatus = document.querySelector('.network-status');
        
        if (wifiName) wifiName.textContent = networkData.wifi.ssid;
        if (wifiSignal) wifiSignal.textContent = `信号强度: ${this.getSignalText(networkData.wifi.signal)}`;
        if (networkStatus) networkStatus.textContent = `${networkData.connectionType}已连接`;
        
        this.updateToggleSwitch('hotspot', networkData.mobileHotspot);
        this.updateToggleSwitch('bluetooth', networkData.bluetooth);
        
        this.renderWifiList();
    }

    // 渲染WiFi列表
    renderWifiList() {
        const wifiList = document.querySelector('.wifi-list');
        if (!wifiList) return;
        
        wifiList.innerHTML = '';
        
        this.controlData.network.wifi.availableNetworks.forEach(network => {
            const wifiItem = document.createElement('div');
            wifiItem.className = 'wifi-item';
            wifiItem.innerHTML = `
                <div class="wifi-details">
                    <span class="wifi-ssid">${network.ssid}</span>
                    <span class="wifi-type">${network.type}</span>
                </div>
                <span class="wifi-strength">${'📶'.repeat(network.strength)}</span>
            `;
            wifiList.appendChild(wifiItem);
        });
    }

    // 设置事件监听器
    setupEventListeners() {
        this.setupTemperatureControls();
        this.setupAirConditionControls();
        this.setupSecurityControls();
        this.setupNetworkControls();
    }

    // 设置温度控制事件
    setupTemperatureControls() {
        const decreaseBtn = document.querySelector('.temp-btn.decrease');
        const increaseBtn = document.querySelector('.temp-btn.increase');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => this.adjustTemperature(-1));
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => this.adjustTemperature(1));
        }
    }

    // 设置空调控制事件
    setupAirConditionControls() {
        const acPowerSwitch = document.querySelector('[data-control="ac-power"]');
        const acAutoSwitch = document.querySelector('[data-control="ac-auto"]');
        const acRecirculateSwitch = document.querySelector('[data-control="ac-recirculate"]');
        const seatHeatSwitch = document.querySelector('[data-control="seat-heat"]');
        
        if (acPowerSwitch) {
            acPowerSwitch.addEventListener('click', () => this.toggleAirCondition('power'));
        }
        
        if (acAutoSwitch) {
            acAutoSwitch.addEventListener('click', () => this.toggleAirCondition('autoMode'));
        }
        
        if (acRecirculateSwitch) {
            acRecirculateSwitch.addEventListener('click', () => this.toggleAirCondition('internalCirculation'));
        }
        
        if (seatHeatSwitch) {
            seatHeatSwitch.addEventListener('click', () => this.toggleAirCondition('seatHeating'));
        }
    }

    // 设置安全控制事件
    setupSecurityControls() {
        const sentryModeSwitch = document.querySelector('[data-control="sentry-mode"]');
        const autoLockSwitch = document.querySelector('[data-control="auto-lock"]');
        const alarmSwitch = document.querySelector('[data-control="alarm"]');
        
        if (sentryModeSwitch) {
            sentryModeSwitch.addEventListener('click', () => this.toggleSecurity('sentryMode'));
        }
        
        if (autoLockSwitch) {
            autoLockSwitch.addEventListener('click', () => this.toggleSecurity('autoLock'));
        }
        
        if (alarmSwitch) {
            alarmSwitch.addEventListener('click', () => this.toggleSecurity('antiTheft'));
        }
    }

    // 设置网络控制事件
    setupNetworkControls() {
        const hotspotSwitch = document.querySelector('[data-control="hotspot"]');
        const bluetoothSwitch = document.querySelector('[data-control="bluetooth"]');
        
        if (hotspotSwitch) {
            hotspotSwitch.addEventListener('click', () => this.toggleNetwork('mobileHotspot'));
        }
        
        if (bluetoothSwitch) {
            bluetoothSwitch.addEventListener('click', () => this.toggleNetwork('bluetooth'));
        }
    }

    // 调整温度
    adjustTemperature(delta) {
        const newTemp = this.controlData.climate.targetTemp + delta;
        
        if (newTemp >= 16 && newTemp <= 30) {
            this.controlData.climate.targetTemp = newTemp;
            
            const targetTempElement = document.querySelector('.target-value');
            if (targetTempElement) {
                this.animateValueChange(targetTempElement, newTemp);
            }
            
            this.updateTemperatureStatus();
            this.sendVehicleCommand('climate', 'setTemperature', { temperature: newTemp });
            this.showNotification(`目标温度已设置为 ${newTemp}°C`, 'success');
        }
    }

        // 切换空调功能
    toggleAirCondition(feature) {
        const currentState = this.controlData.airCondition[feature];
        const newState = !currentState;
        
        this.controlData.airCondition[feature] = newState;
        
        // 更新开关显示
        this.updateToggleSwitch(this.getControlId(feature), newState);
        
        // 特殊处理空调主开关
        if (feature === 'power') {
            this.handleAirConditionPowerToggle(newState);
        }
        
        // 发送命令到车辆
        this.sendVehicleCommand('airCondition', feature, { enabled: newState });
        
        // 显示通知
        const featureName = this.getFeatureName(feature);
        this.showNotification(`${featureName}已${newState ? '开启' : '关闭'}`, 'success');
        
        // 更新车辆信息显示
        this.updateVehicleInfoDisplay();
    }

    // 处理空调主开关切换
    handleAirConditionPowerToggle(isOn) {
        if (!isOn) {
            // 关闭空调时，关闭所有相关功能
            this.controlData.airCondition.autoMode = false;
            this.controlData.airCondition.seatHeating = false;
            
            // 更新相关开关
            this.updateToggleSwitch('ac-auto', false);
            this.updateToggleSwitch('seat-heat', false);
        }
        
        // 更新温度控制区域状态
        const climateSection = document.querySelector('.climate-section');
        if (climateSection) {
            climateSection.classList.toggle('disabled', !isOn);
        }
        
        // 更新车辆信息中的空调状态
        this.updateAirConditionStatus(isOn);
    }

    // 切换安全功能
    toggleSecurity(feature) {
        const currentState = this.controlData.security[feature];
        const newState = !currentState;
        
        this.controlData.security[feature] = newState;
        
        // 更新开关显示
        this.updateToggleSwitch(this.getControlId(feature), newState);
        
        // 特殊处理哨兵模式
        if (feature === 'sentryMode') {
            this.handleSentryModeToggle(newState);
        }
        
        // 发送命令到车辆
        this.sendVehicleCommand('security', feature, { enabled: newState });
        
        // 显示通知
        const featureName = this.getFeatureName(feature);
        this.showNotification(`${featureName}已${newState ? '启用' : '禁用'}`, 'success');
        
        // 更新车辆信息显示
        this.updateVehicleInfoDisplay();
    }

    // 处理哨兵模式切换
    handleSentryModeToggle(isOn) {
        // 更新哨兵模式特效
        const sentryControl = document.querySelector('[data-control="sentry-mode"]');
        if (sentryControl) {
            const sentryControlItem = sentryControl.closest('.control-item');
            if (sentryControlItem) {
                sentryControlItem.classList.toggle('sentry-active', isOn);
            }
        }
        
        // 更新车辆信息中的哨兵模式状态
        this.updateSentryModeStatus(isOn);
        
        // 如果开启哨兵模式，自动启用防盗报警
        if (isOn && !this.controlData.security.antiTheft) {
            this.controlData.security.antiTheft = true;
            this.updateToggleSwitch('alarm', true);
        }
    }

    // 切换网络功能
    toggleNetwork(feature) {
        const currentState = this.controlData.network[feature];
        const newState = !currentState;
        
        this.controlData.network[feature] = newState;
        
        // 更新开关显示
        this.updateToggleSwitch(this.getControlId(feature), newState);
        
        // 发送命令到车辆
        this.sendVehicleCommand('network', feature, { enabled: newState });
        
        // 显示通知
        const featureName = this.getFeatureName(feature);
        this.showNotification(`${featureName}已${newState ? '开启' : '关闭'}`, 'success');
        
        // 更新网络状态到车辆信息
        this.updateNetworkStatus();
    }

    // 更新开关状态
    updateToggleSwitch(controlId, isActive) {
        const switchElement = document.querySelector(`[data-control="${controlId}"]`);
        if (switchElement) {
            switchElement.classList.toggle('active', isActive);
            
            // 添加切换动画
            switchElement.classList.add('switching');
            setTimeout(() => {
                switchElement.classList.remove('switching');
            }, this.animationDuration);
        }
    }

    // 更新车辆信息显示
    updateVehicleInfoDisplay() {
        // 确保车辆信息管理器存在
        if (!this.vehicleInfoManager) {
            console.warn('VehicleInfoManager 实例不存在，无法更新车辆信息显示');
            return;
        }
        
        try {
            // 更新快速状态栏
            const quickStatusUpdates = {};
            
            // 空调状态更新
            if (this.controlData.airCondition.power) {
                quickStatusUpdates.aircon = {
                    icon: "❄️",
                    text: "空调开启",
                    active: true
                };
            } else {
                quickStatusUpdates.aircon = {
                    icon: "❄️",
                    text: "空调关闭",
                    active: false
                };
            }
            
            // 哨兵模式状态更新
            quickStatusUpdates.sentry = {
                icon: "🛡️",
                text: this.controlData.security.sentryMode ? "哨兵模式" : "哨兵关闭",
                active: this.controlData.security.sentryMode
            };
            
            // 锁定状态更新
            quickStatusUpdates.locked = {
                icon: "🔐",
                text: this.controlData.security.autoLock ? "已锁定" : "未锁定",
                active: this.controlData.security.autoLock
            };
            
            // 更新车辆信息管理器的数据
            this.vehicleInfoManager.updateVehicleData('status', quickStatusUpdates);
            
            console.log('车辆信息显示已更新:', quickStatusUpdates);
            
        } catch (error) {
            console.error('更新车辆信息显示时出错:', error);
        }
    }

    // 更新空调状态到车辆信息
    updateAirConditionStatus(isOn) {
        if (!this.vehicleInfoManager) {
            console.warn('VehicleInfoManager 实例不存在，无法更新空调状态');
            return;
        }
        
        try {
            // 更新车内温度显示逻辑
            const tempUpdate = {
                value: `${this.controlData.climate.currentTemp}°C`,
                description: isOn ? "空调运行中" : "自然温度"
            };
            
            // 获取当前的车内温度信息卡片数据
            const currentInteriorTemp = this.vehicleInfoManager.vehicleData.infoCards.interiorTemp;
            
            this.vehicleInfoManager.updateVehicleData('cards', {
                interiorTemp: {
                    ...currentInteriorTemp,
                    ...tempUpdate
                }
            });
            
            console.log('空调状态已更新到车辆信息:', tempUpdate);
            
        } catch (error) {
            console.error('更新空调状态时出错:', error);
        }
    }

    // 更新哨兵模式状态到车辆信息
    updateSentryModeStatus(isOn) {
        if (!this.vehicleInfoManager) {
            console.warn('VehicleInfoManager 实例不存在，无法更新哨兵模式状态');
            return;
        }
        
        try {
            // 更新安全系统状态
            const securityUpdate = {
                value: isOn ? "哨兵激活" : "正常",
                description: isOn ? "监控中" : "已激活",
                status: "success"
            };
            
            // 获取当前的安全系统信息卡片数据
            const currentSecurity = this.vehicleInfoManager.vehicleData.infoCards.security;
            
            this.vehicleInfoManager.updateVehicleData('cards', {
                security: {
                    ...currentSecurity,
                    ...securityUpdate
                }
            });
            
            console.log('哨兵模式状态已更新到车辆信息:', securityUpdate);
            
        } catch (error) {
            console.error('更新哨兵模式状态时出错:', error);
        }
    }

    // 更新网络状态到车辆信息
    updateNetworkStatus() {
        if (!this.vehicleInfoManager) return;
        
        try {
            const networkData = this.controlData.network;
            
            // 更新网络连接信息卡片
            const networkUpdate = {
                value: networkData.bluetooth ? "已连接" : "未连接",
                description: networkData.bluetooth ? "蓝牙已启用" : "蓝牙已禁用",
                status: networkData.bluetooth ? "success" : "warning"
            };
            
            const currentNetwork = this.vehicleInfoManager.vehicleData.infoCards.network;
            
            this.vehicleInfoManager.updateVehicleData('cards', {
                network: {
                    ...currentNetwork,
                    ...networkUpdate
                }
            });
            
            console.log('网络状态已更新到车辆信息:', networkUpdate);
            
        } catch (error) {
            console.error('更新网络状态时出错:', error);
        }
    }

    // 更新温度状态
    updateTemperatureStatus() {
        const targetTemp = this.controlData.climate.targetTemp;
        let status = '舒适';
        
        if (targetTemp < 20) status = '偏冷';
        else if (targetTemp > 26) status = '偏热';
        
        this.controlData.climate.status = status;
        
        const tempStatusElement = document.querySelector('.temp-status');
        if (tempStatusElement) {
            tempStatusElement.textContent = status;
        }
    }

    // 更新面板状态
    updatePanelStatus() {
        const statusElement = document.querySelector('.panel-status');
        if (statusElement) {
            const onlineCount = this.calculateOnlineDevices();
            statusElement.textContent = `${onlineCount}个设备在线`;
        }
    }

    // 计算在线设备数量
    calculateOnlineDevices() {
        let count = 0;
        
        if (this.controlData.airCondition.power) count++;
        if (this.controlData.security.sentryMode) count++;
        if (this.controlData.security.autoLock) count++;
        if (this.controlData.security.antiTheft) count++;
        if (this.controlData.network.bluetooth) count++;
        if (this.controlData.network.wifi.connected) count++;
        
        return count;
    }

    // 发送车辆命令
    async sendVehicleCommand(system, command, parameters) {
        try {
            console.log(`发送命令: ${system}.${command}`, parameters);
            return { success: true };
        } catch (error) {
            console.error('命令发送失败:', error);
            this.showNotification('操作失败，请重试', 'error');
            return { success: false };
        }
    }

    // 获取控制ID映射
    getControlId(feature) {
        const mapping = {
            power: 'ac-power',
            autoMode: 'ac-auto',
            internalCirculation: 'ac-recirculate',
            seatHeating: 'seat-heat',
            sentryMode: 'sentry-mode',
            autoLock: 'auto-lock',
            antiTheft: 'alarm',
            mobileHotspot: 'hotspot',
            bluetooth: 'bluetooth'
        };
        return mapping[feature] || feature;
    }

    // 获取功能名称
    getFeatureName(feature) {
        const names = {
            power: '空调',
            autoMode: '自动模式',
            internalCirculation: '内循环',
            seatHeating: '座椅加热',
            sentryMode: '哨兵模式',
            autoLock: '自动上锁',
            antiTheft: '防盗报警',
            mobileHotspot: '移动热点',
            bluetooth: '蓝牙'
        };
        return names[feature] || feature;
    }

    // 获取信号强度文本
    getSignalText(signal) {
        const signals = {
            strong: '强',
            medium: '中',
            weak: '弱'
        };
        return signals[signal] || '未知';
    }

    // 值变化动画
    animateValueChange(element, newValue) {
        element.style.transform = 'scale(1.1)';
        element.style.color = '#00ff88';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 150);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `control-notification ${type}`;
        notification.textContent = message;
        
        const controlPanel = document.querySelector('.vehicle-control-panel');
        if (controlPanel) {
            controlPanel.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    // 获取当前控制状态
    getControlState(category) {
        switch (category) {
            case 'climate':
                return this.controlData.climate;
            case 'airCondition':
                return this.controlData.airCondition;
            case 'security':
                return this.controlData.security;
            case 'network':
                return this.controlData.network;
            case 'all':
                return this.controlData;
            default:
                return null;
        }
    }

    // 批量更新控制状态
    updateControlState(category, newData) {
        if (this.controlData[category]) {
            this.controlData[category] = { ...this.controlData[category], ...newData };
            
            // 重新渲染相关部分
            switch (category) {
                case 'climate':
                    this.renderTemperatureControl();
                    break;
                case 'airCondition':
                    this.renderAirConditionControls();
                    break;
                case 'security':
                    this.renderSecurityControls();
                    break;
                case 'network':
                    this.renderNetworkControls();
                    break;
            }
            
            this.updateVehicleInfoDisplay();
            this.updatePanelStatus();
        }
    }
}

// ---------------------------------------账号信息-----------------------------------------
// 账户信息管理可以在这里做，对应账号信息的界面


// ---------------------------------------全局初始化-----------------------------------------
let vehicleInfoManager = null;
let vehicleControlManager = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化滑动切换器
    const swiper = new SettingsSwiper();
    
    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            swiper.stopAutoPlay();
        }
    });
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', function() {
        // 重新计算位置
        swiper.updateSlidePosition();
    });
    
    // 全局错误处理
    window.addEventListener('error', function(e) {
        console.error('页面错误:', e.error);
    });

    try {
        // 先初始化车辆信息管理器
        vehicleInfoManager = new VehicleInfoManager();
        vehicleInfoManager.initializeVehiclePanel();
        
        // 然后初始化车内控制管理器，并传入车辆信息管理器的引用
        vehicleControlManager = new VehicleControlManager(vehicleInfoManager);
        vehicleControlManager.initializeControlPanel();
        
        // 设置全局引用，便于其他模块访问
        window.vehicleInfoManager = vehicleInfoManager;
        window.vehicleControlManager = vehicleControlManager;
        
        // 添加数据更新事件监听
        document.addEventListener('vehicleDataUpdated', (event) => {
            const { category, data, timestamp } = event.detail;
            console.log(`车辆数据更新事件 - 类别: ${category}, 时间: ${new Date(timestamp).toLocaleString()}`, data);
        });
        
        // 初始化滑动切换器（如果存在）
        if (typeof SettingsSwiper !== 'undefined') {
            const swiper = new SettingsSwiper();
        }
        
        console.log('车辆管理系统初始化完成');
        
    } catch (error) {
        console.error('初始化车辆管理系统时出错:', error);
    }
});



// 页面可见性变化监听,控制界面的操作会影响信息界面的显示，例如空调的开启和关闭
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时停止实时更新
        if (vehicleInfoManager) {
            vehicleInfoManager.stopRealTimeUpdates();
        }
    } else {
        // 页面显示时恢复实时更新
        if (vehicleInfoManager && vehicleInfoManager.isRealTimeMode) {
            vehicleInfoManager.startRealTimeUpdates();
        }
    }
});
