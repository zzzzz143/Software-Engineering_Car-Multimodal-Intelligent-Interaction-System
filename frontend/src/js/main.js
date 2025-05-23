import { initAuth } from './auth_controller.js';
import { initFace } from './face_animation.js'; 
import { initChat } from './api_service.js';
import { MusicPlayer } from './music_player.js';
import { initNavigation } from './navigation.js';
import { initGesture } from './gesture_handler.js';

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
    initMusicControls();    
    initNavigation();
    //initGesture();
});


function initMusicControls() {
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

    // 切换播放模式
    document.getElementById('modeBtn').addEventListener('click', () => {
      musicPlayer.togglePlayMode();
    })

    // 音量控制
    document.getElementById('volumeBtn').addEventListener('click', (e) => {
      const sliderContainer = document.getElementById('volumeSliderContainer');
      if (sliderContainer.style.display === 'none') {
          // 显示音量滑块并定位
          sliderContainer.style.display = 'block';
          // 点击外部区域关闭滑块
          document.addEventListener('click', closeVolumeSlider);
          e.stopPropagation(); // 阻止事件冒泡
      } else {
          sliderContainer.style.display = 'none';
      }
    });
  
    // 音量滑块控制
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        musicPlayer.setVolume(e.target.value);
        e.stopPropagation(); // 阻止事件冒泡
    });

    // 播放队列按钮点击事件
    document.getElementById('playQueueBtn').addEventListener('click', function() {
      const modal = document.getElementById('playQueueModal');
      const list = document.getElementById('playQueueList');
      
      if (modal.style.display === 'none') {
          list.innerHTML = '';
          musicPlayer.getPlayQueue().forEach((track, index) => {
              const li = document.createElement('li');
              li.textContent = track.split(/[\\\/]/).pop().split('.')[0];
              li.addEventListener('click', () => musicPlayer.playFromQueue(index));
              list.appendChild(li);
          });
          
          modal.style.display = 'flex';
          // 添加遮罩层点击事件
          document.getElementById('playQueueOverlay').addEventListener('click', closePlayQueue);
      } else {
          modal.style.display = 'none';
      }
  });
  
    // 进度条控制
    document.getElementById('progressBar').addEventListener('input', (e) => {
      const seekTime = (e.target.value / 100) * musicPlayer.audioElement.duration;
      musicPlayer.audioElement.currentTime = seekTime;
    });
  }

// 点击外部关闭音量滑块
function closeVolumeSlider(e) {
  const sliderContainer = document.getElementById('volumeSliderContainer');
  if (!sliderContainer.contains(e.target) && e.target.id !== 'volumeBtn') {
      sliderContainer.style.display = 'none';
      document.removeEventListener('click', closeVolumeSlider);
  }
}

// 关闭播放队列
function closePlayQueue() {
  const modal = document.getElementById('playQueueModal');
  modal.style.display = 'none';
  document.getElementById('playQueueOverlay').removeEventListener('click', closePlayQueue);
}
