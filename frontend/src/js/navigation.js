export function initNavigation() {
    fetch('/api/amap/config')
    .then(response =>  response.json())
    .then(config => {
        if (!config.api_key || !config.security_code) {
            console.error('缺少高德地图KEY或安全密钥');
            return;
        }
        window._AMapSecurityConfig = {
            securityJsCode: config.security_code,
        };
        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${config.api_key}&plugin=AMap.Driving,AMap.Adaptor`;
        document.head.appendChild(script);

        script.onload = () => {
            // 初始化地图
            const map = new AMap.Map('mapContainer', {
                viewMode: '3D',
                zoom: 12,
                center: [116.397428, 39.90923] // 默认北京中心点
            });
            // 路线规划功能
            document.getElementById('planRoute').addEventListener('click', () => {
                const start = document.getElementById('startPoint').value;
                const end = document.getElementById('endPoint').value;
                
                if (!start || !end) {
                    alert('请输入出发地和目的地');
                    return;
                }
                
                // 使用高德驾车路线规划插件
                AMap.plugin('AMap.Driving', () => {
                    const driving = new AMap.Driving({
                        map: map,
                        panel: 'routeInfo'
                    });
                    
                    driving.search([
                        { keyword: start, city: '全国' },
                        { keyword: end, city: '全国' }
                    ], (status, result) => {
                        if (status === 'complete') {
                            console.log('绘制驾车路线完成');
                        } else {
                            console.log('获取驾车数据失败：' + result)
                        }
                    });
                });
            });
        }   
    });
}