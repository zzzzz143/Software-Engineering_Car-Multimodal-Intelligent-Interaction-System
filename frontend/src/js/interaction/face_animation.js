// 面部动画模块
export function initFaceAnimation() {
    const faceContainer = document.querySelector(".face-container");
    const eyes = document.querySelectorAll(".eye");

    // 鼠标移动事件监听
    window.addEventListener('mousemove', (event) => {
        const rect = faceContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 面部容器移动逻辑
        const deltaX = (event.clientX - centerX) * 0.01;
        const deltaY = (event.clientY - centerY) * 0.01;
        faceContainer.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        // 眼睛运动逻辑
        eyes.forEach(eye => {
            const eyeRect = eye.getBoundingClientRect();
            const eyeCenterX = eyeRect.left + eyeRect.width / 2;
            const eyeCenterY = eyeRect.top + eyeRect.height / 2;

            const eyeDeltaX = (event.clientX - eyeCenterX) * 0.04;
            const eyeDeltaY = (event.clientY - eyeCenterY) * 0.04;
            const angle = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI);
            
            eye.style.transform = `translate(${eyeDeltaX}px, ${eyeDeltaY}px) rotate(${angle}deg)`;
        });
    });

    // 眨眼动画
    setInterval(() => {
        eyes.forEach(eye => {
            eye.classList.add('blink');
            setTimeout(() => eye.classList.remove('blink'), 500);
        });
    }, 3000);
}