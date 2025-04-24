export class MusicPlayer {
    constructor() {
        this.playlist = [
            './src/assets/music/1.mp3',
            // './src/assets/music/2.mp3',
            // './src/assets/music/3.mp3'
        ];
        this.currentTrackIndex = 0;
        this.volume = 0.5;
        this.isMuted = false;
        this.audioElement = new Audio();
        
        // 事件监听方法
        this._initEventListeners();
        
        // 添加延迟加载
        setTimeout(() => {
            this.audioElement.src = this.playlist[this.currentTrackIndex];
            this.audioElement.load();
        }, 1000);
    }

    // 事件监听方法
    _initEventListeners() {
        this.audioElement.addEventListener('ended', () => this.playNext());
    }

    // 更新播放状态显示
    updateNowPlaying() {
        const nowPlayingElement = document.getElementById('nowPlaying');
        if (nowPlayingElement) {
            nowPlayingElement.textContent = `正在播放：${this.getCurrentTrackName()}`;
        }
    }

    // 播放控制
    play() {
        // 添加播放状态验证
        if (this.audioElement.readyState < 2) {
            this.audioElement.load();
        }
        
        return this.audioElement.play()
            .then(() => this.updateNowPlaying())
            .catch(e => console.error('播放失败:', e));
    }
}