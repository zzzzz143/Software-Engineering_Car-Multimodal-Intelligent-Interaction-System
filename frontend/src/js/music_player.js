export class MusicPlayer {
    constructor() {
        this.playlist = [
            './src/assets/music/普通朋友.mp3',
            './src/assets/music/阴天快乐.mp3',
            './src/assets/music/执迷不悟.mp3'
        ];
        this.currentTrackIndex = 0; // 当前播放的索引
        this.volume = 0.5; // 默认音量

        this.audioElement = new Audio();
        this.isPlaying = false; // 播放状态标识
        this.audioElement.addEventListener('timeupdate', () => this.updateProgressBar());
        this.audioElement.addEventListener('ended', () => this.playNext());
    }

    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        progressBar.value = (this.audioElement.currentTime / this.audioElement.duration) * 100 || 0;
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        this.audioElement.play();this.isPlaying; // 切换状态
    }

    play() {
        if (!this.audioElement.src) {
            this.audioElement.src = this.playlist[this.currentTrackIndex];

        }
        this.audioElement.play();
        document.getElementById('nowPlaying').textContent = `正在播放：${
            this.playlist[this.currentTrackIndex]
              .split(/[\\/]/) // 兼容Windows路径分隔符
              .pop()           // 获取文件名
              .split('.')[0]   // 去除后缀
          }`;
        document.getElementById('playPauseBtn').textContent = '⏸';
    }

    pause() {
        this.audioElement.pause();
        document.getElementById('playPauseBtn').textContent = '▶';
    }

    playPrev() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length; // 循环播放
        this.audioElement.src = this.playlist[this.currentTrackIndex];
        this.play();
        document.getElementById('nowPlaying').textContent = `正在播放：${
            this.playlist[this.currentTrackIndex]
              .split(/[\\/]/) // 兼容Windows路径分隔符
              .pop()           // 获取文件名
              .split('.')[0]   // 去除后缀
          }`;
    }

    playNext() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length; // 循环播放
        this.audioElement.src = this.playlist[this.currentTrackIndex];
        this.play();
        document.getElementById('nowPlaying').textContent = `正在播放：${
            this.playlist[this.currentTrackIndex]
              .split(/[\\/]/) // 兼容Windows路径分隔符
              .pop()           // 获取文件名
              .split('.')[0]   // 去除后缀
          }`;
    }

    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        progressBar.value = (this.audioElement.currentTime / this.audioElement.duration) * 100 || 0;
    }
}