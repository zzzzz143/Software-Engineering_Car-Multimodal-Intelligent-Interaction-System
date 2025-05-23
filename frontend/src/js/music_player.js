export class MusicPlayer {
    constructor() {
        this.playQueue = [
            './src/assets/music/普通朋友.mp3',
            './src/assets/music/阴天快乐.mp3',
            './src/assets/music/执迷不悟.mp3'
        ];
        this.currentTrackIndex = 0; // 当前播放的索引
        this.volume = 0.5; // 默认音量
        this.audioElement = new Audio();
        this.isPlaying = false; // 播放状态标识
        this.audioElement.addEventListener('ended', () => this.autoPlayNext());// 播放结束自动播放下一首
        this.playMode = localStorage.getItem('playMode') || 'sequential'; // 顺序/单曲/随机
        this.audioElement.addEventListener('timeupdate', () => this.updateProgressBar());// 更新进度条
    }

    // 更新当前播放显示
    updateNowPlaying() {
        document.getElementById('nowPlaying').textContent = `正在播放：${
            this.playQueue[this.currentTrackIndex]
              .split(/[\\\/]/)
              .pop()
              .split('.')[0]
        }`;
    }

    // 切换播放/暂停
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        this.isPlaying = !this.isPlaying;
    }

    // 播放音乐
    play() {
        if (!this.audioElement.src) {
            this.audioElement.src = this.playQueue[this.currentTrackIndex];
        }
        this.audioElement.play();
        this.updateNowPlaying();
        document.getElementById('playPauseBtn').textContent = '⏸';
    }

    // 暂停音乐
    pause() {
        this.audioElement.pause();
        document.getElementById('playPauseBtn').textContent = '▶';
    }

    // 切换上一首
    playPrev() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playQueue.length) % this.playQueue.length; // 循环播放
        this.audioElement.src = this.playQueue[this.currentTrackIndex];
        this.play();
        this.updateNowPlaying();
    }

    // 切换下一首
    playNext() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playQueue.length; // 循环播放
        this.audioElement.src = this.playQueue[this.currentTrackIndex];
        this.play();
        this.updateNowPlaying();
    }

    // 播放结束自动播放下一首
    autoPlayNext() {
        // 顺序播放
        if (this.playMode === 'sequential') {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playQueue.length;
        }
        // 单曲循环
        if (this.playMode === 'single') {
            this.audioElement.currentTime = 0;
            this.audioElement.play();
            return;
        } 
        // 随机播放
        if (this.playMode ==='random') {
            this.currentTrackIndex = Math.floor(Math.random() * this.playQueue.length);
        }
        
        this.audioElement.src = this.playQueue[this.currentTrackIndex];
        this.play();
        this.updateNowPlaying();
    }

    // 切换播放模式(顺序/单曲/随机 )
    togglePlayMode() {
        const modes = ['sequential', 'single', 'random'];
        const currentIndex = modes.indexOf(this.playMode);
        this.playMode = modes[(currentIndex + 1) % modes.length];
        localStorage.setItem('playMode', this.playMode);
        if (this.playMode ==='sequential') {
            document.getElementById('modeBtn').textContent = '🔁';
        } else if (this.playMode ==='single') {
            document.getElementById('modeBtn').textContent = '🔂';
        } else if (this.playMode ==='random') {
            document.getElementById('modeBtn').textContent = '🔀';
        }
        return this.playMode;
    }

    // 设置音量
    setVolume(volume) {
        this.volume = volume;
        this.audioElement.volume = volume;
    }

    // 获取播放队列
    getPlayQueue() {
        return this.playQueue;
    }

    // 播放指定索引的音乐
    playFromQueue(index) {
        if (index >= 0 && index < this.playQueue.length) {
            this.currentTrackIndex = index;
            this.audioElement.src = this.playQueue[index];
            this.play();
            this.updateNowPlaying();
        }
    }

    // 更新进度条
    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        progressBar.value = (this.audioElement.currentTime / this.audioElement.duration) * 100 || 0;
    }
}