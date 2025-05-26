/**
 * 音乐播放器数据更新类
 * 专注于HTML内容的动态更新和音频控制
 */
class MusicPlayerUI {
    constructor() {
        this.currentSongIndex = 0;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.75;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.isShuffled = false;
        this.isDragging = false;
        this.isSimulating = false; // 新增：标记是否在模拟播放模式
        
        // 模拟歌曲数据库
        this.songDatabase = [
            {
                title: "沙文",
                artist: "林忆莲",
                album: "专辑1",
                cover: "../src/assets/images/cd.png",
                duration: 272, // 4:32
                audioSrc: "../src/assets/audio/song1.mp3",
                lyrics: [
                    { time: 0, text: "夜空中最亮的星" },
                    { time: 5, text: "能否听清" },
                    { time: 8, text: "那仰望的人" },
                    { time: 12, text: "心底的孤独和叹息" },
                    { time: 18, text: "夜空中最亮的星" },
                    { time: 23, text: "能否记起" },
                    { time: 26, text: "曾与我同行" },
                    { time: 30, text: "消失在风里的身影" },
                    { time: 36, text: "我祈祷拥有一颗透明的心灵" },
                    { time: 42, text: "和会流泪的眼睛" },
                    { time: 48, text: "给我再去相信的勇气" },
                    { time: 54, text: "越过谎言去拥抱你" },
                    { time: 60, text: "每当我找不到存在的意义" },
                    { time: 66, text: "每当我迷失在黑夜里" },
                    { time: 72, text: "夜空中最亮的星" },
                    { time: 78, text: "请指引我靠近你" }
                ]
            },
            {
                title: "Between The Bars",
                artist: "Elliott Smith",
                album: "专辑3",
                cover: "../src/assets/images/cd3.png",
                duration: 246, // 4:06
                audioSrc: "../src/assets/audio/song3.mp3",
                lyrics: [
                    { time: 0, text: "你在南方的艳阳里" },
                    { time: 4, text: "大雪纷飞" },
                    { time: 8, text: "我在北方的寒夜里" },
                    { time: 12, text: "四季如春" },
                    { time: 16, text: "如果天黑之前来得及" },
                    { time: 20, text: "我要忘了你的眼睛" }
                ]
            },
            {
                title: "格雷的画像",
                artist: "韦礼安",
                album: "专辑2",
                cover: "../src/assets/images/cd2.png",
                duration: 327, // 5:27
                audioSrc: "../src/assets/audio/song2.mp3",
                lyrics: [
                    { time: 0, text: "让我掉下眼泪的" },
                    { time: 4, text: "不止昨夜的酒" },
                    { time: 8, text: "让我依依不舍的" },
                    { time: 12, text: "不止你的温柔" },
                    { time: 16, text: "余路还要走多久" },
                    { time: 20, text: "你攥着我的手" },
                    { time: 24, text: "让我感到为难的" },
                    { time: 28, text: "是挣扎的自由" }
                ]
            }
        ];
        
        this.initializeElements();
        this.createAudioElement();
        this.setupEventListeners();
        this.loadCurrentSong();
    }

    /**
     * 创建音频元素
     * 基于HTML5 Audio API创建音频控制器，处理音频事件监听 [[1]](#__1)
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
            if (!this.isDragging && !this.isSimulating) {
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
            if (!this.isSimulating) {
                this.isPlaying = true;
                this.setPlayButtonState(true);
            }
        });
        
        this.audio.addEventListener('pause', () => {
            if (!this.isSimulating) {
                this.isPlaying = false;
                this.setPlayButtonState(false);
            }
        });
    }

    /**
     * 初始化DOM元素引用
     * 基于现代DOM选择器API获取页面元素 [[2]](#__2)
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
            shuffleBtn: document.getElementById('shuffleBtn'),
            repeatBtn: document.getElementById('repeatBtn'),
            
            // 音量控制
            volumeFill: document.getElementById('volumeFill'),
            volumeThumb: document.getElementById('volumeThumb'),
            volumeValue: document.getElementById('volumeValue'),
            volumeBar: document.querySelector('.volume-bar'),
            volumeTrack: document.querySelector('.volume-track'),
            
            // 歌词容器
            lyricsContainer: document.getElementById('lyricsContainer'),
        };
    }

    /**
     * 加载当前歌曲
     * 更新界面显示和音频源，重置播放状态 [[3]](#__3)
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
     * 统一停止真实音频和模拟播放 [[0]](#__0)
     */
    stopAllPlayback() {
        // 停止真实音频播放
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        
        // 停止模拟播放
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }
        
        // 重置状态
        this.isPlaying = false;
        this.isSimulating = false;
        this.setPlayButtonState(false);
    }

    /**
     * 更新歌曲信息显示
     * 动态更新HTML内容的核心方法 [[1]](#__1)
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
                    this.elements.albumCover.src = '../src/assets/images/cd.png';
                };
            }
        }
    }

    /**
     * 播放/暂停控制
     * 统一处理真实音频和模拟播放的切换逻辑 [[2]](#__2)
     */
    togglePlayPause() {
        console.log('当前播放状态:', this.isPlaying, '模拟模式:', this.isSimulating);
        
        if (this.isPlaying) {
            // 当前正在播放，需要暂停
            if (this.isSimulating) {
                this.pauseSimulatePlayback();
            } else {
                this.audio.pause();
            }
        } else {
            // 当前已暂停，需要播放
            if (this.isSimulating) {
                this.resumeSimulatePlayback();
            } else {
                this.audio.play().catch(error => {
                    console.error('播放失败，切换到模拟模式:', error);
                    this.startSimulatePlayback();
                });
            }
        }
    }

    /**
     * 开始模拟播放
     * 当音频文件不存在时启动模拟播放模式 [[3]](#__3)
     */
    startSimulatePlayback() {
        console.log('开始模拟播放');
        this.isSimulating = true;
        this.isPlaying = true;
        this.setPlayButtonState(true);
        
        this.playbackTimer = setInterval(() => {
            if (this.isPlaying && !this.isDragging) {
                this.currentTime += 1;
                
                if (this.currentTime >= this.duration) {
                    this.currentTime = this.duration;
                    this.handleSongEnd();
                    return;
                }
                
                this.updateTimeDisplay(this.currentTime, this.duration);
                this.updateProgress(this.currentTime, this.duration);
                this.highlightCurrentLyric(this.currentTime);
            }
        }, 1000);
    }

    /**
     * 暂停模拟播放
     * 暂停模拟播放但保持定时器和状态 [[0]](#__0)
     */
    pauseSimulatePlayback() {
        console.log('暂停模拟播放');
        this.isPlaying = false;
        this.setPlayButtonState(false);
        // 注意：不清除定时器，只是暂停状态
    }

    /**
     * 恢复模拟播放
     * 从暂停状态恢复模拟播放 [[1]](#__1)
     */
    resumeSimulatePlayback() {
        console.log('恢复模拟播放');
        this.isPlaying = true;
        this.setPlayButtonState(true);
        
        // 如果定时器不存在，重新创建
        if (!this.playbackTimer) {
            this.playbackTimer = setInterval(() => {
                if (this.isPlaying && !this.isDragging) {
                    this.currentTime += 1;
                    
                    if (this.currentTime >= this.duration) {
                        this.currentTime = this.duration;
                        this.handleSongEnd();
                        return;
                    }
                    
                    this.updateTimeDisplay(this.currentTime, this.duration);
                    this.updateProgress(this.currentTime, this.duration);
                    this.highlightCurrentLyric(this.currentTime);
                }
            }, 1000);
        }
    }

    /**
     * 停止模拟播放
     * 完全停止模拟播放并清理资源 [[2]](#__2)
     */
    stopSimulatePlayback() {
        console.log('停止模拟播放');
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }
        this.isPlaying = false;
        this.isSimulating = false;
        this.setPlayButtonState(false);
    }

    /**
     * 上一首歌曲
     * 切换到播放列表中的上一首，保持播放状态 [[3]](#__3)
     */
    previousSong() {
        const wasPlaying = this.isPlaying;
        
        if (this.isShuffled) {
            this.currentSongIndex = Math.floor(Math.random() * this.songDatabase.length);
        } else {
            this.currentSongIndex = (this.currentSongIndex - 1 + this.songDatabase.length) % this.songDatabase.length;
        }
        
        this.loadCurrentSong();
        
        if (wasPlaying) {
            setTimeout(() => this.togglePlayPause(), 100);
        }
    }

    /**
     * 下一首歌曲
     * 切换到播放列表中的下一首，保持播放状态 [[0]](#__0)
     */
    nextSong() {
        const wasPlaying = this.isPlaying;
        
        if (this.isShuffled) {
            this.currentSongIndex = Math.floor(Math.random() * this.songDatabase.length);
        } else {
            this.currentSongIndex = (this.currentSongIndex + 1) % this.songDatabase.length;
        }
        
        this.loadCurrentSong();
        
        if (wasPlaying) {
            setTimeout(() => this.togglePlayPause(), 100);
        }
    }

    /**
     * 处理歌曲结束
     * 根据重复模式决定下一步操作 [[1]](#__1)
     */
    handleSongEnd() {
        this.stopAllPlayback();
        
        switch (this.repeatMode) {
            case 'one':
                this.currentTime = 0;
                this.audio.currentTime = 0;
                setTimeout(() => this.togglePlayPause(), 100);
                break;
            case 'all':
                this.nextSong();
                break;
            default:
                this.currentTime = 0;
                this.updateTimeDisplay(0, this.duration);
                this.updateProgress(0, this.duration);
        }
    }

    /**
     * 切换随机播放模式
     * 控制播放顺序的随机性 [[2]](#__2)
     */
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.setShuffleButtonState(this.isShuffled);
        console.log('随机播放:', this.isShuffled ? '开启' : '关闭');
    }

    /**
     * 切换重复播放模式
     * 循环切换重复模式 [[3]](#__3)
     */
    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        this.setRepeatButtonState(this.repeatMode);
        console.log('重复模式:', this.repeatMode);
    }

    /**
     * 更新播放时间显示
     * 实时更新时间信息的现代实现 [[0]](#__0)
     */
    updateTimeDisplay(currentTime, totalTime) {
        if(this.elements.currentTime){
            this.elements.currentTime.textContent = this.formatTime(currentTime);
            this.elements.totalTime.textContent = this.formatTime(totalTime);
        }
    }

    /**
     * 更新播放进度条
     * 动态更新进度条视觉效果 [[1]](#__1)
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
     * 实现进度条的拖拽跳转功能，支持模拟和真实播放 [[2]](#__2)
     */
    handleProgressDrag(event) {
        const rect = this.elements.progressTrack.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const newTime = percent * this.duration;
        
        this.currentTime = newTime;
        
        // 根据播放模式更新时间
        if (!this.isSimulating) {
            this.audio.currentTime = newTime;
        }
        
        this.updateTimeDisplay(this.currentTime, this.duration);
        this.updateProgress(this.currentTime, this.duration);
        this.highlightCurrentLyric(this.currentTime);
    }

    /**
     * 更新音量显示
     * 动态音量控制界面更新 [[3]](#__3)
     */
    updateVolumeDisplay(volume) {
        const volumePercent = Math.round(volume * 100);
        
        if(this.elements.volumeFill){
            tthis.elements.volumeFill.style.width = `${volumePercent}%`;
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
     * 实现音量条的拖拽控制功能 [[0]](#__0)
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
     * 动态歌词内容渲染和同步 [[1]](#__1)
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
     * 基于时间同步的歌词高亮更新 [[2]](#__2)
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
     * 将秒数转换为分:秒格式 [[3]](#__3)
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * 设置播放按钮状态
     * 动态更新播放/暂停按钮显示 [[0]](#__0)
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
     * 设置随机播放按钮状态
     * 动态更新控制按钮的激活状态 [[1]](#__1)
     */
    setShuffleButtonState(isShuffled) {
        this.elements.shuffleBtn.classList.toggle('active', isShuffled);
    }

    /**
     * 设置重复播放按钮状态
     * 动态更新重复模式显示 [[2]](#__2)
     */
    setRepeatButtonState(repeatMode) {
        this.elements.repeatBtn.classList.remove('active');
        
        switch (repeatMode) {
            case 'one':
                this.elements.repeatBtn.textContent = '🔂';
                this.elements.repeatBtn.classList.add('active');
                break;
            case 'all':
                this.elements.repeatBtn.textContent = '🔁';
                this.elements.repeatBtn.classList.add('active');
                break;
            default:
                this.elements.repeatBtn.textContent = '🔁';
        }
    }

    /**
     * 设置事件监听器
     * 基础的用户交互事件处理 [[3]](#__3)
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

        safeAddEventListener(this.elements.shuffleBtn, 'click', () => {
            this.toggleShuffle();
        }, '随机播放按钮');

        safeAddEventListener(this.elements.repeatBtn, 'click', () => {
            this.toggleRepeat();
        }, '重复播放按钮');

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
                    
                    if (!this.isSimulating) {
                        this.audio.currentTime = time;
                    }
                    
                    this.updateTimeDisplay(this.currentTime, this.duration);
                    this.updateProgress(this.currentTime, this.duration);
                    this.highlightCurrentLyric(this.currentTime);
                }
            });
            
            console.log('✅ 歌词容器点击监听器已设置');
        } else {
            console.warn('⚠️ 歌词容器元素不存在，跳过点击监听器设置');
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
                repeatMode: this.repeatMode,
                isShuffled: this.isShuffled,
                isSimulating: this.isSimulating
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
                this.repeatMode = state.repeatMode || 'none';
                this.isShuffled = state.isShuffled || false;
                this.currentTime = state.currentTime || 0;
                this.isPlaying = state.isPlaying || false;
                this.isSimulating = state.isSimulating || false;
                
                // **关键：设置音频时间但不重置**
                if (this.audio) {
                    this.audio.currentTime = this.currentTime;
                    this.audio.volume = this.volume;
                }
                
                // 更新界面显示
                this.updateVolumeDisplay(this.volume);
                this.setRepeatButtonState(this.repeatMode);
                this.setShuffleButtonState(this.isShuffled);
                this.setPlayButtonState(this.isPlaying);
                
                console.log('✅ 播放器状态已恢复 - 歌曲:', this.songDatabase[this.currentSongIndex].title, '时间:', this.formatTime(this.currentTime));
                return true;
            }
        } catch (error) {
            console.error('恢复播放器状态失败:', error);
        }
        return false;
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
