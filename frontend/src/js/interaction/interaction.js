import { initFaceAnimation } from './face_animation.js'; 
import { initMultimodalRecognition } from './multimodal_recognition.js';

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
});