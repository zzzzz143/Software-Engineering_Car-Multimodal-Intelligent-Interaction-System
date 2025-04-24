// 响应显示模块
export function displayResponse(responseText) {
    const speechBubble = document.getElementById("speechBubble");
    speechBubble.style.visibility = 'visible';
    speechBubble.textContent = '';
    
    let i = 0;
    const interval = setInterval(() => {
        if (i < responseText.length) {
            speechBubble.textContent += responseText.charAt(i);
            i++;
        } else {
            clearInterval(interval);
        }
    }, 100);
}

// 语音合成模块
export function speakResponse(responseText) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.lang = 'zh-CN';
        window.speechSynthesis.speak(utterance);
    }
}