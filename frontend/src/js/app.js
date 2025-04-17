var faceContainer = document.querySelector(".face-container");
var eyes = document.querySelectorAll(".eye");
var speechBubble = document.getElementById("speechBubble");

window.addEventListener('mousemove', function(event) {
    var rect = faceContainer.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;

    var deltaX = (event.clientX - centerX) * 0.01; // 控制移动范围
    var deltaY = (event.clientY - centerY) * 0.01; // 控制移动范围

    faceContainer.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    eyes.forEach(function(eye) {
        let eyeRect = eye.getBoundingClientRect();
        let eyeCenterX = eyeRect.left + eyeRect.width / 2;
        let eyeCenterY = eyeRect.top + eyeRect.height / 2;

        let eyeDeltaX = (event.clientX - eyeCenterX) * 0.04; // 控制眼睛的移动范围
        let eyeDeltaY = (event.clientY - eyeCenterY) * 0.04; // 控制眼睛的移动范围

        let angle = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI);
        eye.style.transform = `translate(${eyeDeltaX}px, ${eyeDeltaY}px) rotate(${angle}deg)`;
    });
});

// 眨眼动画
setInterval(function() {
    eyes.forEach(function(eye) {
        eye.classList.add('blink');
        setTimeout(function() {
            eye.classList.remove('blink');
        }, 500);
    });
}, 3000);

// 发送文本到后端
async function sendText() {
    var userInput = document.getElementById("userInput").value;

    try {
        // 发送 POST 请求
        const response = await fetch("http://127.0.0.1:5000", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ input: userInput })
        });

        // 检查响应状态
        if (response.status === 200) {
            const data = await response.json();
            var content = data.choices[0].message.content;
            displayResponse(content);
            speakResponse(content); // 调用语音输出函数
        } else {
            console.error("Error:", response.status, await response.text());
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

// 逐字显示响应内容
function displayResponse(responseText) {
    var speechBubble = document.getElementById("speechBubble");
    speechBubble.style.visibility = 'visible';
    speechBubble.textContent = ''; // 清空之前的文本
    var i = 0;
    var interval = setInterval(function () {
        if (i < responseText.length) {
            speechBubble.textContent += responseText.charAt(i);
            i++;
        } else {
            clearInterval(interval);
        }
    }, 100); // 每100毫秒显示一个字符
}

// 语音输出响应内容
function speakResponse(responseText) {
    if ('speechSynthesis' in window) {
        var utterance = new SpeechSynthesisUtterance(responseText);
        utterance.lang = 'zh-CN'; // 设置语言为中文
        window.speechSynthesis.speak(utterance);
    } else {
        alert("您的浏览器不支持语音合成功能！");
    }
}