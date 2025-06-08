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