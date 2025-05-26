//--------------------------------------音乐播放器控制类----------------------------------------------
class MusicPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 240; 
        this.volume = 0.7;
        this.currentSong = {
            title: "沙文",
            artist: "林忆莲",
        };
        this.playlist = [
            { title: "沙文", artist: "林忆莲", duration: 240 },
            { title: "Between The Bars", artist: "Elliott Smith", duration: 280 },
            { title: "格雷的画像", artist: "韦礼安", duration: 220 }
        ];
        this.currentIndex = 0;
        this.progressInterval = null;
        
        this.init();
    }

    // 初始化事件监听
    init() {
        const playBtn = document.querySelector('.play-btn');
        const prevBtn = document.querySelector('.music-btn:first-child');
        const nextBtn = document.querySelector('.music-btn:last-child');
        const progressBar = document.querySelector('.progress-bar');

        playBtn?.addEventListener('click', () => this.togglePlay());
        prevBtn?.addEventListener('click', () => this.previousSong());
        nextBtn?.addEventListener('click', () => this.nextSong());
        progressBar?.addEventListener('click', (e) => this.seekTo(e));

        this.loadSong(this.playlist[this.currentIndex]);
    }

    // 播放/暂停切换
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    // 播放
    play() {
        this.isPlaying = true;
        this.updatePlayButton();
        this.startProgress();
        this.showNotification(`正在播放: ${this.currentSong.title}`);
    }

    // 暂停
    pause() {
        this.isPlaying = false;
        this.updatePlayButton();
        this.stopProgress();
        this.showNotification('音乐已暂停');
    }

    // 更新播放按钮状态
    updatePlayButton() {
        const playBtn = document.querySelector('.play-btn');
        if (playBtn) {
            if (this.isPlaying) {
                playBtn.textContent = '⏸';
                playBtn.classList.add('playing');
            } else {
                playBtn.textContent = '▶';
                playBtn.classList.remove('playing');
            }
        }
    }

    // 开始进度更新
    startProgress() {
        // 先清除现有定时器
        this.stopProgress();
        
        this.progressInterval = setInterval(() => {
            // 双重检查播放状态
            if (!this.isPlaying) {
                this.stopProgress();
                return;
            }
            
            this.currentTime += 1;
            if (this.currentTime >= this.duration) {
                this.nextSong();
            } else {
                this.updateProgress();
            }
        }, 1000);
    }

    // 停止进度更新
    stopProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    // 上一首
    previousSong() {
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
        this.loadSong(this.playlist[this.currentIndex]);
        if (this.isPlaying) {
            this.play();
        }
    }

    // 下一首
    nextSong() {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.loadSong(this.playlist[this.currentIndex]);
        if (this.isPlaying) {
            this.play();
        }
    }

    // 加载歌曲
    loadSong(song) {
        this.currentSong = song;
        this.currentTime = 0;
        this.duration = song.duration;
        this.updateDisplay();
        this.updateProgress();
    }

    // 跳转到指定位置
    seekTo(event) {
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        this.currentTime = Math.floor(percent * this.duration);
        this.updateProgress();
    }

    // 更新进度条
    updateProgress() {
        const percent = Math.min((this.currentTime / this.duration) * 100, 100);
        const progressElement = document.querySelector('.progress');
        if (progressElement) {
            progressElement.style.width = `${percent}%`;
        }
    }

    // 更新显示信息
    updateDisplay() {
        const songTitle = document.querySelector('.song-title');
        const artist = document.querySelector('.artist');
        
        if (songTitle) songTitle.textContent = this.currentSong.title;
        if (artist) artist.textContent = this.currentSong.artist;
    }

    // 获取播放状态
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            currentSong: this.currentSong,
            currentTime: this.currentTime,
            duration: this.duration,
            volume: this.volume
        };
    }

    // 显示通知
    showNotification(message) {
        console.log(`🎵 ${message}`);
    }

    // 销毁播放器
    destroy() {
        this.stopProgress();
        this.isPlaying = false;
    }
}

//---------------------------------------------天气信息控制类-------------------------------------------------
class WeatherWidget {
    constructor() {
        this.currentWeather = {
            temperature: 23,
            condition: "晴转多云",
            location: "北京",
            humidity: 65,
            windSpeed: 12,
            icon: "🌤️"
        };
        this.forecast = [];
        this.lastUpdate = new Date();
        
        this.init();
    }

    // 初始化
    init() {
        this.updateDisplay();
        // 每30分钟自动更新一次
        setInterval(() => this.autoUpdate(), 30 * 60 * 1000);
    }

    // 更新天气数据
    async updateWeather(location = null) {
        try {
            // 模拟API调用
            const weatherData = await this.fetchWeatherData(location);
            this.currentWeather = weatherData;
            this.lastUpdate = new Date();
            this.updateDisplay();
            this.showNotification(`天气信息已更新: ${this.currentWeather.location}`);
            return weatherData;
        } catch (error) {
            console.error('天气更新失败:', error);
            this.showNotification('天气信息更新失败');
        }
    }

    // 模拟获取天气数据
    async fetchWeatherData(location) {
        
        
        const weatherConditions = [
            { condition: "晴天", icon: "☀️", temp: [20, 30] },
            { condition: "多云", icon: "☁️", temp: [15, 25] },
            { condition: "晴转多云", icon: "🌤️", temp: [18, 28] },
            { condition: "小雨", icon: "🌦️", temp: [12, 20] },
            { condition: "阴天", icon: "☁️", temp: [10, 18] }
        ];
        
        const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
        const tempRange = randomWeather.temp;
        
        return {
            temperature: Math.floor(Math.random() * (tempRange[1] - tempRange[0]) + tempRange[0]),
            condition: randomWeather.condition,
            location: location || this.currentWeather.location,
            humidity: Math.floor(Math.random() * 40 + 40), // 40-80%
            windSpeed: Math.floor(Math.random() * 20 + 5), // 5-25 km/h
            icon: randomWeather.icon
        };
    }

    // 更新显示
    updateDisplay() {
        const elements = {
            icon: document.querySelector('.weather-widget .widget-icon'),
            temperature: document.querySelector('.temperature'),
            condition: document.querySelector('.weather-desc'),
            location: document.querySelector('.location'),
            humidity: document.querySelector('.detail-item:first-child span:last-child'),
            windSpeed: document.querySelector('.detail-item:last-child span:last-child')
        };

        if (elements.icon) elements.icon.textContent = this.currentWeather.icon;
        if (elements.temperature) elements.temperature.textContent = `${this.currentWeather.temperature}°C`;
        if (elements.condition) elements.condition.textContent = this.currentWeather.condition;
        if (elements.location) elements.location.textContent = this.currentWeather.location;
        if (elements.humidity) elements.humidity.textContent = `${this.currentWeather.humidity}%`;
        if (elements.windSpeed) elements.windSpeed.textContent = `${this.currentWeather.windSpeed}km/h`;
    }

    // 设置位置
    async setLocation(location) {
        await this.updateWeather(location);
    }

    // 获取天气信息
    getWeatherInfo() {
        return {
            ...this.currentWeather,
            lastUpdate: this.lastUpdate,
            updateTime: this.formatTime(this.lastUpdate)
        };
    }

    // 自动更新
    async autoUpdate() {
        await this.updateWeather();
    }
    // 显示通知
    showNotification(message) {
        console.log(`🌤️ ${message}`);
    }
    // 格式化时间
    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

//----------------------------------------------智能对话框控制类----------------------------------
class ChatAssistant {
   //可以整合语音信息作为输入
}

//-----------------------------------------------显示车辆信息--------------------------------
class VehicleStatus {
    constructor() {
        this.battery = 85;  // 电池电量百分比
        this.speed = 420;   // 速度
        
        this.init();
    }

    // 初始化
    init() {
        this.updateDisplay();
    }

    // 更新电池电量
    updateBattery(percentage) {
        // 验证输入范围 0-100
        this.battery = Math.max(0, Math.min(100, percentage));
        this.updateBatteryDisplay();
        return this.battery;
    }

    // 更新速度
    updateSpeed(speed) {
        // 验证输入，不能为负数
        this.speed = Math.max(0, speed);
        this.updateSpeedDisplay();
        return this.speed;
    }

    // 更新电池显示
    updateBatteryDisplay() {
        const batteryElement = document.querySelector('.status-item:first-child span:last-child');
        if (batteryElement) {
            batteryElement.textContent = `${this.battery}%`;
        }
    }

    // 更新速度显示
    updateSpeedDisplay() {
        const rangeElement = document.querySelector('.status-item:last-child span:last-child');
        if (rangeElement) {
            rangeElement.textContent = `${this.speed}km/h`;
        }
    }

    // 更新所有显示
    updateDisplay() {
        this.updateBatteryDisplay();
        this.updateSpeedDisplay();
    }

    // 获取当前状态
    getStatus() {
        return {
            battery: this.battery,
            speed: this.speed
        };
    }

    // 同时更新电量和续航
    updateVehicleStatus(battery, range) {
        this.updateBattery(battery);
        this.updateRange(range);
        return this.getStatus();
    }
}

//------------------------------------------------------------------------------
// 初始化所有组件
document.addEventListener('DOMContentLoaded', function() {
    // 创建全局实例
    // window.musicPlayer = new MusicPlayer();
    if(!window.weatherWidget) {
        window.weatherWidget = new WeatherWidget();
    }
    if(!window.chatAssistant) {
        window.chatAssistant = new ChatAssistant();
    }
    if(!window.vehicleStatus) {
        window.vehicleStatus = new VehicleStatus();
    }    
});
