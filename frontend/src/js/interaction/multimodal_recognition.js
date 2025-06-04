let isAwake = false;
let wakeWord = "小艺小艺"; // 默认唤醒词

export function initMultimodalRecognition() {
    const video = document.getElementById('recognitionView');
    let socket = null;

    // 初始化唤醒词
    async function initializeWakeWord(){
        try {
            const response = await fetch('/api/publicUser/account', {
                headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
            });
            if (response.ok) {
                const data = response.json();
                wakeWord = data.wake_word; // 更新唤醒词
            }
            else {
                console.error('获取唤醒词失败:', response.statusText);
            }
        } catch (error) {
            console.error('获取唤醒词失败:', error);
        }
    };

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
            else if (data.type === 'wake_response') {
                // data = {
                //     type: 'wake_response',
                //     image = {
                //         instruction_code: xx,
                //         decision: 文本,
                //         feedback: 文本
                //     },
                //     is_wake: 布尔值
                // }
                const image = data.image;
                console.log('唤醒响应:', image);
                const imageResponseData = typeof image === 'string' ? JSON.parse(image) : image;
                console.log('imageResponseData:', imageResponseData);
                if(data.is_wake){
                    displayResponse('我在');
                    speakResponse('我在'); 
                    isAwake = true;                  
                }
                if(imageResponseData){
                    const imageResponseText = JSON.stringify(imageResponseData.feedback);
                    displayResponse(imageResponseText);
                    speakResponse(imageResponseText);
                }
            }
            else if (data.type === 'command_response') {
                // data = {
                //     type: 'command_response',
                //     command: processed_command = {
                //         image = {
                //             instruction_code: xx,
                //             decision: 文本,
                //             feedback: 文本
                //         },
                //         audio = {
                //             instruction_code: xx,
                //             decision: 文本,
                //             feedback: 文本
                //         }
                //     }
                // }
                const command = data.command;
                console.log('命令响应:', command);
                const imageResponseData = typeof command.image ==='string'? JSON.parse(command.image) : command.image;
                const audioResponseData = typeof command.audio ==='string'? JSON.parse(command.audio) : command.audio;
                if(imageResponseData){
                    const imageResponseText = JSON.stringify(imageResponseData.feedback);
                    displayResponse(imageResponseText);
                    speakResponse(imageResponseText);
                }
                if(audioResponseData){
                    const audioResponseText = JSON.stringify(audioResponseData.feedback);
                    displayResponse(audioResponseText);
                    speakResponse(audioResponseText);
                    isAwake = false;
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
        initializeWakeWord();
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
            const audioData = await getAudioChunk();
            
            // 通过WebSocket发送多模态请求
            const payload = {
                type: isAwake ? 'command' : 'wake_check',
                user_id: localStorage.getItem('user_id'),
                image: imageData,
                audio: audioData,
                wake_word: wakeWord,
                timestamp: Date.now()
            };
            
            socket.send(JSON.stringify(payload));
            
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
        return new Promise((resolve, reject) => {
            try {
                const constraints = { audio: true };
                navigator.mediaDevices.getUserMedia(constraints)
                    .then(stream => {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const mediaStreamSource = audioContext.createMediaStreamSource(stream);
                        
                        // 创建脚本处理器收集音频数据
                        const processor = audioContext.createScriptProcessor(4096, 1, 1);
                        let audioData = [];
                        
                        processor.onaudioprocess = (e) => {
                            const channelData = e.inputBuffer.getChannelData(0);
                            audioData.push(...channelData);
                        };
                        
                        mediaStreamSource.connect(processor);
                        processor.connect(audioContext.destination);
                        
                        setTimeout(() => {
                            processor.disconnect();
                            
                            // 将音频数据转换为WAV格式
                            const wavData = convertToWav(audioData, audioContext.sampleRate);
                            const wavBlob = new Blob([wavData], { type: 'audio/wav' });
                            
                            // 转换为Base64
                            const reader = new FileReader();
                            reader.onload = () => {
                                const base64String = reader.result.split(',')[1];
                                resolve(base64String);
                            };
                            reader.readAsDataURL(wavBlob);
                        }, 2000); // 录制2秒
                    })
                    .catch(error => {
                        console.error('获取音频流失败:', error);
                        reject(error);
                    });
            } catch (error) {
                console.error('音频上下文初始化失败:', error);
                reject(error);
            }
        });
    }
    
    // 将PCM数据转换为WAV格式
    function convertToWav(pcmData, sampleRate) {
        const buffer = new ArrayBuffer(44 + pcmData.length * 2);
        const view = new DataView(buffer);
        
        // RIFF 头
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + pcmData.length * 2, true);
        writeString(view, 8, 'WAVE');
        
        // 格式块
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // 格式块大小
        view.setUint16(20, 1, true);  // 音频格式: PCM
        view.setUint16(22, 1, true);  // 声道数
        view.setUint32(24, sampleRate, true); // 采样率
        view.setUint32(28, sampleRate * 2, true); // 字节率
        view.setUint16(32, 2, true);  // 块对齐
        view.setUint16(34, 16, true); // 位深度
        
        // 数据块
        writeString(view, 36, 'data');
        view.setUint32(40, pcmData.length * 2, true);
        
        // 写入PCM数据（16位有符号整数）
        const dataView = new DataView(buffer, 44);
        for (let i = 0; i < pcmData.length; i++) {
            const value = Math.max(-1, Math.min(1, pcmData[i]));
            dataView.setInt16(i * 2, value < 0 ? value * 0x8000 : value * 0x7FFF, true);
        }
        
        return buffer;
    }
    
    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    processVideoaAudio();
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