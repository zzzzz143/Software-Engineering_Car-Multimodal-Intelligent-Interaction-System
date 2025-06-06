document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') || 'driver';
    const iframe = document.getElementById('rightPanelFrame');
    
    switch (role) {
        case 'driver':
            iframe.src = `./screen/driver/screen_main.html`;
            // 显示左侧区域(HUD区和交互区)
            document.querySelector('.left-panel').style.display = 'block';
            break;
        case 'passenger':
            iframe.src = `./screen/passenger/screen_player.html`;
            // 隐藏左侧区域(HUD区和交互区)
            document.querySelector('.left-panel').style.display = 'none';
            break;
        default:
            iframe.src = `./screen/driver/screen_main.html`;
            // 显示左侧区域(HUD区和交互区)
            document.querySelector('.left-panel').style.display = 'block';
    }
});

window.addEventListener('pagehide', async (event) => {
    // 检查页面是否不会被缓存（即完全关闭）
    if (!event.persisted) {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                keepalive: true // 确保请求在页面卸载期间完成
            });
            if (!response.ok) {
                localStorage.clear();
            }
        } catch (error) {
            console.error('退出登录失败:', error);
            alert('退出登录失败！');
        }
    }
});