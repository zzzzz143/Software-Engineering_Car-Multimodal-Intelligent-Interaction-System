import { updateUserStatus } from './auth_controller.js';
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
    // initAuth();
    updateUserStatus();
    initFace();
    initChat();
    //initGesture();

    // 添加页面点击激活播放
    document.body.addEventListener('click', () => {
        musicPlayer.audioElement.play()
            .then(() => {
                console.log('音频播放已激活');
                musicPlayer.updateNowPlaying();
            })
            .catch(e => console.error('播放失败:', e));
    });
}); 


