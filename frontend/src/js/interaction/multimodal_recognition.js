export function initMultimodalRecognition() {
    const video = document.getElementById('recognitionView');
    let socket = null;

    function connectWebSocket() {
        socket = new WebSocket(`ws://127.0.0.1:5000/ws/multimodal`);
    
        socket.onopen = () => {
            console.log('WebSocket连接已建立');
            startProcessVideoaAudio(video, socket);

            // 心跳检测
            setInterval(() => {
                if(socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({type: 'heartbeat'}));
                }
            }, 30000);
        };

        socket.onerror = (error) => {
            console.error('WebSocket连接出现错误:', error);
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // console.log('多模态响应:', data);
            // console.log('多模态响应');
            if (data.type === 'heartbeat') {
                console.log('收到心跳响应');
                return;
            }
            else if (data.type === 'response') {
                const gesture = data.result.gesture;
                const video = data.result.video;
                // const audio = data.result.audio;

                if (gesture && video && 
                    (gesture !== "无手势" || video !== "无视觉检测结果")) {
                    // 打印手势识别、视觉识别
                    console.log('响应结果:', data.result);
                    const command = JSON.stringify(data.result);
                    handleMultiModalResponse(command);
                }
            }
            else if (data.error) {
                console.log('错误响应:', data.error);
            }
            else {
                console.log('未知响应类型:');
            }
        };
        
        socket.onclose = (event) => {
            console.log('WebSocket连接关闭原因:', event.code, event.reason);
            setTimeout(connectWebSocket, 5000); // 5秒后重连
        };
    }
    
    // 初始化摄像头
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user'
        },
        audio: true
    }).then(stream => {
        video.srcObject = stream;
        connectWebSocket();
    }).catch(err => {
        console.error('摄像头访问失败:', err);
        video.style.backgroundColor = '#000';
    });
}

async function startProcessVideoaAudio(video, socket) {
    let isProcessing = false;
    
    async function processVideoaAudio() {
        if (!isProcessing) {
            isProcessing = true;
            
            // 捕获视频帧
            const imageData = await getVideoFrame(video);
            
            // // 捕获音频
            // const audioData = await getAudioChunk();
            
            // 通过WebSocket发送多模态请求
            socket.send(JSON.stringify({
                type: 'request',
                user_id: localStorage.getItem('username'),
                image: imageData,
                // audio: audioData,
                timestamp: Date.now()
            }));
            
            isProcessing = false;
        }
        requestAnimationFrame(processVideoaAudio);
    }

    async function getVideoFrame(videoElement) {
        return new Promise((resolve) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoElement.videoWidth;
            tempCanvas.height = videoElement.videoHeight;
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.drawImage(videoElement, 0, 0);
            resolve(tempCanvas.toDataURL('image/jpeg', 0.8));
            
            // 移除临时canvas
            tempCanvas.remove();
        });
    }

    async function getAudioChunk() {
        return new Promise(async (resolve) => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                  sampleRate: 16000
                });
                await audioContext.resume(); // 确保上下文处于活动状态
                
                const mediaStream = video.srcObject;
                const audioTrack = mediaStream.getAudioTracks()[0];
                const mediaStreamSource = new MediaStreamAudioSourceNode(audioContext, {
                    mediaStream: new MediaStream([audioTrack])
                });
                
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                mediaStreamSource.connect(analyser);
                
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                const checkAudio = () => {
                    analyser.getByteTimeDomainData(dataArray);
                    // 将Uint8Array转换为ArrayBuffer
                    const audioBuffer = dataArray.buffer;
                    // 转换为Base64字符串
                    const base64String = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
                    resolve(base64String);
                };

                setTimeout(checkAudio, 100); // 每100ms采集一次
            } catch (error) {
                console.error('音频上下文初始化失败:', error);
                resolve(new Int16Array());
            }
        });
    }

    processVideoaAudio();
}

export async function handleMultiModalResponse(responseText) {
    try {
        const response = await fetch('/api/chat', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ input: responseText })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("阿里云大模型API响应:", data);
            displayResponse(data.choices[0].message.content);
            speakResponse(data.choices[0].message.content);
        }
    } catch (error) {
        console.error("阿里云大模型API请求失败:", error);
    }
}

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