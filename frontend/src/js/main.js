import { initAuth } from './auth_controller.js';
import { initFace } from './face_animation.js'; 
import { initChat } from './api_service.js';
import { initGesture } from './gesture_handler.js';
import { MusicPlayer } from './music_player.js';

const musicPlayer = new MusicPlayer();
window.sharedMusicPlayer = musicPlayer;

document.addEventListener('DOMContentLoaded', () => {
    // 检查本地token
    if (!localStorage.getItem('token')) {
        document.getElementById('authModal').style.display = 'flex';
    } else {
        document.querySelector('.main-interface').style.display = 'block';
    }
    
    // 统一初始化所有模块
    initAuth();
    initFace();
    initChat();
    //initGesture();

    // 音乐播放/暂停
    document.getElementById('playPauseBtn').addEventListener('click', () => {
        musicPlayer.togglePlay();
    });
    
    // 切换上一首
    document.getElementById('prevBtn').addEventListener('click', () => {
      musicPlayer.playPrev();
    });
    
    // 切换下一首
    document.getElementById('nextBtn').addEventListener('click', () => {
      musicPlayer.playNext();
    });

    // 进度条控制
    document.getElementById('progressBar').addEventListener('input', (e) => {
      const seekTime = (e.target.value / 100) * musicPlayer.audioElement.duration;
      musicPlayer.audioElement.currentTime = seekTime;
  });
});


