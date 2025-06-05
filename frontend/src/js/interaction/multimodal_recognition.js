export function initMultimodalRecognition() {
    const video = document.getElementById('recognitionView');
    let socket = null;
    let isAwake = false;
    let wakeWord = "hey siri"; // 默认唤醒词

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
                let imageData = data.image_info;
                let audioData = data.audio_info;
                if (imageData != '无手势,视觉数据为空'){
                    displayResponse(imageData.feedback);
                    speakResponse(imageData.feedback);
                }
                if (audioData === wakeWord){
                    isAwake = true;
                    displayResponse('我在');
                    speakResponse('我在');
                }
                else if (audioData != '音频数据为空'){
                    isAwake = false;
                    displayResponse(audioData.feedback);
                    speakResponse(audioData.feedback);
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
    
    async function startProcessVideoaAudio(video, socket, stream) {
        let isProcessing = false;
        
        async function processVideoaAudio() {
            if (!isProcessing) {
                isProcessing = true;
                
                // 捕获视频帧
                const imageData = await getVideoFrame(video);
                
                // 捕获音频
                const audioData = await getAudioChunk(stream);
                
                // 发送多模态请求
                const payload = {
                    type: 'command',
                    user_id: localStorage.getItem('user_id'),
                    image: imageData,
                    audio: audioData,
                    is_wake: isAwake,
                    wake_word: wakeWord,
                    timestamp: Date.now()
                };
                console.log('前端发送请求:', payload);
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
        
            // 采样率16000Hz, 采样时间320ms, 一共5120个样本点
            // 后端的Porcupine需要每次处理512个样本的帧，刚好是10倍
            await new Promise(resolve => setTimeout(resolve, 3200));
        
            const float32Chunk = audioBufferQueue.splice(0, audioBufferQueue.length);
            const int16Chunk = convertFloat32ToInt16(float32Chunk);
            const binaryString = String.fromCharCode(...new Uint8Array(int16Chunk.buffer)); 
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
    function speakResponse(responseText) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(responseText);
            utterance.lang = 'zh-CN';
            window.speechSynthesis.speak(utterance);
        }
    }
}

