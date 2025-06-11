import { initFaceAnimation } from './face_animation.js'; 
import { initMultimodalRecognition } from './multimodal_recognition.js';
import { startHUD } from '../hud.js';

document.addEventListener('DOMContentLoaded', () => {
    // 检查本地token
    const authModal = document.getElementById('authModal');
    const mainInterface = document.querySelector('.main-interface');
    
    if (!localStorage.getItem('token')) {
        if (authModal) authModal.style.display = 'flex';
    } else {
        if (mainInterface) mainInterface.style.display = 'block';
    }
    
    // 统一初始化所有模块
    initFaceAnimation();
    initMultimodalRecognition();

    console.log("interaction调用startHUD函数并传递警告灯参数");
    startHUD(49, 78, 3500, 3, 85, false, 50); // 初始调用
});