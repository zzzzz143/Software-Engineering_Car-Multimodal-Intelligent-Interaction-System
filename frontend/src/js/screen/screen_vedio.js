/**
 * 视频播放器数据更新类
 * 专注于HTML内容的动态更新和视频控制
 */

import { neteaseApi } from '../service/netease_api.js';

class VideoPlayerUI {
    constructor() {
        this.currentVideoIndex = 0; // 当前播放的视频索引
        this.isPlaying = false; // 播放状态
        this.currentTime = 0; // 当前播放时间
        this.duration = 0; // 视频时长
        this.volume = 0.75; // 音量
        this.playMode = 'sequential'; // 播放模式：顺序/单曲/随机
        this.isDragging = false; // 是否正在拖动进度条
        this.isShowPlayQueue = false; // 是否显示播放队列
        this.isLoading = false; // 是否正在加载网络资源
        
        // 视频数据库
        this.videoDatabase = [
            {
                title: "普通朋友",
                artist: "陶喆",
                album: "I'm OK",
                cover: "../../../src/assets/images/cd.png",
                duration: 255, // 4:15
                videoSrc: "../../../src/assets/video/普通朋友.mp4"
            },
            {
                title: "阴天快乐",
                artist: "陈奕迅",
                album: "米·闪",
                cover: "../../../src/assets/images/cd.png",
                duration: 264, // 4:24
                videoSrc: "../../../src/assets/video/阴天快乐.mp4"
            },
            {
                title: "执迷不悟",
                artist: "小乐哥（王唯乐）",
                album: "执迷不悟",
                cover: "../../../src/assets/images/cd.png",
                duration: 234, // 3:54
                videoSrc: "../../../src/assets/video/执迷不悟.mp4"
            }
        ];

        this.initializeElements(); // 初始化DOM元素引用
        this.createVideoElement(); // 创建视频元素
        this.setupEventListeners(); // 事件监听
        this.loadCurrentVideo(); // 加载当前视频
        this.loadNeteaseVideos();// 初始化完成后，尝试从网易云加载更多视频
    }

    /**
     * 从网易云API加载视频
     * 基于网易云API获取视频资源 
     */
    async loadNeteaseVideos() {
        try {
            console.log('正在从网易云API加载视频...');
            this.isLoading = true;
            
            // 预定义一些热门视频ID用于展示 (根据你的喜好修改)
            const videoIds = [
                1472307143,
                1938019211,
                2074506156,
                1939655575
            ];
            
            // 依次获取每首歌的详细信息
            const videoPromises = videoIds.map(id => neteaseApi.getFullVideoInfo(id));
            const videos = await Promise.all(videoPromises);
            
            // 过滤掉加载失败的视频，并添加到数据库
            const validVideos = videos.filter(video => video !== null);
            this.videoDatabase = [...this.videoDatabase, ...validVideos];
            
            console.log(`✅ 成功从网易云加载 ${validVideos.length} 个视频`);
            this.isLoading = false;
        } catch (error) {
            console.error('从网易云加载视频失败:', error);
            this.isLoading = false;
        }
    }

    /**
     * 初始化DOM元素引用
     * 基于现代DOM选择器API获取页面元素
     */
    initializeElements() {
        this.elements = {
            // 视频信息元素
            albumCover: document.getElementById('albumCover'),
            videoTitle: document.getElementById('videoTitle'),
            artistName: document.getElementById('artistName'),
            albumName: document.getElementById('albumName'),
            
            // 时间显示
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            
            // 进度条
            progressFill: document.getElementById('progressFill'),
            progressThumb: document.getElementById('progressThumb'),
            progressBar: document.querySelector('.progress-bar'),
            progressTrack: document.querySelector('.progress-track'),
            
            // 控制按钮
            playPauseBtn: document.getElementById('playPauseBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            playModeBtn: document.getElementById('playModeBtn'),
            playQueueBtn: document.getElementById('playQueueBtn'),
            
            playQueueModal: document.getElementById('playQueueModal'),
            playQueueContainer: document.getElementById('playQueueContainer'),
            playQueueList: document.getElementById('playQueueList'),

            // 音量控制
            volumeFill: document.getElementById('volumeFill'),
            volumeThumb: document.getElementById('volumeThumb'),
            volumeValue: document.getElementById('volumeValue'),
            volumeBar: document.querySelector('.volume-bar'),
            volumeTrack: document.querySelector('.volume-track')
        };
    }

    /**
     * 创建视频元素
     * 基于HTML5 Video API创建视频控制器，处理视频事件监听
     */
    createVideoElement() {
        this.video = document.createElement('video');
        this.video.volume = this.volume;
        this.video.preload = 'metadata';
        
        // 视频事件监听
        this.video.addEventListener('loadedmetadata', () => {
            this.duration = this.video.duration;
            this.updateTimeDisplay(this.currentTime, this.duration);
            this.updateProgress(this.currentTime, this.duration);
        });
        
        this.video.addEventListener('timeupdate', () => {
            if (!this.isDragging) {
                this.currentTime = this.video.currentTime;
                this.updateTimeDisplay(this.currentTime, this.duration);
                this.updateProgress(this.currentTime, this.duration);
            }
        });
        
        this.video.addEventListener('ended', () => {
            this.handleVideoEnd();
        });
        
        this.video.addEventListener('play', () => {
            this.isPlaying = true;
            this.setPlayButtonState(true);
        });
        
        this.video.addEventListener('pause', () => {
            this.isPlaying = false;
            this.setPlayButtonState(false);
        });
    }

    /**
     * 加载当前视频
     * 更新界面显示和视频源，重置播放状态
     */
    loadCurrentVideo() {
        const currentVideo = this.videoDatabase[this.currentVideoIndex];
        
        // 停止当前播放
        this.stopAllPlayback();
        
        // 更新视频信息显示
        this.updateVideoInfo(currentVideo);
        
        // 设置视频源
        this.video.src = currentVideo.videoSrc;
        this.duration = currentVideo.duration;
        
        // 重置播放时间
        this.currentTime = 0;
        this.updateTimeDisplay(0, this.duration);
        this.updateProgress(0, this.duration);
        
        console.log('已加载视频:', currentVideo.title);
    }

    /**
     * 停止所有播放
     * 统一停止播放
     */
    stopAllPlayback() {
        // 停止真实视频播放
        if (this.video) {
            this.video.pause();
            this.video.currentTime = 0;
        }
        
        // 重置状态
        this.isPlaying = false;
        this.setPlayButtonState(false);
    }

    /**
     * 更新视频信息显示
     * 动态更新HTML内容的核心方法
     */
    updateVideoInfo(videoData) {
        // 更新视频标题
        this.elements.videoTitle.textContent = videoData.title || '未知视频';
        
        // 更新艺术家名称
        this.elements.artistName.textContent = videoData.artist || '未知艺术家';
        
        if (this.elements.albumName) {
            this.elements.albumName.textContent = videoData.album || '未知专辑';
        }
        
        if(this.elements.albumCover) {
            // 更新专辑封面
            if (videoData.cover) {
                this.elements.albumCover.src = videoData.cover;
                this.elements.albumCover.alt = `${videoData.title} - ${videoData.artist}`;
                
                // 处理图片加载失败
                this.elements.albumCover.onerror = () => {
                    this.elements.albumCover.src = '../../../src/assets/images/cd.png';
                };
            }
        }
    }

    /**
     * 播放/暂停控制
     * 统一处理真实视频和模拟播放的切换逻辑
     */
    togglePlayPause() {
        console.log('当前播放状态:', this.isPlaying);
        
        if (this.isPlaying) {
            // 当前正在播放，需要暂停
            this.video.pause();
        } else {
            // 当前已暂停，需要播放
            this.video.play();
        }
    }

    /**
     * 上一个视频
     * 切换到播放列表中的上一个，保持播放状态
     */
    previousVideo() {
        const wasPlaying = this.isPlaying;
        this.currentVideoIndex = (this.currentVideoIndex - 1 + this.videoDatabase.length) % this.videoDatabase.length;
        this.loadCurrentVideo();
        if (wasPlaying) {
            setTimeout(() => this.togglePlayPause(), 100);
        }
    }

    /**
     * 下一个视频
     * 切换到播放列表中的下一个，保持播放状态
     */
    nextVideo() {
        const wasPlaying = this.isPlaying;
        this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videoDatabase.length;
        this.loadCurrentVideo();
        if (wasPlaying) {
            setTimeout(() => this.togglePlayPause(), 100);
        }
    }

    /**
     * 处理视频结束
     * 根据重复模式决定下一步操作
     */
    handleVideoEnd() {
        this.stopAllPlayback();
        
        switch (this.playMode) {
            case 'sequential': // 顺序播放
                this.nextVideo();
                setTimeout(() => this.togglePlayPause(), 100);
                break;            
            case 'single': // 单曲循环
                this.currentTime = 0;
                this.video.currentTime = 0;
                setTimeout(() => this.togglePlayPause(), 100);
                break;
            case 'random': // 随机播放
                this.currentVideoIndex = Math.floor(Math.random() * this.videoDatabase.length);
                this.loadCurrentVideo();
                setTimeout(() => this.togglePlayPause(), 100);
                break;
            default:
                this.currentTime = 0;
                this.updateTimeDisplay(0, this.duration);
                this.updateProgress(0, this.duration);
        }
    }

    /**
     * 切换播放模式模式
     * 控制播放顺序的随机性
     */
    togglePlayMode() {
        const modes = ['sequential', 'single', 'random'];
        const currentIndex = modes.indexOf(this.playMode);
        this.playMode = modes[(currentIndex + 1) % modes.length];
        
        // 更新按钮图标
        switch (this.playMode) {
            case 'sequential':
                this.elements.playModeBtn.textContent = '🔁';
                break;
            case 'single':
                this.elements.playModeBtn.textContent = '🔂';
                break;
            case 'random':
                this.elements.playModeBtn.textContent = '🔀';
                break;
        }
        
        console.log('播放模式:', this.playMode);
    }

    /**
     * 更新播放时间显示
     * 实时更新时间信息的现代实现
     */
    updateTimeDisplay(currentTime, totalTime) {
        if(this.elements.currentTime){
            this.elements.currentTime.textContent = this.formatTime(currentTime);
            this.elements.totalTime.textContent = this.formatTime(totalTime);
        }
    }

    /**
     * 更新播放进度条
     * 动态更新进度条视觉效果
     */
    updateProgress(currentTime, totalTime) {
        if (totalTime <= 0) return;
        
        const progressPercent = Math.min((currentTime / totalTime) * 100, 100);
        
        this.elements.progressFill.style.width = `${progressPercent}%`;
        if(this.elements.progressThumb){
            this.elements.progressThumb.style.left = `${progressPercent}%`;
        }
    }

    /**
     * 进度条拖拽处理
     * 实现进度条的拖拽跳转功能，支持模拟和真实播放
     */
    handleProgressDrag(event) {
        const rect = this.elements.progressTrack.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const newTime = percent * this.duration;
        
        this.currentTime = newTime;
        
        // 根据播放模式更新时间
        this.video.currentTime = newTime;
        
        this.updateTimeDisplay(this.currentTime, this.duration);
        this.updateProgress(this.currentTime, this.duration);
    }

    /**
     * 切换播放队列状态
     * 显示或隐藏播放队列界面
     */
    togglePlayQueue() {
        if (this.isShowPlayQueue) {
            this.hidePlayQueue();
        } else {
            this.showPlayQueue();
        }
    }

    showPlayQueue() {
        const modal = this.elements.playQueueModal;
        const list = this.elements.playQueueList;
        
        // 清空现有列表
        list.innerHTML = '';
        
        // 渲染播放队列中的每首视频
        this.videoDatabase.forEach((video, index) => {
            const item = document.createElement('div');
            item.className = 'play-queue-item';
            
            // 设置视频信息
            item.innerHTML = `${index + 1}. ${video.title} - ${video.artist}`;
            
            // 点击视频播放
            item.addEventListener('click', () => {
                this.currentVideoIndex = index;
                this.loadCurrentVideo();
                this.hidePlayQueue();
                this.togglePlayPause();
            });
            
            // 添加到列表
            list.appendChild(item);
        });
        
        // 显示播放队列
        modal.classList.add('show');
        
        // 添加外部点击关闭监听
        document.addEventListener('click', this.handleOutsideClick);

        this.isShowPlayQueue = true;
    }
    
    hidePlayQueue() {
        const modal = this.elements.playQueueModal;
        
        modal.classList.remove('show');
        
        // 移除事件监听
        document.removeEventListener('click', this.handleOutsideClick);

        this.isShowPlayQueue = false;
    }

    handleOutsideClick = (e) => {
        const playQueueModal = document.getElementById('playQueueModal');
        const playQueueBtn = document.getElementById('playQueueBtn');
        
        if (!playQueueModal.contains(e.target) && e.target !== playQueueBtn) {
            this.hidePlayQueue();
        }
    }

    /**
     * 更新音量显示
     * 动态音量控制界面更新
     */
    updateVolumeDisplay(volume) {
        const volumePercent = Math.round(volume * 100);
        
        if(this.elements.volumeFill){
            this.elements.volumeFill.style.width = `${volumePercent}%`;
        }
        if(this.elements.volumeThumb){
            this.elements.volumeThumb.style.left = `${volumePercent}%`;
        }
        this.elements.volumeValue.textContent = `${volumePercent}%`;
        
        const volumeIcon = document.querySelector('.volume-icon');
        if (volumeIcon) {
            if (volume === 0) {
                volumeIcon.textContent = '🔇';
            } else if (volume < 0.3) {
                volumeIcon.textContent = '🔈';
            } else if (volume < 0.7) {
                volumeIcon.textContent = '🔉';
            } else {
                volumeIcon.textContent = '🔊';
            }
        }
    }

    /**
     * 音量拖拽处理
     * 实现音量条的拖拽控制功能
     */
    handleVolumeDrag(event) {
        const rect = this.elements.volumeTrack.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        
        this.volume = percent;
        this.video.volume = this.volume;
        this.updateVolumeDisplay(this.volume);
    }

    /**
     * 时间格式化工具函数
     * 将秒数转换为分:秒格式
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * 设置播放按钮状态
     * 动态更新播放/暂停按钮显示
     */
    setPlayButtonState(isPlaying) {
        this.elements.playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
        
        const albumCoverContainer = this.elements.albumCover?.closest('.album-cover');
        if (albumCoverContainer) {
            if (isPlaying) {
                albumCoverContainer.classList.add('playing');
                albumCoverContainer.classList.remove('paused');
            } else {
                albumCoverContainer.classList.remove('playing');
                albumCoverContainer.classList.add('paused');
            }
        }
    }

    /**
     * 设置事件监听器
     * 基础的用户交互事件处理
     */
    setupEventListeners() {
        // 创建安全的事件监听器添加函数
        const safeAddEventListener = (element, eventType, handler, description) => {
            if (element) {
                element.addEventListener(eventType, handler);
                console.log(`✅ ${description} 监听器已设置`);
                return true;
            } else {
                console.warn(`⚠️ ${description} 元素不存在，跳过监听器设置`);
                return false;
            }
        };

        // 播放控制按钮事件 - 检查元素存在性
        safeAddEventListener(this.elements.playPauseBtn, 'click', () => {
            this.togglePlayPause();
        }, '播放/暂停按钮');

        safeAddEventListener(this.elements.prevBtn, 'click', () => {
            this.previousVideo();
        }, '上一个按钮');

        safeAddEventListener(this.elements.nextBtn, 'click', () => {
            this.nextVideo();
        }, '下一个按钮');

        safeAddEventListener(this.elements.playModeBtn, 'click', () => {
            this.togglePlayMode();
        }, '播放模式按钮');

        // 进度条拖拽事件 - 检查进度条存在性
        if (this.elements.progressBar) {
            let isProgressDragging = false;
            
            this.elements.progressBar.addEventListener('mousedown', (e) => {
                isProgressDragging = true;
                this.isDragging = true;
                this.handleProgressDrag(e);
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isProgressDragging) {
                    this.handleProgressDrag(e);
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isProgressDragging) {
                    isProgressDragging = false;
                    this.isDragging = false;
                }
            });
            
            this.elements.progressBar.addEventListener('click', (e) => {
                if (!isProgressDragging) {
                    this.handleProgressDrag(e);
                }
            });
            
            console.log('✅ 进度条拖拽监听器已设置');
        } else {
            console.warn('⚠️ 进度条元素不存在，跳过拖拽监听器设置');
        }

        // 播放队列按钮事件 - 检查元素存在性
        if (this.elements.playQueueBtn) {
            document.getElementById('playQueueBtn').addEventListener('click', () => {
                this.togglePlayQueue();
            });
        }

        // 音量条拖拽事件 - 检查音量条存在性
        if (this.elements.volumeBar) {
            let isVolumeDragging = false;
            
            this.elements.volumeBar.addEventListener('mousedown', (e) => {
                isVolumeDragging = true;
                this.handleVolumeDrag(e);
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isVolumeDragging) {
                    this.handleVolumeDrag(e);
                }
            });
            
            document.addEventListener('mouseup', () => {
                isVolumeDragging = false;
            });
            
            this.elements.volumeBar.addEventListener('click', (e) => {
                if (!isVolumeDragging) {
                    this.handleVolumeDrag(e);
                }
            });
            
            console.log('✅ 音量条拖拽监听器已设置');
        } else {
            console.warn('⚠️ 音量条元素不存在，跳过拖拽监听器设置');
        }
    }

    /**
     * 保存播放器状态到sessionStorage
     */
    saveState() {
        try {
            const state = {
                currentVideoIndex: this.currentVideoIndex,
                isPlaying: this.isPlaying,
                currentTime: this.currentTime,
                volume: this.volume,
                playMode: this.playMode,
            };
            sessionStorage.setItem('videoPlayerState', JSON.stringify(state));
        } catch (error) {
            console.error('保存播放器状态失败:', error);
        }
    }

    /**
     * 从sessionStorage恢复播放器状态
     */
    restoreState() {
        try {
            const saved = sessionStorage.getItem('videoPlayerState');

            if (saved) {
                const state = JSON.parse(saved);
                
                // 恢复状态
                this.currentVideoIndex = state.currentVideoIndex || 0;
                this.volume = state.volume || 0.75;
                this.playMode = state.playMode || 'none';
                this.currentTime = state.currentTime || 0;
                this.isPlaying = state.isPlaying || false;
                
                // **关键：设置视频时间但不重置**
                if (this.video) {
                    this.video.currentTime = this.currentTime;
                    this.video.volume = this.volume;
                }
                
                // 更新界面显示
                this.updateVolumeDisplay(this.volume);
                this.setPlayButtonState(this.isPlaying);
                
                console.log('✅ 播放器状态已恢复 - 视频:', this.videoDatabase[this.currentVideoIndex].title, '时间:', this.formatTime(this.currentTime));
                return true;
            }
        } catch (error) {
            console.error('恢复播放器状态失败:', error);
        }
        return false;
    }
}

let videoPlayer = null;

// 页面加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', function() {
    // 创建播放器实例
    if(videoPlayer == null){
        videoPlayer = new VideoPlayerUI();
        
        // 尝试恢复之前的状态
        videoPlayer.restoreState();

        videoPlayer.loadCurrentVideo();
        
        // 初始化音量显示
        videoPlayer.updateVolumeDisplay(videoPlayer.volume);
    }
    
    console.log('视频播放器初始化完成');
    console.log('当前视频库包含', videoPlayer.videoDatabase.length, '个视频');
    
    // 每秒保存一次状态
    setInterval(() => {
        if (videoPlayer) {
            videoPlayer.saveState();
        }
    }, 1000);
});

// 页面卸载时保存状态
window.addEventListener('beforeunload', () => {
    if (videoPlayer) {
        videoPlayer.saveState();
    }
});