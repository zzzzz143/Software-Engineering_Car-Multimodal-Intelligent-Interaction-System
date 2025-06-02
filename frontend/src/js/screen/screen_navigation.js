/**
 * 导航屏幕显示管理器
 * 负责更新导航界面的所有动态内容
 * 后续工作：1. 接入数据库获取车辆信息，家庭地址，公司地址等
 *          2. 接入地图API，获取实时路况信息（目前未找到合适的路况信息，不够详细，考虑将该模块替换为天气）
 */
class NavigationDisplayManager {
    constructor() {
        this.currentData = {
            navigation: {}, // 导航数据
            vehicle: {}, // 车辆数据
            traffic: {}, // 路况数据
            time: {} // 时间数据
        };

        this.map = null; // 地图实例
        this.marker = null; // 始发点标记
        this.currentPosition = null; // 当前位置
        this.driving = null; // 驾车实例
        this.destinationMarker = null; // 目的地标记
        this.realTimeNavigationInterval = null; // 实时导航定时器
        this.isNavigating = false; // 导航状态

        // 缓存DOM元素
        this.navigationToggleBtn = document.getElementById('navigation-toggle-btn');
        this.distanceIndicator = document.querySelector('.distance-indicator');
        
        console.log('🚗 导航显示管理器初始化完成');
    }

    // 更新距离提示信息
    updateDistanceIndicator(distanceData = {}) {
        const defaultData = {
            distance: '暂无数据',
            direction: '暂无数据'
        };
        const data = { ...defaultData, ...distanceData };
        const distanceElement = document.querySelector('.distance-value');
        const directionElement = document.querySelector('.direction-text');
        if (distanceElement) distanceElement.textContent = data.distance;
        if (directionElement) directionElement.textContent = data.direction;
        if (this.distanceIndicator) {
            if (data.distance !== '暂无数据' && data.direction !== '暂无数据') {
                this.distanceIndicator.classList.remove('hidden'); // 显示距离提示框
            } else {
                this.distanceIndicator.classList.add('hidden'); // 隐藏距离提示框
            }
        }
        this.currentData.navigation.distance = data;
        console.log('📍 距离提示已更新:', data);
    }

    // 更新车辆基本信息
    updateVehicleInfo(vehicleInfo = {}) {
        const defaultInfo = {
            name: 'My car',
            plate: '沪A·12345'
        };
        const info = { ...defaultInfo, ...vehicleInfo };
        const nameElement = document.querySelector('.vehicle-name');
        const plateElement = document.querySelector('.vehicle-plate');
        if (nameElement) nameElement.textContent = info.name;
        if (plateElement) plateElement.textContent = info.plate;
        this.currentData.vehicle.info = info;
        console.log('🚗 车辆信息已更新:', info);
    }

    // 更新车辆状态指标
    updateVehicleMetrics(metrics = {}) {
        const defaultMetrics = {
            range: { value: 200, unit: 'km', percentage: 72 },
            temperature: { value: 24, unit: '°C', percentage: 35 },
            mileage: { value: 4500, unit: 'km', percentage: 10 }
        };
        const data = { ...defaultMetrics, ...metrics };
        this.updateMetricRow(0, {
            label: '续航里程',
            value: `${data.range.value} ${data.range.unit}`,
            percentage: data.range.percentage,
            barClass: 'bar-fill'
        });
        this.updateMetricRow(1, {
            label: '车内温度',
            value: `${data.temperature.value}${data.temperature.unit}`,
            percentage: data.temperature.percentage,
            barClass: 'bar-fill comfort'
        });
        this.updateMetricRow(2, {
            label: '总里程',
            value: `${data.mileage.value} ${data.mileage.unit}`,
            percentage: data.mileage.percentage,
            barClass: 'bar-fill warning'
        });
        this.currentData.vehicle.metrics = data;
        console.log('📊 车辆指标已更新:', data);
    }

    // 更新单个指标行
    updateMetricRow(index, metric) {
        const metricRows = document.querySelectorAll('.metric-row');
        if (metricRows[index]) {
            const row = metricRows[index];
            const labelElement = row.querySelector('.metric-label');
            const valueElement = row.querySelector('.metric-value');
            const barElement = row.querySelector('.bar-fill');
            if (labelElement) labelElement.textContent = metric.label;
            if (valueElement) valueElement.textContent = metric.value;
            if (barElement) {
                barElement.style.width = `${metric.percentage}%`;
                barElement.className = metric.barClass;
            }
        }
    }

    // 更新导航详情信息
    updateNavigationDetails(navDetails = {}) {
        const defaultDetails = {
            destination: '请选择目的地',
            address: '--',
            arrivalTime: '--',
            route: '--',
            duration: '--',
            distance: '--'
        };
        const details = { ...defaultDetails, ...navDetails };
        if (details.duration && details.duration.includes('分钟')) {
            const durationMinutes = parseInt(details.duration.match(/\d+/)[0], 10);
            const now = new Date();
            now.setMinutes(now.getMinutes() + durationMinutes);
            details.arrivalTime = now.toTimeString().slice(0, 5);
        }
        const destNameElement = document.querySelector('.dest-name');
        const destAddressElement = document.querySelector('.dest-address');
        const arrivalTimeElement = document.querySelector('.arrival-time');
        if (destNameElement) destNameElement.textContent = details.destination;
        if (destAddressElement) destAddressElement.textContent = details.address;
        if (arrivalTimeElement) arrivalTimeElement.textContent = details.arrivalTime;
        const detailItems = document.querySelectorAll('.detail-item .detail-text');
        if (detailItems[0]) detailItems[0].textContent = details.route;
        if (detailItems[1]) detailItems[1].textContent = details.duration;
        if (detailItems[2]) detailItems[2].textContent = details.distance;
        this.currentData.navigation.details = details;
        console.log('🧭 导航详情已更新:', details);
    }

    // 更新路况信息
    updateTrafficInfo(trafficAlerts = []) {
        const defaultAlerts = [
            {
                type: 'warning',
                icon: '⚠️',
                title: '前方施工',
                description: '500米处道路施工，注意减速'
            },
            {
                type: 'info',
                icon: 'ℹ️',
                title: '路线建议',
                description: '建议从中环路绕行，可节省5分钟'
            },
            {
                type: 'success',
                icon: '✅',
                title: '服务设施',
                description: '附近有充电站和停车场'
            }
        ];
        const alerts = trafficAlerts.length > 0 ? trafficAlerts : defaultAlerts;
        const trafficContainer = document.querySelector('.traffic-alerts');
        if (trafficContainer) {
            trafficContainer.innerHTML = '';
            alerts.forEach(alert => {
                const alertElement = document.createElement('div');
                alertElement.className = `alert-item ${alert.type}`;
                alertElement.innerHTML = `
                    <div class="alert-icon">${alert.icon}</div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-desc">${alert.description}</div>
                    </div>
                `;
                trafficContainer.appendChild(alertElement);
            });
        }
        this.currentData.traffic.alerts = alerts;
        console.log('🚦 路况信息已更新:', alerts);
    }

    // 更新快捷操作按钮标签
    updateQuickActions() {
        // 修正选择器，仅选择 .quick-actions 容器内的 .action-btn
        const actionButtons = document.querySelectorAll('.quick-actions .action-buttons .action-btn');
        const labels = ['家', '学校', '公司', '加油站', '停车场'];
        actionButtons.forEach((button, index) => {
            const btnLabel = button.querySelector('.btn-label');
            if (btnLabel) {
                if (labels[index]) {
                    btnLabel.textContent = labels[index];
                } else {
                    btnLabel.textContent = ''; // 如果标签数组越界，则清空
                }
            }
        });
        console.log('⚡ 快捷操作已更新');
    }

    // 绑定快捷操作事件
    bindQuickActions() {
        // const navigationToggleBtn = document.getElementById('navigation-toggle-btn'); // 使用 this.navigationToggleBtn
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn && actionBtn.closest('.quick-actions')) { // 确保是快捷操作按钮
                const btnLabel = actionBtn.querySelector('.btn-label');
                if (btnLabel) {
                    const label = btnLabel.textContent;
                    console.log(`🎯 快捷操作被点击: ${label}`);

                    // 如果正在导航中，先退出当前导航
                    if (this.isNavigating && this.navigationToggleBtn) { // 使用 this.isNavigating
                        console.log('快捷操作：检测到正在导航，将先退出当前导航。');
                        this.navigationToggleBtn.click(); 
                    }

                    switch (label) {
                        case '家':
                            this.navigateToFixedDestination({
                                destination: '我的家',
                                address: '南开大学津南校区'
                            });
                            if (this.navigationToggleBtn) this.navigationToggleBtn.click(); // 开始新的导航
                            break;
                        case '学校':
                            this.navigateToFixedDestination({
                                destination: '我的学校',
                                address: '南开大学津南校区'
                            });
                            if (this.navigationToggleBtn) this.navigationToggleBtn.click(); // 开始新的导航
                            break;
                        case '公司':
                            this.navigateToFixedDestination({
                                destination: '我的公司',
                                address: '天津大学北洋园校区'
                            });
                            if (this.navigationToggleBtn) this.navigationToggleBtn.click(); // 开始新的导航
                            break;
                        case '加油站':
                            this.searchNearby('加油站'); // 移除 navigationToggleBtn 参数，内部使用 this.navigationToggleBtn
                            break;
                        case '停车场':
                            this.searchNearby('停车场'); // 移除 navigationToggleBtn 参数
                            break;
                    }
                }
            }
        });
    }

    navigateToFixedDestination(fixedDestination) {
        if (!fixedDestination || !fixedDestination.address) {
            console.error('固定目的地无效或地址为空:', fixedDestination);
            return;
        }
        // 调用 updateNavigationDetails 更新导航信息
        this.updateNavigationDetails({ // 使用 this
            destination: fixedDestination.destination,
            address: fixedDestination.address,
            arrivalTime: '--', 
            route: '路线规划中...',
            duration: '--', 
            distance: '--' 
        });
        console.log(`🚗 导航到固定目的地: ${fixedDestination.destination}`);
        // 路线规划将在 toggleNavigation 中处理
    }

    searchNearby(keyword) { 
        if (!this.currentPosition) {
            alert('请确保已获取当前位置');
            return;
        }
        AMap.plugin('AMap.PlaceSearch', () => {
            const placeSearch = new AMap.PlaceSearch({
                type: keyword, 
                pageSize: 1,   
                pageIndex: 1,
                citylimit: true, 
            });

            placeSearch.searchNearBy('', this.currentPosition, 5000, (status, result) => {
                if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                    const nearestPlace = result.poiList.pois[0];
                    const navDetails = {
                        destination: nearestPlace.name,
                        address: nearestPlace.address,
                        arrivalTime: '--',
                        route: '路线规划中...',
                        duration: '--',
                        distance: '--'
                    };
                    this.updateNavigationDetails(navDetails); // 使用 this
                    if (this.navigationToggleBtn) this.navigationToggleBtn.click(); 
                    console.log(`🔍 搜索到最近的${keyword}: ${nearestPlace.name}`);
                } else {
                    alert(`未找到附近的${keyword}`);
                    console.error(`搜索${keyword}失败:`, result);
                }
            });
        });
    }

    // 获取当前所有数据
    getCurrentData() {
        return this.currentData;
    }

    // 初始化地图和导航相关的主要入口
    initializeMapAndNavigation() {
        this.bindNavigationControlEvents();
        this.initializeMapWithCurrentLocation();
    }
    
    bindNavigationControlEvents() {
        if (this.navigationToggleBtn) {
            this.navigationToggleBtn.addEventListener('click', () => this.toggleNavigation());
        } else {
            console.error('导航按钮未找到，请检查HTML结构或ID是否正确');
        }
    }

    toggleNavigation() {
        const navDetails = this.currentData.navigation.details;
        if (!navDetails || !navDetails.address || navDetails.address === '--') {
            alert('请先通过点击地图或快捷方式选择一个有效的目的地');
            return;
        }

        if (this.isNavigating) {
            this.isNavigating = false;
            if(this.navigationToggleBtn) this.navigationToggleBtn.textContent = '开始导航';
            if (this.realTimeNavigationInterval) clearInterval(this.realTimeNavigationInterval);
            this.realTimeNavigationInterval = null;
            if (this.map) {
                this.map.setPitch(0);
                this.map.setZoom(13);
                this.map.setFeatures(['bg', 'road']);
            }
            if (this.distanceIndicator) this.distanceIndicator.classList.add('hidden');
            console.log('导航已退出');
        } else {
            this.isNavigating = true;
            if(this.navigationToggleBtn) this.navigationToggleBtn.textContent = '退出导航';
            if (this.map) {
                this.map.setPitch(75);
                this.map.setZoom(20);
                this.map.setFeatures(['bg', 'road', 'building']);
                if (this.currentPosition) this.map.setCenter(this.currentPosition);
            }
            if (this.distanceIndicator) this.distanceIndicator.classList.remove('hidden');
            this.planRoute(navDetails); // 规划路线
            this.startRealTimeNavigation(navDetails, true); // 开始实时导航更新
            console.log('导航已开始');
        }
    }

    initializeMapWithCurrentLocation() {
        return fetch('/api/amap/config')
        .then(response => response.json())
        .then(config => {
            window._AMapSecurityConfig = {
                securityJsCode: config.security_code
            };
            
            const script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${config.api_key}&plugin=AMap.Geolocation,AMap.Geocoder`;
            document.head.appendChild(script);
            
            return new Promise(resolve => {
                script.onload = resolve;
            });
        })
        .then(() => {
            AMap.plugin(['AMap.Geolocation', 'AMap.Geocoder'], () => {
                const geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,
                    timeout: 5000,
                });
                geolocation.getCurrentPosition((status, result) => {
                    const mapContainer = document.getElementById('map-container');
                    if (status === 'complete') {
                        this.currentPosition = [result.position.lng, result.position.lat];
                        console.log('当前位置：', this.currentPosition);
                        this.map = new AMap.Map('map-container', {
                            viewMode: '3D',
                            zoom: 13,
                            center: this.currentPosition
                        });
                        this.marker = new AMap.Marker({
                            position: this.currentPosition,
                            title: '当前位置',
                            map: this.map
                        });
                        this.bindMapClickEvent();
                        this.updateVehicleInfo({
                            name: '当前车辆',
                            plate: '沪A·12345'
                        });
                        this.updateVehicleMetrics({
                            range: { value: 300, unit: 'km', percentage: 80 },
                            temperature: { value: 22, unit: '°C', percentage: 50 },
                            mileage: { value: 12000, unit: 'km', percentage: 20 }
                        });
                        if (mapContainer) {
                            mapContainer.classList.remove('hidden');
                            mapContainer.style.setProperty('--map-loaded', 'true');
                        }
                    } else {
                        console.error('定位失败：', result);
                        this.map = new AMap.Map('map-container', {
                            viewMode: '3D',
                            zoom: 13,
                            center: [116.397428, 39.90923] 
                        });
                        this.bindMapClickEvent(); 
                        if (mapContainer) {
                            mapContainer.classList.remove('hidden');
                            mapContainer.style.setProperty('--map-loaded', 'true');
                        }
                    }
                });
            });
        })
    }

    bindMapClickEvent() {
        if (!this.map) {
            console.error('地图尚未初始化，无法绑定点击事件');
            return;
        }
        this.map.on('click', (e) => {
            const clickedLngLat = e.lnglat;
            if (this.destinationMarker) {
                this.destinationMarker.setPosition(clickedLngLat);
            } else {
                this.destinationMarker = new AMap.Marker({
                    position: clickedLngLat,
                    map: this.map,
                    title: '目的地'
                });
            }
            AMap.plugin('AMap.Geocoder', () => {
                const geocoder = new AMap.Geocoder();
                geocoder.getAddress(clickedLngLat, (status, result) => {
                    if (status === 'complete' && result.regeocode) {
                        const address = result.regeocode.formattedAddress;
                        const addressComponent = result.regeocode.addressComponent;
                        const building = addressComponent.building || '';
                        const streetNumber = `${addressComponent.street || ''} ${addressComponent.streetNumber || ''}`;
                        const destinationName = building || streetNumber || '未知地点';
                        
                        const navDetails = {
                            destination: destinationName,
                            address: address,
                            arrivalTime: '--',
                            route: '路线规划中...',
                            duration: '--',
                            distance: '--'
                        };
                        // this.currentData.navigation.details = navDetails; // updateNavigationDetails会做这个
                        this.updateNavigationDetails(navDetails);
                        this.planRoute(navDetails); // 点击地图后也规划路线
                    } else {
                        console.error('获取地址失败：', result);
                    }
                });
            });
        });
    }

    planRoute(navDetails) {
        if (!this.currentPosition) {
            alert('请确保已获取当前位置');
            return;
        }
        if (!navDetails || !navDetails.address || navDetails.address === '--') {
            console.warn('planRoute: 目的地地址无效或未设置', navDetails);
            return;
        }
        AMap.plugin(['AMap.Geocoder', 'AMap.Driving'], () => {
            const geocoder = new AMap.Geocoder();
            geocoder.getLocation(navDetails.address, (status, result) => {
                if (status === 'complete' && result.geocodes.length) {
                    const destLngLat = result.geocodes[0].location;
                    if (!this.driving) {
                        this.driving = new AMap.Driving({
                            map: this.map,
                            // policy: AMap.DrivingPolicy.LEAST_TIME // 可选策略
                        });
                    } else {
                        this.driving.clear(); // 清除之前的路线
                    }
                    this.driving.search(
                        new AMap.LngLat(this.currentPosition[0], this.currentPosition[1]),
                        destLngLat,
                        (status, result) => {
                            if (status === 'complete' && result.routes && result.routes.length) {
                                const route = result.routes[0];
                                const steps = route.steps;
                                let routeDisplay = '暂无路线信息';
                                if (steps && steps.length > 0) {
                                    routeDisplay = `${steps[0].instruction} (共 ${steps.length} 步)`;
                                }
                                const duration = `预计用时${Math.round(route.time / 60)}分钟`;
                                const distance = `剩余距离${(route.distance / 1000).toFixed(1)}公里`;
                                this.updateNavigationDetails({
                                    ...navDetails, // 保留已有的目的地名称和地址
                                    route: routeDisplay,
                                    duration: duration,
                                    distance: distance
                                });
                            } else {
                                console.error('路线规划失败：', result);
                                alert('路线规划失败');
                            }
                        }
                    );
                } else {
                    console.error('地理编码失败：', result);
                    alert('未找到目的地');
                }
            });
        });
    }

    startRealTimeNavigation(navDetails, immediate = false) {
        if (!this.map || !this.currentPosition || !navDetails || !navDetails.address || navDetails.address === '--') {
            console.error('地图、当前位置或目的地地址未初始化，无法进行实时导航');
            return;
        }

        const updateNavigation = () => {
            AMap.plugin('AMap.Geolocation', () => { // 确保插件加载
                const geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,
                    timeout: 3000,
                });
                geolocation.getCurrentPosition((status, result) => {
                    if (status === 'complete') {
                        this.currentPosition = [result.position.lng, result.position.lat];
                        console.log('实时更新当前位置：', this.currentPosition);
                        if (this.marker) {
                            this.marker.setPosition(this.currentPosition);
                        }
                        // 重新规划路径以获取最新导航信息
                        // 使用 AMap.Driving 实例进行路径规划
                        AMap.plugin(['AMap.Geocoder', 'AMap.Driving'], () => {
                            const geocoder = new AMap.Geocoder();
                            geocoder.getLocation(navDetails.address, (geoStatus, geoResult) => {
                                if (geoStatus === 'complete' && geoResult.geocodes.length) {
                                    const destLngLat = geoResult.geocodes[0].location;
                                    if (!this.driving) {
                                        this.driving = new AMap.Driving({ map: this.map });
                                    } else {
                                        this.driving.clear(); // 清除旧路径，避免重叠渲染
                                    }
                                    this.driving.search(
                                        new AMap.LngLat(this.currentPosition[0], this.currentPosition[1]),
                                        destLngLat,
                                        (driveStatus, driveResult) => {
                                            if (driveStatus === 'complete' && driveResult.routes && driveResult.routes.length) {
                                                const route = driveResult.routes[0];
                                                if (route.steps && route.steps.length > 0) {
                                                    const firstStep = route.steps[0];
                                                    const instruction = firstStep.instruction;
                                                    const distanceMatch = instruction.match(/行驶(\d+(\.\d+)?(米|千米))/);
                                                    const operationMatch = instruction.match(/(向[东南西北]+行驶|进入环岛|离开环岛|右转|左转)/g);
                                                    const distanceText = distanceMatch ? distanceMatch[1] : '未知距离';
                                                    const operationText = operationMatch ? operationMatch.join('，') : '未知操作';
                                                    this.updateDistanceIndicator({
                                                        distance: distanceText,
                                                        direction: operationText
                                                    });
                                                }
                                                const steps = route.steps;
                                                let routeDisplay = '暂无路线信息';
                                                if (steps && steps.length > 0) {
                                                    routeDisplay = `${steps[0].instruction} (共 ${steps.length} 步)`;
                                                }
                                                const duration = `预计用时${Math.round(route.time / 60)}分钟`;
                                                const distance = `剩余距离${(route.distance / 1000).toFixed(1)}公里`;
                                                this.updateNavigationDetails({
                                                    ...navDetails, // 保留目的地名称和地址
                                                    route: routeDisplay,
                                                    duration: duration,
                                                    distance: distance
                                                });
                                                console.log('实时路径规划已更新');
                                            } else {
                                                console.error('实时路径规划失败：', driveResult);
                                            }
                                        }
                                    );
                                } else {
                                    console.error('实时地理编码失败：', geoResult);
                                }
                            });
                        });
                    } else {
                        console.error('实时定位失败：', result);
                    }
                });
            });
        };

        if (immediate) {
            updateNavigation();
        }
        if (this.realTimeNavigationInterval) clearInterval(this.realTimeNavigationInterval); 
        this.realTimeNavigationInterval = setInterval(updateNavigation, 5000); 
    }
}

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    window.navigationDisplay = new NavigationDisplayManager();

    // 同步进行初始数据更新
    window.navigationDisplay.updateDistanceIndicator();
    window.navigationDisplay.updateVehicleInfo();
    window.navigationDisplay.updateVehicleMetrics();
    window.navigationDisplay.updateNavigationDetails(); 
    window.navigationDisplay.updateTrafficInfo();
    window.navigationDisplay.updateQuickActions(); 

    window.navigationDisplay.bindQuickActions(); 
    
    // 初始化地图和导航相关功能
    window.navigationDisplay.initializeMapAndNavigation();
});