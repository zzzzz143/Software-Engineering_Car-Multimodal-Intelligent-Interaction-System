import { MusicPlayer } from './music_player.js';

export function initGesture() {
    const musicPlayer = window.sharedMusicPlayer;
    const video = document.getElementById('gestureView');
    const canvas = document.getElementById('gestureCanvas');
    const ctx = canvas.getContext('2d');

    // 手势映射到音乐控制
    const gestureHandlers = {
        '播放下一首音乐': () => musicPlayer.playNext(),
        '播放上一首音乐': () => musicPlayer.playPrevious(),
        '音量增加': () => {
            musicPlayer.adjustVolume(0.1);
            updateVolumeDisplay(musicPlayer.getVolumePercentage());
        },
        '音量减少': () => {
            musicPlayer.adjustVolume(-0.1);
            updateVolumeDisplay(musicPlayer.getVolumePercentage());
        },
        '播放/关闭音乐': () => musicPlayer.toggleMute()
    };

    // 初始化摄像头
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: 320, 
            height: 240,
            frameRate: 30 
        }
    }).then(stream => {
        video.srcObject = stream;
        video.play();
        video.style.transform = 'scaleX(-1)';
        startRecognition(video, canvas, ctx, gestureHandlers);
    }).catch(err => {
        console.error('摄像头访问失败:', err);
        video.style.backgroundColor = '#000';
    });
}

function startRecognition(video, canvas, ctx, gestureHandlers) {
    let isProcessing = false;

    async function processFrame() {
        if (!isProcessing) {
            isProcessing = true;
            
            // 捕获视频帧
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            try {
                const response = await fetch('/api/gesture', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ image: imageData })
                });
                
                const result = await response.json();
                if (result.gesture && result.gesture in gestureHandlers) {
                    gestureHandlers[result.gesture]();
                }
            } catch (error) {
                console.error('手势识别失败:', error);
            } finally {
                isProcessing = false;
            }
        }
        requestAnimationFrame(processFrame);
    }

    // 设置画布尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    processFrame();
}

function updateVolumeDisplay(volume) {
    const volumeElement = document.getElementById('volumeDisplay');
    if (volumeElement) {
        volumeElement.textContent = `音量: ${volume}%`;
        volumeElement.style.display = 'block';
        setTimeout(() => volumeElement.style.display = 'none', 2000);
    }
}