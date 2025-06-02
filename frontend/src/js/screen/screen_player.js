/**
 * 音乐播放器数据更新类
 * 专注于HTML内容的动态更新和音频控制
 */

import { neteaseApi } from '../service/netease_api.js';

class MusicPlayerUI {
    constructor() {
        this.currentSongIndex = 0; // 当前播放的歌曲索引
        this.isPlaying = false; // 播放状态
        this.currentTime = 0; // 当前播放时间
        this.duration = 0; // 歌曲时长
        this.volume = 0.75; // 音量
        this.playMode = 'sequential'; // 播放模式：顺序/单曲/随机
        this.isDragging = false; // 是否正在拖动进度条
        this.isShowPlayQueue = false; // 是否显示播放队列
        this.isLoading = false; // 是否正在加载网络资源
        
        // 歌曲数据库
        this.songDatabase = [
            {
                title: "普通朋友",
                artist: "陶喆",
                album: "I'm OK",
                cover: "../../../src/assets/images/cd.png",
                duration: 255, // 4:15
                audioSrc: "../../../src/assets/music/普通朋友.mp3",
                lyrics: [
                    { time: 19.713, text: "等待" },
                    { time: 22.395, text: "我随时随地在等待" },
                    { time: 27.759, text: "做你感情上的依赖" },
                    { time: 33.158, text: "我没有任何的疑问" },
                    { time: 37.894, text: "这是爱" },
                    { time: 41.308, text: "我猜" },
                    { time: 42.701, text: "你早就想要说明白" },
                    { time: 49.354, text: "我觉得自己好失败" },
                    { time: 54.578, text: "从天堂掉落到深渊" },
                    { time: 59.454, text: "多无奈" },
                    { time: 62.798, text: "我愿意改变" },
                    { time: 66.420, text: "What can I do" },
                    { time: 68.231, text: "重新再来一遍" },
                    { time: 71.122, text: "Just give me a chance" },
                    { time: 73.630, text: "我无法只是普通朋友" },
                    { time: 79.063, text: "感情已那么深" },
                    { time: 81.432, text: "叫我怎么能放手" },
                    { time: 86.447, text: "但你说爱" },
                    { time: 89.896, text: "I only want to be your friend" },
                    { time: 94.563, text: "做个朋友" },
                    { time: 97.906, text: "我在" },
                    { time: 98.951, text: "你心中只是" },
                    { time: 102.295, text: "Just a friend" },
                    { time: 105.325, text: "不是情人" },
                    { time: 108.704, text: "我感激你对我这样的坦白" },
                    { time: 113.824, text: "但我给你的爱暂时收不回来" },
                    { time: 119.501, text: "So I" },
                    { time: 121.869, text: "我不能只是" },
                    { time: 123.890, text: "Be your friend" },
                    { time: 129.323, text: "I just can't be your friend" },
                    { time: 135.697, text: "我猜" },
                    { time: 138.379, text: "你早就想要说明白" },
                    { time: 143.743, text: "我觉得自己好失败" },
                    { time: 149.176, text: "从天堂掉落到深渊" },
                    { time: 153.913, text: "多无奈" },
                    { time: 157.222, text: "我愿意改变" },
                    { time: 160.635, text: "What can I do" },
                    { time: 162.655, text: "重新再来一遍" },
                    { time: 165.337, text: "Just give me a chance" },
                    { time: 168.019, text: "我无法只是普通朋友" },
                    { time: 173.418, text: "感情已那么深" },
                    { time: 175.786, text: "叫我怎么能放手" },
                    { time: 180.802, text: "但你说爱" },
                    { time: 184.250, text: "I only want to be your friend" },
                    { time: 188.952, text: "做个朋友" },
                    { time: 192.261, text: "我在" },
                    { time: 193.340, text: "你心中只是" },
                    { time: 196.684, text: "Just a friend" },
                    { time: 199.714, text: "不是情人" },
                    { time: 203.058, text: "我感激你对我这样的坦白" },
                    { time: 208.491, text: "但我给你的爱暂时收不回来" },
                    { time: 213.925, text: "So I" },
                    { time: 215.248, text: "我不能只是" },
                    { time: 218.279, text: "Be your friend" },
                    { time: 226.324, text: "I just can't be your friend" },
                    { time: 231.061, text: "No no no" },
                    { time: 236.530, text: "不能只是做你的朋友" },
                    { time: 242.799, text: "不能做普通朋友" }
                ]
            },
            {
                title: "阴天快乐",
                artist: "陈奕迅",
                album: "米·闪",
                cover: "../../../src/assets/images/cd.png",
                duration: 264, // 4:24
                audioSrc: "../../../src/assets/music/阴天快乐.mp3",
                lyrics: [
                    { time: 21.002, text: "天空它像什么" },
                    { time: 24.694, text: "爱情就像什么" },
                    { time: 28.386, text: "几朵云在阴天忘了该往哪儿走" },
                    { time: 35.805, text: "思念和寂寞" },
                    { time: 38.556, text: "被吹进了左耳" },
                    { time: 42.213, text: "也许我记不住" },
                    { time: 44.094, text: "可是也忘不掉那时候" },
                    { time: 47.786, text: "那种秘密的快乐" },
                    { time: 54.195, text: "听阴天说什么" },
                    { time: 57.922, text: "在昏暗中的我" },
                    { time: 62.101, text: "想对着天讲 说无论如何" },
                    { time: 65.828, text: "阴天快乐" },
                    { time: 68.998, text: "叫阴天别闹了" },
                    { time: 72.690, text: "想念你都那么久那么久了" },
                    { time: 76.869, text: "我一抬头 就看见你" },
                    { time: 80.596, text: "那个酒窝" },
                    { time: 96.687, text: "翻山越岭之后" },
                    { time: 100.379, text: "爱却神出鬼没" },
                    { time: 104.071, text: "你像一首唱到沙哑偏爱的情歌" },
                    { time: 111.490, text: "旅途中坐一坐" },
                    { time: 114.277, text: "在秋千上的我" },
                    { time: 117.864, text: "原来我忽略的如今想纪念也没用" },
                    { time: 123.472, text: "那些时光的因果" },
                    { time: 128.069, text: "听阴天说什么" },
                    { time: 131.761, text: "在昏暗中的我" },
                    { time: 135.697, text: "想对着天讲 说无论如何" },
                    { time: 139.598, text: "阴天快乐" },
                    { time: 142.837, text: "叫阴天别闹了" },
                    { time: 146.564, text: "想念你都那么久那么久了" },
                    { time: 150.778, text: "我一抬头 就看见你" },
                    { time: 154.435, text: "那个酒窝" },
                    { time: 159.277, text: "过去穿过了现在" },
                    { time: 162.272, text: "绕过了未来缝在心海中" },
                    { time: 166.870, text: "带着你我旅行变成老头" },
                    { time: 174.254, text: "孤单怕成了习惯" },
                    { time: 177.040, text: "所以我淡定走在人海中" },
                    { time: 181.672, text: "偶尔想看云飞却没风" },
                    { time: 187.141, text: "听阴天说什么" },
                    { time: 190.833, text: "在昏暗中的我" },
                    { time: 194.977, text: "想对着天讲 说无论如何" },
                    { time: 198.739, text: "阴天快乐" },
                    { time: 201.909, text: "叫阴天别闹了" },
                    { time: 205.635, text: "想念你都那么久那么久了" },
                    { time: 209.815, text: "我一抬头 就看见了 当时的我" }
                ]
            },
            {
                title: "执迷不悟",
                artist: "小乐哥（王唯乐）",
                album: "执迷不悟",
                cover: "../../../src/assets/images/cd.png",
                duration: 234, // 3:54
                audioSrc: "../../../src/assets/music/执迷不悟.mp3",
                lyrics: [
                    { time: 2.194, text: "我对你又何止是执迷不悟" },
                    { time: 5.085, text: "眼泪偶尔会莫名的光顾" },
                    { time: 8.881, text: "所以会忙忙碌碌将爱麻木" },
                    { time: 12.887, text: "可突然会想起了全部" },
                    { time: 17.937, text: "想你的雨夜车窗起雾" },
                    { time: 21.699, text: "手指写完了名字才哭" },
                    { time: 25.913, text: "我可以勉强做主试图大度" },
                    { time: 28.908, text: "却说不出你婚礼的祝福" },
                    { time: 33.889, text: "曾经的我们也被人羡慕" },
                    { time: 37.407, text: "丈量过夜色笼罩的路" },
                    { time: 41.900, text: "那一棵很高的树在不远处" },
                    { time: 44.512, text: "在它面前停下过脚步" },
                    { time: 47.821, text: "我对你又何止是执迷不悟" },
                    { time: 53.115, text: "眼泪偶尔会莫名的光顾" },
                    { time: 56.877, text: "所以会忙忙碌碌将爱麻木" },
                    { time: 60.917, text: "可突然会想起了全部" },
                    { time: 65.933, text: "我对你又何止是执迷不悟" },
                    { time: 68.928, text: "所有的纪念日记得清楚" },
                    { time: 72.933, text: "庸人自扰的束缚狼狈演出" },
                    { time: 76.904, text: "突然还会想起了全部" },
                    { time: 97.906, text: "想你的雨夜车窗起雾" },
                    { time: 101.389, text: "手指写完了名字才哭" },
                    { time: 105.917, text: "我可以勉强做主试图大度" },
                    { time: 108.913, text: "却说不出你婚礼的祝福" },
                    { time: 113.928, text: "曾经的我们也被人羡慕" },
                    { time: 117.411, text: "丈量过夜色笼罩的路" },
                    { time: 121.904, text: "那一棵很高的树在不远处" },
                    { time: 124.900, text: "在它面前停下过脚步" },
                    { time: 130.159, text: "我对你又何止是执迷不悟" },
                    { time: 133.120, text: "眼泪偶尔会莫名的光顾" },
                    { time: 136.916, text: "所以会忙忙碌碌将爱麻木" },
                    { time: 140.921, text: "可突然会想起了全部" },
                    { time: 145.937, text: "我对你又何止是执迷不悟" },
                    { time: 148.932, text: "所有的纪念日记得清楚" },
                    { time: 152.938, text: "庸人自扰的束缚狼狈演出" },
                    { time: 156.943, text: "突然还会想起了全部" },
                    { time: 178.155, text: "我对你又何止是执迷不悟" },
                    { time: 181.045, text: "眼泪偶尔会莫名的光顾" },
                    { time: 184.912, text: "所以会忙忙碌碌将爱麻木" },
                    { time: 188.917, text: "可突然会想起了全部" },
                    { time: 193.933, text: "我对你又何止是执迷不悟" },
                    { time: 196.928, text: "所有的纪念日记得清楚" },
                    { time: 200.933, text: "庸人自扰的束缚狼狈演出" },
                    { time: 204.904, text: "突然还会想起了全部" }
                ]
            }
        ];

        this.initializeElements(); // 初始化DOM元素引用
        this.createAudioElement(); // 创建音频元素
        this.setupEventListeners(); // 事件监听
        this.loadCurrentSong(); // 加载当前歌曲
        this.loadNeteaseSongs();// 初始化完成后，尝试从网易云加载更多歌曲
    }

    /**
     * 从网易云API加载歌曲
     * 基于网易云API获取音乐资源 
     */
    async loadNeteaseSongs() {
        try {
            console.log('正在从网易云API加载歌曲...');
            this.isLoading = true;
            
            // 预定义一些热门歌曲ID用于展示 (根据你的喜好修改)
            const songIds = [
                1472307143,
                1938019211,
                2074506156,
                1939655575
            ];
            
            // 依次获取每首歌的详细信息
            const songPromises = songIds.map(id => neteaseApi.getFullSongInfo(id));
            const songs = await Promise.all(songPromises);
            
            // 过滤掉加载失败的歌曲，并添加到数据库
            const validSongs = songs.filter(song => song !== null);
            this.songDatabase = [...this.songDatabase, ...validSongs];
            
            console.log(`✅ 成功从网易云加载 ${validSongs.length} 首歌曲`);
            this.isLoading = false;
        } catch (error) {
            console.error('从网易云加载歌曲失败:', error);
            this.isLoading = false;
        }
    }

    /**
     * 初始化DOM元素引用
     * 基于现代DOM选择器API获取页面元素
     */
    initializeElements() {
        this.elements = {
            // 歌曲信息元素
            albumCover: document.getElementById('albumCover'),
            songTitle: document.getElementById('songTitle'),
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
            volumeTrack: document.querySelector('.volume-track'),
            
            // 歌词容器
            lyricsContainer: document.getElementById('lyricsContainer'),

            // 搜索功能
            searchInput: document.getElementById('songSearchInput'),
            searchButton: document.getElementById('songSearchButton'),
        };
    }

    /**
     * 创建音频元素
     * 基于HTML5 Audio API创建音频控制器，处理音频事件监听
     */
    createAudioElement() {
        this.audio = new Audio();
        this.audio.volume = this.volume;
        this.audio.preload = 'metadata';
        
        // 音频事件监听
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateTimeDisplay(this.currentTime, this.duration);
            this.updateProgress(this.currentTime, this.duration);
        });
        
        this.audio.addEventListener('timeupdate', () => {
            if (!this.isDragging) {
                this.currentTime = this.audio.currentTime;
                this.updateTimeDisplay(this.currentTime, this.duration);
                this.updateProgress(this.currentTime, this.duration);
                this.highlightCurrentLyric(this.currentTime);
            }
        });
        
        this.audio.addEventListener('ended', () => {
            this.handleSongEnd();
        });
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.setPlayButtonState(true);
            
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.setPlayButtonState(false);
        });
    }

    /**
     * 加载当前歌曲
     * 更新界面显示和音频源，重置播放状态
     */
    loadCurrentSong() {
        const currentSong = this.songDatabase[this.currentSongIndex];
        
        // 停止当前播放
        this.stopAllPlayback();
        
        // 更新歌曲信息显示
        this.updateSongInfo(currentSong);
        
        // 更新歌词
        this.updateLyrics(currentSong.lyrics);
        
        // 设置音频源
        this.audio.src = currentSong.audioSrc;
        this.duration = currentSong.duration;
        
        // 重置播放时间
        this.currentTime = 0;
        this.updateTimeDisplay(0, this.duration);
        this.updateProgress(0, this.duration);
        
        console.log('已加载歌曲:', currentSong.title);
    }

    /**
     * 停止所有播放
     * 统一停止播放
     */
    stopAllPlayback() {
        // 停止真实音频播放
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        
        // 重置状态
        this.isPlaying = false;
        this.setPlayButtonState(false);
    }

    /**
     * 更新歌曲信息显示
     * 动态更新HTML内容的核心方法
     */
    updateSongInfo(songData) {
        // 更新歌曲标题
        this.elements.songTitle.textContent = songData.title || '未知歌曲';
        
        // 更新艺术家名称
        this.elements.artistName.textContent = songData.artist || '未知艺术家';
        
        if (this.elements.albumName) {
            this.elements.albumName.textContent = songData.album || '未知专辑';
        }
        
        if(this.elements.albumCover) {
            // 更新专辑封面
            if (songData.cover) {
                this.elements.albumCover.src = songData.cover;
                this.elements.albumCover.alt = `${songData.title} - ${songData.artist}`;
                
                // 处理图片加载失败
                this.elements.albumCover.onerror = () => {
                    this.elements.albumCover.src = '../../../src/assets/images/cd.png';
                };
            }
        }
    }

    /**
     * 播放/暂停控制
     * 统一处理真实音频和模拟播放的切换逻辑
     */
    togglePlayPause() {
        console.log('当前播放状态:', this.isPlaying);
        
        if (this.isPlaying) {
            // 当前正在播放，需要暂停
            this.audio.pause();
        } else {
            // 当前已暂停，需要播放
            this.audio.play();
        }
    }

    /**
     * 上一首歌曲
     * 切换到播放列表中的上一首，保持播放状态
     */
    previousSong() {
        const wasPlaying = this.isPlaying;
        this.currentSongIndex = (this.currentSongIndex - 1 + this.songDatabase.length) % this.songDatabase.length;
        this.loadCurrentSong();
        if (wasPlaying) {
            setTimeout(() => this.togglePlayPause(), 100);
        }
    }

    /**
     * 下一首歌曲
     * 切换到播放列表中的下一首，保持播放状态
     */
    nextSong() {
        const wasPlaying = this.isPlaying;
        this.currentSongIndex = (this.currentSongIndex + 1) % this.songDatabase.length;
        this.loadCurrentSong();
        if (wasPlaying) {
            setTimeout(() => this.togglePlayPause(), 100);
        }
    }

    /**
     * 处理歌曲结束
     * 根据重复模式决定下一步操作
     */
    handleSongEnd() {
        this.stopAllPlayback();
        
        switch (this.playMode) {
            case 'sequential': // 顺序播放
                this.nextSong();
                setTimeout(() => this.togglePlayPause(), 100);
                break;            
            case 'single': // 单曲循环
                this.currentTime = 0;
                this.audio.currentTime = 0;
                setTimeout(() => this.togglePlayPause(), 100);
                break;
            case 'random': // 随机播放
                this.currentSongIndex = Math.floor(Math.random() * this.songDatabase.length);
                this.loadCurrentSong();
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
        this.audio.currentTime = newTime;
        
        this.updateTimeDisplay(this.currentTime, this.duration);
        this.updateProgress(this.currentTime, this.duration);
        this.highlightCurrentLyric(this.currentTime);
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
        
        // 渲染播放队列中的每首歌曲
        this.songDatabase.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'play-queue-item';
            
            // 设置歌曲信息
            item.innerHTML = `${index + 1}. ${song.title} - ${song.artist}`;
            
            // 点击歌曲播放
            item.addEventListener('click', () => {
                this.currentSongIndex = index;
                this.loadCurrentSong();
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
        this.audio.volume = this.volume;
        this.updateVolumeDisplay(this.volume);
    }

    /**
     * 更新歌词显示
     * 动态歌词内容渲染和同步
     */
    updateLyrics(lyricsArray, currentTime = 0) {
        if(this.elements.lyricsContainer){
            const lyricsScroll = this.elements.lyricsContainer.querySelector('.lyrics-scroll');
        
            lyricsScroll.innerHTML = '';
            
            lyricsArray.forEach((lyric, index) => {
                const lyricElement = document.createElement('div');
                lyricElement.className = 'lyric-line';
                lyricElement.dataset.time = lyric.time;
                lyricElement.dataset.index = index;
                lyricElement.textContent = lyric.text;
                
                if (lyric.time <= currentTime && 
                    (index === lyricsArray.length - 1 || lyricsArray[index + 1].time > currentTime)) {
                    lyricElement.classList.add('active');
                }
                
                lyricsScroll.appendChild(lyricElement);
            });
        }
        
    }

    /**
     * 高亮当前歌词行
     * 基于时间同步的歌词高亮更新
     */
    highlightCurrentLyric(currentTime) {
        if(this.elements.lyricsContainer){
            const lyricLines = this.elements.lyricsContainer.querySelectorAll('.lyric-line');
        
            lyricLines.forEach(line => {
                const lyricTime = parseFloat(line.dataset.time);
                const nextLine = line.nextElementSibling;
                const nextTime = nextLine ? parseFloat(nextLine.dataset.time) : Infinity;
                
                line.classList.remove('active');
                
                if (lyricTime <= currentTime && currentTime < nextTime) {
                    line.classList.add('active');
                    
                    line.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            });
        }
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
            this.previousSong();
        }, '上一首按钮');

        safeAddEventListener(this.elements.nextBtn, 'click', () => {
            this.nextSong();
        }, '下一首按钮');

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

        // 歌词点击跳转事件 - 检查歌词容器存在性
        if (this.elements.lyricsContainer) {
            this.elements.lyricsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('lyric-line')) {
                    const time = parseFloat(e.target.dataset.time);
                    this.currentTime = time;
                    
                    this.audio.currentTime = time;
                    
                    this.updateTimeDisplay(this.currentTime, this.duration);
                    this.updateProgress(this.currentTime, this.duration);
                    this.highlightCurrentLyric(this.currentTime);
                }
            });
            
            console.log('✅ 歌词容器点击监听器已设置');
        } else {
            console.warn('⚠️ 歌词容器元素不存在，跳过点击监听器设置');
        }

        // 设置搜索功能事件监听
        const searchInput = document.getElementById('songSearchInput');
        const searchButton = document.getElementById('songSearchButton');
        
        if (searchInput && searchButton) {
            // 点击搜索按钮执行搜索
            searchButton.addEventListener('click', () => {
                const keyword = searchInput.value.trim();
                if (keyword) {
                    this.searchSongs(keyword);
                }
            });
            
            // 按下回车键执行搜索
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const keyword = searchInput.value.trim();
                    if (keyword) {
                        this.searchSongs(keyword);
                    }
                }
            });
            
            console.log('✅ 搜索功能监听器已设置');
        } else {
            console.warn('⚠️ 搜索元素不存在，跳过搜索监听器设置');
        }
    }

    /**
     * 保存播放器状态到sessionStorage
     */
    saveState() {
        try {
            const state = {
                currentSongIndex: this.currentSongIndex,
                isPlaying: this.isPlaying,
                currentTime: this.currentTime,
                volume: this.volume,
                playMode: this.playMode,
            };
            sessionStorage.setItem('musicPlayerState', JSON.stringify(state));
        } catch (error) {
            console.error('保存播放器状态失败:', error);
        }
    }

    /**
     * 从sessionStorage恢复播放器状态
     */
    restoreState() {
        try {
            const saved = sessionStorage.getItem('musicPlayerState');

            if (saved) {
                const state = JSON.parse(saved);
                
                // 恢复状态
                this.currentSongIndex = state.currentSongIndex || 0;
                this.volume = state.volume || 0.75;
                this.playMode = state.playMode || 'none';
                this.currentTime = state.currentTime || 0;
                this.isPlaying = state.isPlaying || false;
                
                // **关键：设置音频时间但不重置**
                if (this.audio) {
                    this.audio.currentTime = this.currentTime;
                    this.audio.volume = this.volume;
                }
                
                // 更新界面显示
                this.updateVolumeDisplay(this.volume);
                this.setPlayButtonState(this.isPlaying);
                
                console.log('✅ 播放器状态已恢复 - 歌曲:', this.songDatabase[this.currentSongIndex].title, '时间:', this.formatTime(this.currentTime));
                return true;
            }
        } catch (error) {
            console.error('恢复播放器状态失败:', error);
        }
        return false;
    }

    /**
     * 通过关键词搜索歌曲
     * @param {string} keyword - 搜索关键词
     */
    async searchSongs(keyword) {
        try {
            if (!keyword.trim()) {
                return;
            }
            
            console.log(`正在搜索歌曲: ${keyword}`);
            this.isLoading = true;
            
            // 显示加载状态
            if (this.elements.lyricsContainer) {
                const lyricsScroll = this.elements.lyricsContainer.querySelector('.lyrics-scroll');
                if (lyricsScroll) {
                    lyricsScroll.innerHTML = '<div class="search-loading">搜索中，请稍候...</div>';
                }
            }
            
            // 执行搜索
            const searchResults = await neteaseApi.searchSongs(keyword, 5);
            
            if (searchResults.length === 0) {
                if (this.elements.lyricsContainer) {
                    const lyricsScroll = this.elements.lyricsContainer.querySelector('.lyrics-scroll');
                    if (lyricsScroll) {
                        lyricsScroll.innerHTML = '<div class="no-results">未找到相关歌曲</div>';
                    }
                }
                this.isLoading = false;
                return;
            }
            
            // 显示搜索结果
            if (this.elements.lyricsContainer) {
                const lyricsScroll = this.elements.lyricsContainer.querySelector('.lyrics-scroll');
                if (lyricsScroll) {
                    lyricsScroll.innerHTML = '';
                    
                    const searchHeader = document.createElement('div');
                    searchHeader.className = 'search-header';
                    searchHeader.textContent = `搜索结果: "${keyword}"`;
                    lyricsScroll.appendChild(searchHeader);
                    
                    // 为每个搜索结果创建一个可点击的项目
                    searchResults.forEach((song, index) => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'search-result-item';
                        resultItem.dataset.songId = song.id;
                        resultItem.dataset.index = index;
                        resultItem.innerHTML = `
                            <div class="song-title">${song.title}</div>
                            <div class="song-artist">${song.artist}</div>
                        `;
                        
                        // 点击加载歌曲
                        resultItem.addEventListener('click', () => {
                            this.loadSongById(song.id);
                        });
                        
                        lyricsScroll.appendChild(resultItem);
                    });
                }
            }
            
            this.isLoading = false;
        } catch (error) {
            console.error('搜索歌曲失败:', error);
            this.isLoading = false;
            
            // 显示错误信息
            if (this.elements.lyricsContainer) {
                const lyricsScroll = this.elements.lyricsContainer.querySelector('.lyrics-scroll');
                if (lyricsScroll) {
                    lyricsScroll.innerHTML = '<div class="search-error">搜索失败，请稍后重试</div>';
                }
            }
        }
    }
    
    /**
     * 通过网易云音乐ID加载歌曲
     * @param {number} id - 网易云歌曲ID
     */
    async loadSongById(id) {
        try {
            // 显示加载状态
            if (this.elements.lyricsContainer) {
                const lyricsScroll = this.elements.lyricsContainer.querySelector('.lyrics-scroll');
                if (lyricsScroll) {
                    lyricsScroll.innerHTML = '<div class="loading">加载歌曲中...</div>';
                }
            }
            
            // 加载新歌曲
            const songInfo = await neteaseApi.getFullSongInfo(id);
            
            if (!songInfo) {
                throw new Error('无法加载歌曲');
            }
            
            // 检查是否已经在数据库中
            const existingIndex = this.songDatabase.findIndex(song => song.id === songInfo.id);
            
            if (existingIndex >= 0) {
                // 歌曲已存在，直接切换到该索引
                this.currentSongIndex = existingIndex;
            } else {
                // 添加新歌曲到数据库并切换
                this.songDatabase.push(songInfo);
                this.currentSongIndex = this.songDatabase.length - 1;
            }
            
            // 加载歌曲
            this.stopAllPlayback();
            this.loadCurrentSong();
            this.togglePlayPause();
            
        } catch (error) {
            console.error('加载歌曲失败:', error);
            
            // 显示错误信息
            if (this.elements.lyricsContainer) {
                const lyricsScroll = this.elements.lyricsContainer.querySelector('.lyrics-scroll');
                if (lyricsScroll) {
                    lyricsScroll.innerHTML = '<div class="load-error">加载歌曲失败，请稍后重试</div>';
                }
            }
        }
    }
}

let musicPlayer = null;

// 页面加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', function() {
    // 创建播放器实例
    if(musicPlayer == null){
        musicPlayer = new MusicPlayerUI();
        
        // 尝试恢复之前的状态
        musicPlayer.restoreState();

        musicPlayer.loadCurrentSong();
        
        // 初始化音量显示
        musicPlayer.updateVolumeDisplay(musicPlayer.volume);
    }
    
    console.log('音乐播放器初始化完成');
    console.log('当前歌曲库包含', musicPlayer.songDatabase.length, '首歌曲');
    
    // 每秒保存一次状态
    setInterval(() => {
        if (musicPlayer) {
            musicPlayer.saveState();
        }
    }, 1000);
});

// 页面卸载时保存状态
window.addEventListener('beforeunload', () => {
    if (musicPlayer) {
        musicPlayer.saveState();
    }
});
