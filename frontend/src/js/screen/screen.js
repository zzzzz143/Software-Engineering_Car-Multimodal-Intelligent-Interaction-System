document.addEventListener('DOMContentLoaded', function() {
    
    // 更新时间显示
    function updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        const hourElement = document.querySelector('.time-display .hour');
        const minuteElement = document.querySelector('.time-display .minute');
        
        if (hourElement && minuteElement) {
            hourElement.textContent = hours;
            minuteElement.textContent = minutes;
        }
    }

    // 初始化时间并每分钟更新
    updateTime();
    setInterval(updateTime, 60000);

    // 切换开关功能
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });


    // 控制项点击效果
    const controlItems = document.querySelectorAll('.control-item');
    controlItems.forEach(item => {
        item.addEventListener('click', function() {
            // 添加点击动画效果
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});
