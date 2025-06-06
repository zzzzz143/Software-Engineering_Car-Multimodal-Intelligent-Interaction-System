export function initMultimodalRecognition() {
    const video = document.getElementById('recognitionView');
    let socket = null;
    let isAwake = false;
    let wakeWord = "hey siri"; // 默认唤醒词
    let wakeTimeout = null; // 唤醒超时定时器

    // 初始化摄像头
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user'
        },
        audio: { 
            sampleRate: 16000, //采样率16000Hz
            channelCount: 1, //单声道
            sampleSize: 16, // 16位整型深度
            echoCancellation: false, // 关闭回声消除，避免干扰
            noiseSuppression: false, // 关闭降噪
            autoGainControl: false   // 关闭自动增益
        }
    }).then(stream => {
        video.srcObject = stream;
        connectWebSocket();
        startProcessVideoaAudio(video, socket, stream);
    }).catch(err => {
        console.error('摄像头访问失败:', err);
        video.style.backgroundColor = '#000';
    });

    function connectWebSocket() {
        socket = new WebSocket(`ws://127.0.0.1:5000/ws/multimodal`);

        socket.onopen = () => {
            console.log('WebSocket连接已建立');

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
            if (data.type === 'heartbeat') {
                console.log('收到心跳响应');
                return;
            }
            else if (data.type === 'response') {
                // data = {
                //     type: 'response',
                //     image_info = {
                //         instruction_code: xxx,
                //         decision: xxx,
                //         feedback: xxx
                //     }/'无手势,视觉数据为空',
                //     audio_info: {
                //         instruction_code: xxx,
                //         decision: xxx,
                //         feedback: xxx
                //     }/wake_word/'音频数据为空'/
                // }
                console.log('多模态响应:', data);
                console.log('isAwake:', isAwake);
                let priority = data.priority;                
                let image_info = data.image_info;
                let audio_info = data.audio_info;

                switch (priority) {
                    case 1: // FATIGUE_DETECTION
                        console.log('处理疲劳驾驶检测结果');
                        displayResponse(image_info.feedback);
                        speakResponse(image_info.feedback);
                        break;
                    case 2: // EMERGENCY
                        console.log('处理紧急命令');
                        displayResponse(audio_info.feedback);
                        speakResponse(audio_info.feedback);
                        break;
                    case 3: // WAKE_WORD
                        console.log('处理唤醒词');
                        isAwake = true;
                        resetWakeTimeout(); // 重置唤醒超时定时器
                        displayResponse('我在');
                        speakResponse('我在');
                        break;
                    case 4: // NORMAL_COMMAND
                    default:
                        console.log('处理正常命令');
                        // 优先处理音频，如果音频为空则处理手势和视觉
                        if (audio_info != '音频数据为空'){
                            isAwake = true;
                            resetWakeTimeout(); // 重置唤醒超时定时器
                            displayResponse(audio_info.feedback);
                            speakResponse(audio_info.feedback);
                        } else {
                            displayResponse(image_info.feedback);
                            speakResponse(image_info.feedback);
                        }
                        break;
                }
            }
            else if (data.error) {
                console.log('错误响应:', data.error);
            }
            else {
                console.log('未知响应类型:', data);
            }
        };
        
        socket.onclose = (event) => {
            console.log('WebSocket连接关闭原因:', event.code, event.reason);
            setTimeout(connectWebSocket, 5000); // 5秒后重连
        };
    }
    
    async function startProcessVideoaAudio(video, socket, stream) {
        let isProcessing = false;
        
        async function processVideoaAudio() {
            if (!isProcessing) {
                isProcessing = true;
                
                // 捕获视频帧
                const image_info = await getVideoFrame(video);
                
                // 捕获音频
                const audio_info = await getAudioChunk(stream);
                
                const userInfoStr = localStorage.getItem('userInfo');
                const userInfo = JSON.parse(userInfoStr);
                const userId = userInfo.user_id;

                // 发送多模态请求
                const payload = {
                    type: 'command',
                    user_id: userId,
                    image: image_info,
                    audio: audio_info,
                    is_wake: isAwake,
                    wake_word: wakeWord,
                    timestamp: Date.now()
                };
                // console.log('前端发送请求:', payload);
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
    
        let audioContext = null;
        let workletNode = null;
        let audioBufferQueue = [];
    
        async function getAudioChunk(stream) {
            if (!audioContext) {
                audioContext = new AudioContext({ sampleRate: 16000 });
                const source = audioContext.createMediaStreamSource(stream);

                const processorCode = `class RecorderProcessor extends AudioWorkletProcessor {
                    constructor() {
                        super();
                        this._buffer = [];
                    }

                    process(inputs) {
                        const input = inputs[0];
                        if (input.length > 0) {
                            const channelData = input[0];
                            this._buffer.push(...channelData);

                            while (this._buffer.length >= 512) {
                                const frame = this._buffer.slice(0, 512);
                                this._buffer = this._buffer.slice(512);
                                this.port.postMessage(frame);
                            }
                        }
                        return true;
                    }
                }
                registerProcessor('recorder_processor', RecorderProcessor);`;
                
                const blob = new Blob([processorCode], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
        
                await audioContext.audioWorklet.addModule(url);
                workletNode = new AudioWorkletNode(audioContext, 'recorder_processor');
        
                workletNode.port.onmessage = (event) => {
                    const float32Array = event.data;
                    audioBufferQueue.push(...float32Array);
                };
        
                source.connect(workletNode).connect(audioContext.destination);
            }
        
            // 采样率16000Hz, 采样时间4800ms, 一共76800个样本点
            // 后端的Porcupine需要每次处理512个样本的帧，刚好是150倍
            await new Promise(resolve => setTimeout(resolve, 4800));
        
            const float32Chunk = audioBufferQueue.splice(0, audioBufferQueue.length);
            const int16Chunk = convertFloat32ToInt16(float32Chunk);
            const uint8Array = new Uint8Array(int16Chunk.buffer);
            const binaryString = Array.from(uint8Array)
                .map(byte => String.fromCharCode(byte))
                .join('');
            return btoa(binaryString);
        }
        
        function convertFloat32ToInt16(float32Array) {
            const int16Array = new Int16Array(float32Array.length);
            for (let i = 0; i < float32Array.length; i++) {
                let s = Math.max(-1, Math.min(1, float32Array[i]));
                int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            return int16Array;
        }
        
        processVideoaAudio();
    }
    
    function resetWakeTimeout() {
        // 清除原有计时器并设置新计时器
        clearTimeout(wakeTimeout);
        wakeTimeout = setTimeout(() => {
            isAwake = false;
            console.log('唤醒状态已超时');
        }, 15000); // 15秒有效期
    }

    // 响应显示模块
    function displayResponse(responseText) {
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
    async function speakResponse(responseText, voiceIndex = 0) {
        try {
            const response = await fetch('/api/generate_speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    text: responseText,
                    voice_index: voiceIndex
                }),
            });
    
            if (!response.ok) {
                throw new Error(`后端错误：${response.status}`);
            }
    
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            // 等待语音播放完成
            await new Promise((resolve) => audio.onended = resolve);
            audio.play();
    
        } catch (error) {
            console.error('语音合成失败:', error);
        }
    }
}

