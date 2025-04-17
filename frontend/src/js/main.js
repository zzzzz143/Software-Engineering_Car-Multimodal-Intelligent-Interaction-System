import { initAuth } from './authController.js';
import { initFace } from './faceAnimation.js'; 
import { initChat } from './apiService.js';

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
});