/**
 * 车载通话系统 JavaScript 控制器
 * 实现拨号、来电、通话等功能
 */


export class CarPhoneSystem {
    constructor() {
        this.currentCall = null;
        this.callTimer = null;
        this.callStartTime = null;
        this.isInCall = false;
        this.isMuted = false;
        this.isSpeakerOn = false;
        this.isOnHold = false;
        
        // 模拟联系人数据
        this.contacts = {
            '13800138000': '张三',
            '13900139000': '李四',
            '13700137000': '王五',
            '021-12345678': '家',
            '021-87654321': '公司',
            '400-123-4567': '道路救援',
            '120': '急救中心'
        };
        
        console.log('车载通话系统已创建');
    }

    // 初始化方法，在页面加载完成后调用
    init() {
        this.bindEvents();
        this.createIncomingCallModal();
        this.createSimulateCallButton();
        console.log('车载通话与页面绑定完成');
    }

    // 绑定事件监听器
    bindEvents() {
        // 拨号键盘事件
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', (e) => {
                const number = e.currentTarget.dataset.number;
                this.addDigit(number);
                this.playKeyTone(number);
            });
        });

        // 清除号码按钮
        const clearButton = document.getElementById('clearNumber');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearNumber();
            });
        }

        // 拨打电话按钮
        const makeCallButton = document.getElementById('makeCall');
        if (makeCallButton) {
            makeCallButton.addEventListener('click', () => {
                this.makeCall();
            });
        }

        // 通话控制按钮
        this.bindCallControlEvents();

        // 通话记录和联系人快速拨号
        this.bindQuickDialEvents();

        // 键盘输入支持
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
    }

    // 绑定通话控制事件
    bindCallControlEvents() {
        const controls = {
            'muteBtn': () => this.toggleMute(),
            'speakerBtn': () => this.toggleSpeaker(),
            'holdBtn': () => this.toggleHold(),
            'endCallBtn': () => this.endCall(),
            'keypadBtn': () => this.showKeypadInCall(),
            'addCallBtn': () => this.addCall()
        };

        Object.entries(controls).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    // 绑定快速拨号事件
    bindQuickDialEvents() {
        document.querySelectorAll('.call-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = e.currentTarget.dataset.number;
                if (number) {
                    this.quickDial(number);
                }
            });
        });
    }

    // 创建模拟来电按钮
    createSimulateCallButton() {
        const button = document.createElement('button');
        button.id = 'simulateIncomingCall';
        button.className = 'simulate-call-btn';
        button.innerHTML = '📲 模拟来电';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            transition: all 0.3s ease;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(231, 76, 60, 0.4)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.3)';
        });
        
        button.addEventListener('click', () => {
            this.simulateIncomingCall();
        });
        
        document.body.appendChild(button);
    }

    // 创建来电弹窗
    createIncomingCallModal() {
        const modal = document.createElement('div');
        modal.id = 'incomingCallModal';
        modal.className = 'incoming-call-modal hidden';
        modal.innerHTML = `
            <div class="incoming-call-overlay"></div>
            <div class="incoming-call-content">
                <div class="incoming-call-header">
                    <div class="incoming-call-avatar">👤</div>
                    <div class="incoming-call-info">
                        <div class="incoming-caller-name" id="incomingCallerName">张三</div>
                        <div class="incoming-caller-number" id="incomingCallerNumber">13800138000</div>
                        <div class="incoming-call-status">来电中...</div>
                    </div>
                </div>
                <div class="incoming-call-actions">
                    <button class="incoming-call-btn decline" id="declineCall">
                        <span class="btn-icon">📞</span>
                        <span class="btn-text">拒接</span>
                    </button>
                    <button class="incoming-call-btn answer" id="answerCall">
                        <span class="btn-icon">📞</span>
                        <span class="btn-text">接听</span>
                    </button>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .incoming-call-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            }
            
            .incoming-call-modal.hidden {
                display: none;
            }
            
            .incoming-call-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
            }
            
            .incoming-call-content {
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #3a4a5c 100%);
                border: 1px solid rgba(127, 140, 141, 0.3);
                border-radius: 20px;
                padding: 30px;
                text-align: center;
                position: relative;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(20px);
                animation: slideUp 0.4s ease-out;
                min-width: 320px;
            }
            
            .incoming-call-header {
                margin-bottom: 30px;
            }
            
            .incoming-call-avatar {
                width: 100px;
                height: 100px;
                background: linear-gradient(135deg, #3498db, #1abc9c);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
                margin: 0 auto 20px;
                box-shadow: 0 10px 30px rgba(52, 152, 219, 0.4);
                animation: pulse 2s infinite;
            }
            
            .incoming-caller-name {
                font-size: 24px;
                font-weight: 600;
                color: #ecf0f1;
                margin-bottom: 8px;
            }
            
            .incoming-caller-number {
                font-size: 16px;
                color: #bdc3c7;
                margin-bottom: 8px;
            }
            
            .incoming-call-status {
                font-size: 14px;
                color: #1abc9c;
                font-weight: 500;
            }
            
            .incoming-call-actions {
                display: flex;
                gap: 20px;
                justify-content: center;
            }
            
            .incoming-call-btn {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                color: white;
            }
            
            .incoming-call-btn.answer {
                background: linear-gradient(135deg, #27ae60, #2ecc71);
                box-shadow: 0 8px 25px rgba(39, 174, 96, 0.4);
            }
            
            .incoming-call-btn.decline {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
            }
            
            .incoming-call-btn:hover {
                transform: translateY(-3px) scale(1.1);
            }
            
            .btn-icon {
                font-size: 24px;
                margin-bottom: 4px;
            }
            
            .btn-text {
                font-size: 12px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // 绑定来电弹窗事件
        const answerButton = document.getElementById('answerCall');
        const declineButton = document.getElementById('declineCall');
        
        if (answerButton) {
            answerButton.addEventListener('click', () => {
                this.answerIncomingCall();
            });
        }
        
        if (declineButton) {
            declineButton.addEventListener('click', () => {
                this.declineIncomingCall();
            });
        }
    }

    // 模拟来电功能
    simulateIncomingCall() {
        if (this.isInCall) {
            this.showNotification('当前正在通话中', 'warning');
            return;
        }

        // 随机选择一个联系人来电
        const numbers = Object.keys(this.contacts);
        const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
        const callerName = this.contacts[randomNumber];
        
        this.showIncomingCall(callerName, randomNumber);
        this.playRingtone();
    }

    // 显示来电界面
    showIncomingCall(name, number) {
        const modal = document.getElementById('incomingCallModal');
        const nameElement = document.getElementById('incomingCallerName');
        const numberElement = document.getElementById('incomingCallerNumber');
        
        if (modal && nameElement && numberElement) {
            nameElement.textContent = name;
            numberElement.textContent = number;
            modal.classList.remove('hidden');
        }
        
        // 存储来电信息
        this.currentCall = { name, number, type: 'incoming' };
    }

    // 接听来电
    answerIncomingCall() {
        this.hideIncomingCall();
        this.stopRingtone();
        this.startCall(this.currentCall.name, this.currentCall.number, 'incoming');
        this.showNotification('通话已接通', 'success');
    }

    // 拒接来电
    declineIncomingCall() {
        this.hideIncomingCall();
        this.stopRingtone();
        this.addCallToHistory(this.currentCall.name, this.currentCall.number, 'missed');
        this.currentCall = null;
        this.showNotification('来电已拒接', 'info');
    }

    // 隐藏来电界面
    hideIncomingCall() {
        const modal = document.getElementById('incomingCallModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // 添加数字到号码显示
    addDigit(digit) {
        const phoneNumber = document.getElementById('phoneNumber');
        if (!phoneNumber) return;
        
        const currentValue = phoneNumber.value;
        
        // 限制号码长度
        if (currentValue.length < 20) {
            phoneNumber.value = currentValue + digit;
            this.animateKeyPress(digit);
        }
    }

    // 清除号码
    clearNumber() {
        const phoneNumber = document.getElementById('phoneNumber');
        if (!phoneNumber) return;
        
        const currentValue = phoneNumber.value;
        
        if (currentValue.length > 0) {
            phoneNumber.value = currentValue.slice(0, -1);
            this.animateButton('clearNumber');
        }
    }

    // 拨打电话
    makeCall() {
        const phoneNumber = document.getElementById('phoneNumber');
        if (!phoneNumber) return;
        
        const number = phoneNumber.value.trim();
        
        if (!number) {
            this.showNotification('请输入电话号码', 'warning');
            return;
        }
        
        if (this.isInCall) {
            this.showNotification('当前正在通话中', 'warning');
            return;
        }
        
        const callerName = this.contacts[number] || '未知联系人';
        this.startCall(callerName, number, 'outgoing');
        this.showNotification(`正在拨打 ${callerName}`, 'info');
    }

    // 快速拨号
    quickDial(number) {
        if (this.isInCall) {
            this.showNotification('当前正在通话中', 'warning');
            return;
        }
        
        const callerName = this.contacts[number] || '未知联系人';
        const phoneNumber = document.getElementById('phoneNumber');
        if (phoneNumber) {
            phoneNumber.value = number;
        }
        this.startCall(callerName, number, 'outgoing');
        this.showNotification(`正在拨打 ${callerName}`, 'info');
    }

    // 开始通话
    startCall(name, number, type) {
        this.isInCall = true;
        this.currentCall = { name, number, type };
        this.callStartTime = new Date();
        
        // 隐藏拨号器，显示通话界面
        const dialerWidget = document.getElementById('dialerWidget');
        const callWidget = document.getElementById('callWidget');
        
        if (dialerWidget) dialerWidget.classList.add('hidden');
        if (callWidget) callWidget.classList.remove('hidden');
        
        // 更新通话界面信息
        const callerNameElement = document.getElementById('callerName');
        const callerNumberElement = document.getElementById('callerNumber');
        const callStateElement = document.getElementById('callState');
        
        if (callerNameElement) callerNameElement.textContent = name;
        if (callerNumberElement) callerNumberElement.textContent = number;
        if (callStateElement) callStateElement.textContent = type === 'incoming' ? '通话中...' : '正在连接...';
        
        // 启动通话计时器
        this.startCallTimer();
        
        // 模拟连接延迟（仅用于拨出电话）
        if (type === 'outgoing') {
            setTimeout(() => {
                if (this.isInCall && callStateElement) {
                    callStateElement.textContent = '通话中...';
                    this.showNotification('通话已接通', 'success');
                }
            }, 2000);
        }
        
        // 添加到通话记录
        this.addCallToHistory(name, number, type);
    }

    // 结束通话
    endCall() {
        if (!this.isInCall) return;
        
        this.isInCall = false;
        this.stopCallTimer();
        
        // 显示拨号器，隐藏通话界面
        const callWidget = document.getElementById('callWidget');
        const dialerWidget = document.getElementById('dialerWidget');
        
        if (callWidget) callWidget.classList.add('hidden');
        if (dialerWidget) dialerWidget.classList.remove('hidden');
        
        // 重置通话状态
        this.resetCallState();
        
        // 清空号码显示
        const phoneNumber = document.getElementById('phoneNumber');
        if (phoneNumber) {
            phoneNumber.value = '';
        }
        
        this.showNotification('通话已结束', 'info');
        this.currentCall = null;
    }

    // 启动通话计时器
    startCallTimer() {
        this.callTimer = setInterval(() => {
            if (this.callStartTime && this.isInCall) {
                const elapsed = Math.floor((new Date() - this.callStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                const callTimerElement = document.getElementById('callTimer');
                if (callTimerElement) {
                    callTimerElement.textContent = timeString;
                }
            }
        }, 1000);
    }

    // 停止通话计时器
    stopCallTimer() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
    }

    // 切换静音状态
    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('muteBtn');
        if (!muteBtn) return;
        
        const icon = muteBtn.querySelector('.control-icon');
        const label = muteBtn.querySelector('.control-label');
        
        if (this.isMuted) {
            if (icon) icon.textContent = '🔇';
            if (label) label.textContent = '取消静音';
            muteBtn.classList.add('active');
            this.showNotification('已静音', 'info');
        } else {
            if (icon) icon.textContent = '🎤';
            if (label) label.textContent = '静音';
            muteBtn.classList.remove('active');
            this.showNotification('已取消静音', 'info');
        }
        
        this.animateButton('muteBtn');
    }

    // 切换免提状态
    toggleSpeaker() {
        this.isSpeakerOn = !this.isSpeakerOn;
        const speakerBtn = document.getElementById('speakerBtn');
        if (!speakerBtn) return;
        
        const icon = speakerBtn.querySelector('.control-icon');
        const label = speakerBtn.querySelector('.control-label');
        
        if (this.isSpeakerOn) {
            if (icon) icon.textContent = '🔊';
            if (label) label.textContent = '关闭免提';
            speakerBtn.classList.add('active');
            this.showNotification('免提已开启', 'info');
        } else {
            if (icon) icon.textContent = '🔈';
            if (label) label.textContent = '免提';
            speakerBtn.classList.remove('active');
            this.showNotification('免提已关闭', 'info');
        }
        
        this.animateButton('speakerBtn');
    }

    // 切换保持状态
    toggleHold() {
        this.isOnHold = !this.isOnHold;
        const holdBtn = document.getElementById('holdBtn');
        if (!holdBtn) return;
        
        const icon = holdBtn.querySelector('.control-icon');
        const label = holdBtn.querySelector('.control-label');
        const callState = document.getElementById('callState');
        
        if (this.isOnHold) {
            if (icon) icon.textContent = '▶️';
            if (label) label.textContent = '恢复';
            holdBtn.classList.add('active');
            if (callState) callState.textContent = '通话保持中...';
            this.showNotification('通话已保持', 'info');
        } else {
            if (icon) icon.textContent = '⏸️';
            if (label) label.textContent = '保持';
            holdBtn.classList.remove('active');
            if (callState) callState.textContent = '通话中...';
            this.showNotification('通话已恢复', 'info');
        }
        
        this.animateButton('holdBtn');
    }

    // 通话中显示键盘
    showKeypadInCall() {
        // 这里可以实现通话中的键盘功能
        this.showNotification('键盘功能', 'info');
        this.animateButton('keypadBtn');
    }

    // 添加通话
    addCall() {
        this.showNotification('多方通话功能', 'info');
        this.animateButton('addCallBtn');
    }

    // 重置通话状态
    resetCallState() {
        this.isMuted = false;
        this.isSpeakerOn = false;
        this.isOnHold = false;
        
        // 重置按钮状态
        const buttons = ['muteBtn', 'speakerBtn', 'holdBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.classList.remove('active');
            }
        });
        
        // 重置按钮文本
        this.updateButtonText('muteBtn', '🎤', '静音');
        this.updateButtonText('speakerBtn', '🔈', '免提');
        this.updateButtonText('holdBtn', '⏸️', '保持');
    }

    // 更新按钮文本
    updateButtonText(btnId, icon, label) {
        const btn = document.getElementById(btnId);
        if (btn) {
            const iconElement = btn.querySelector('.control-icon');
            const labelElement = btn.querySelector('.control-label');
            if (iconElement) iconElement.textContent = icon;
            if (labelElement) labelElement.textContent = label;
        }
    }

    // 添加通话记录
    addCallToHistory(name, number, type) {
        const callHistory = document.getElementById('callHistory');
        if (!callHistory) return;
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const typeText = {
            'incoming': '已接来电',
            'outgoing': '已拨电话',
            'missed': '未接来电'
        };
        
        const callItem = document.createElement('div');
        callItem.className = `call-item ${type}`;
        callItem.innerHTML = `
            <div class="call-info">
                <div class="call-name">${name}</div>
                <div class="call-details">
                    <span class="call-time">${timeString}</span>
                    <span class="call-type">${typeText[type]}</span>
                </div>
            </div>
            <div class="call-actions">
                <button class="action-btn call-btn" data-number="${number}">📞</button>
                <button class="action-btn msg-btn">💬</button>
            </div>
        `;
        
        // 添加到列表顶部
        callHistory.insertBefore(callItem, callHistory.firstChild);
        
        // 绑定快速拨号事件
        const callBtn = callItem.querySelector('.call-btn');
        if (callBtn) {
            callBtn.addEventListener('click', (e) => {
                const number = e.currentTarget.dataset.number;
                this.quickDial(number);
            });
        }
        
        // 限制记录数量
        const items = callHistory.querySelectorAll('.call-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
    }

    // 键盘输入处理
    handleKeyboardInput(e) {
        if (this.isInCall) return;
        
        const key = e.key;
        
        // 数字键
        if (/^[0-9*#]$/.test(key)) {
            e.preventDefault();
            this.addDigit(key);
        }
        
        // 退格键
        if (key === 'Backspace') {
            e.preventDefault();
            this.clearNumber();
        }
        
        // 回车键拨号
        if (key === 'Enter') {
            e.preventDefault();
            this.makeCall();
        }
    }

    // 播放按键音效
    playKeyTone(key) {
        // 这里可以添加实际的音效播放
        console.log(`播放按键音: ${key}`);
    }

    // 播放铃声
    playRingtone() {
        console.log('播放来电铃声');
        // 这里可以添加实际的铃声播放
    }

    // 停止铃声
    stopRingtone() {
        console.log('停止铃声');
        // 这里可以添加停止铃声的代码
    }

    // 按钮动画效果
    animateButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        }
    }

    // 按键动画效果
    animateKeyPress(key) {
        const keyElement = document.querySelector(`[data-number="${key}"]`);
        if (keyElement) {
            keyElement.style.transform = 'scale(0.9)';
            keyElement.style.background = 'rgba(52, 152, 219, 0.4)';
            setTimeout(() => {
                keyElement.style.transform = '';
                keyElement.style.background = '';
            }, 200);
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 9998;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        // 添加动画样式
        if (!document.querySelector('#notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // 自动移除通知
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 获取通知颜色
    getNotificationColor(type) {
        const colors = {
            'success': 'linear-gradient(135deg, #27ae60, #2ecc71)',
            'warning': 'linear-gradient(135deg, #f39c12, #e67e22)',
            'error': 'linear-gradient(135deg, #e74c3c, #c0392b)',
            'info': 'linear-gradient(135deg, #3498db, #2980b9)'
        };
        return colors[type] || colors.info;
    }


    // 获取系统配置
    getConfig() {
        return {
            contacts: this.contacts,
            // 可以添加其他配置项
            maxCallHistory: 10,
            keyToneEnabled: true,
            ringtoneEnabled: true
        };
    }

    // 获取当前状态
    getState() {
        return {
            currentCall: this.currentCall,
            isInCall: this.isInCall,
            isMuted: this.isMuted,
            isSpeakerOn: this.isSpeakerOn,
            isOnHold: this.isOnHold,
            callStartTime: this.callStartTime,
            // 保存通话记录（从DOM中获取）
            callHistory: this.getCallHistoryFromDOM()
        };
    }

    // 恢复状态
    // 在 CarPhoneSystem 类中修改 restoreState 方法
    restoreState(savedData) {
        if (!savedData) return;
        
        // 如果传入的是完整的保存数据（包含 config 和 state），则提取 state 部分
        const stateData = savedData.state || savedData;
        
        // 恢复基本状态
        this.currentCall = stateData.currentCall || null;
        this.isInCall = stateData.isInCall || false;
        this.isMuted = stateData.isMuted || false;
        this.isSpeakerOn = stateData.isSpeakerOn || false;
        this.isOnHold = stateData.isOnHold || false;
        this.callStartTime = stateData.callStartTime ? new Date(stateData.callStartTime) : null;
        
        // 如果有配置数据，也恢复配置
        if (savedData.config && savedData.config.contacts) {
            this.contacts = savedData.config.contacts;
        }
        
        // 如果有进行中的通话，恢复通话界面
        if (this.isInCall && this.currentCall) {
            this.restoreCallInterface();
        }
        
        // 恢复通话记录
        if (stateData.callHistory) {
            this.restoreCallHistory(stateData.callHistory);
            console.log("通话记录恢复");
        }
        
        console.log('系统状态已恢复');
    }

    // 从DOM获取通话记录
    getCallHistoryFromDOM() {
        const callHistory = document.getElementById('callHistory');
        if (!callHistory) return [];
        
        const items = callHistory.querySelectorAll('.call-item');
        const history = [];
        
        items.forEach(item => {
            const name = item.querySelector('.call-name')?.textContent || '';
            const time = item.querySelector('.call-time')?.textContent || '';
            const type = item.querySelector('.call-type')?.textContent || '';
            const number = item.querySelector('.call-btn')?.dataset.number || '';
            const callType = item.classList.contains('incoming') ? 'incoming' : 
                            item.classList.contains('outgoing') ? 'outgoing' : 'missed';
            
            history.push({ name, number, time, type, callType });
        });
        
        return history;
    }

    // 恢复通话记录
    restoreCallHistory(historyData) {
        const callHistory = document.getElementById('callHistory');
        if (!callHistory || !historyData.length) return;
        
        // 清空现有记录
        callHistory.innerHTML = '';
        
        // 重新添加记录
        historyData.forEach(record => {
            const callItem = document.createElement('div');
            callItem.className = `call-item ${record.callType}`;
            callItem.innerHTML = `
                <div class="call-info">
                    <div class="call-name">${record.name}</div>
                    <div class="call-details">
                        <span class="call-time">${record.time}</span>
                        <span class="call-type">${record.type}</span>
                    </div>
                </div>
                <div class="call-actions">
                    <button class="action-btn call-btn" data-number="${record.number}">📞</button>
                    <button class="action-btn msg-btn">💬</button>
                </div>
            `;
            
            callHistory.appendChild(callItem);
            
            // 重新绑定事件
            const callBtn = callItem.querySelector('.call-btn');
            if (callBtn) {
                callBtn.addEventListener('click', (e) => {
                    const number = e.currentTarget.dataset.number;
                    this.quickDial(number);
                });
            }
        });
    }

    // 恢复通话界面
    restoreCallInterface() {
        // 显示通话界面，隐藏拨号器
        const dialerWidget = document.getElementById('dialerWidget');
        const callWidget = document.getElementById('callWidget');
        
        if (dialerWidget) dialerWidget.classList.add('hidden');
        if (callWidget) callWidget.classList.remove('hidden');
        
        // 更新通话信息
        const callerNameElement = document.getElementById('callerName');
        const callerNumberElement = document.getElementById('callerNumber');
        const callStateElement = document.getElementById('callState');
        
        if (this.currentCall) {
            if (callerNameElement) callerNameElement.textContent = this.currentCall.name;
            if (callerNumberElement) callerNumberElement.textContent = this.currentCall.number;
            if (callStateElement) {
                callStateElement.textContent = this.isOnHold ? '通话保持中...' : '通话中...';
            }
        }
        
        // 恢复按钮状态
        this.restoreButtonStates();
        
        // 重新启动计时器
        if (this.callStartTime) {
            this.startCallTimer();
        }
    }

    // 恢复按钮状态
    restoreButtonStates() {
        // 静音按钮
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            if (this.isMuted) {
                muteBtn.classList.add('active');
                this.updateButtonText('muteBtn', '🔇', '取消静音');
            } else {
                muteBtn.classList.remove('active');
                this.updateButtonText('muteBtn', '🎤', '静音');
            }
        }
        
        // 免提按钮
        const speakerBtn = document.getElementById('speakerBtn');
        if (speakerBtn) {
            if (this.isSpeakerOn) {
                speakerBtn.classList.add('active');
                this.updateButtonText('speakerBtn', '🔊', '关闭免提');
            } else {
                speakerBtn.classList.remove('active');
                this.updateButtonText('speakerBtn', '🔈', '免提');
            }
        }
        
        // 保持按钮
        const holdBtn = document.getElementById('holdBtn');
        if (holdBtn) {
            if (this.isOnHold) {
                holdBtn.classList.add('active');
                this.updateButtonText('holdBtn', '▶️', '恢复');
            } else {
                holdBtn.classList.remove('active');
                this.updateButtonText('holdBtn', '⏸️', '保持');
            }
        }
    }

    // 序列化实例数据（用于其他通信方式）
    serialize() {
        return JSON.stringify(this.getState());
    }

    // 反序列化数据
    deserialize(data) {
        try {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            this.restoreState(parsedData);
        } catch (error) {
            console.error('反序列化失败:', error);
        }
    }

    // 更新显示状态
    updateDisplay() {
        // 更新号码显示
        const phoneNumber = document.getElementById('phoneNumber');
        if (phoneNumber && this.currentCall && !this.isInCall) {
            phoneNumber.value = this.currentCall.number || '';
        }
        
        // 更新通话界面显示
        if (this.isInCall && this.currentCall) {
            this.updateCallDisplay();
        } else {
            this.updateDialerDisplay();
        }
        
        // 更新按钮状态
        this.updateAllButtonStates();
        
        // 更新通话记录显示
        this.updateCallHistoryDisplay();
        
        console.log('显示状态已更新');
    }

    // 更新通话界面显示
    updateCallDisplay() {
        const dialerWidget = document.getElementById('dialerWidget');
        const callWidget = document.getElementById('callWidget');
        
        if (dialerWidget) dialerWidget.classList.add('hidden');
        if (callWidget) callWidget.classList.remove('hidden');
        
        // 更新通话信息
        const callerNameElement = document.getElementById('callerName');
        const callerNumberElement = document.getElementById('callerNumber');
        const callStateElement = document.getElementById('callState');
        
        if (this.currentCall) {
            if (callerNameElement) callerNameElement.textContent = this.currentCall.name;
            if (callerNumberElement) callerNumberElement.textContent = this.currentCall.number;
            if (callStateElement) {
                callStateElement.textContent = this.isOnHold ? '通话保持中...' : '通话中...';
            }
        }
        
        // 重新启动计时器
        if (this.callStartTime && !this.callTimer) {
            this.startCallTimer();
        }
    }

    // 更新拨号器显示
    updateDialerDisplay() {
        const dialerWidget = document.getElementById('dialerWidget');
        const callWidget = document.getElementById('callWidget');
        
        if (dialerWidget) dialerWidget.classList.remove('hidden');
        if (callWidget) callWidget.classList.add('hidden');
    }

    // 更新所有按钮状态
    updateAllButtonStates() {
        // 静音按钮
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            if (this.isMuted) {
                muteBtn.classList.add('active');
                this.updateButtonText('muteBtn', '🔇', '取消静音');
            } else {
                muteBtn.classList.remove('active');
                this.updateButtonText('muteBtn', '🎤', '静音');
            }
        }
        
        // 免提按钮
        const speakerBtn = document.getElementById('speakerBtn');
        if (speakerBtn) {
            if (this.isSpeakerOn) {
                speakerBtn.classList.add('active');
                this.updateButtonText('speakerBtn', '🔊', '关闭免提');
            } else {
                speakerBtn.classList.remove('active');
                this.updateButtonText('speakerBtn', '🔈', '免提');
            }
        }
        
        // 保持按钮
        const holdBtn = document.getElementById('holdBtn');
        if (holdBtn) {
            if (this.isOnHold) {
                holdBtn.classList.add('active');
                this.updateButtonText('holdBtn', '▶️', '恢复');
            } else {
                holdBtn.classList.remove('active');
                this.updateButtonText('holdBtn', '⏸️', '保持');
            }
        }
    }

    // 更新通话记录显示
    updateCallHistoryDisplay() {
        const callHistory = document.getElementById('callHistory');
        if (!callHistory) return;
        
        // 重新绑定所有通话记录的事件
        const callBtns = callHistory.querySelectorAll('.call-btn');
        callBtns.forEach(btn => {
            // 移除旧的事件监听器，添加新的
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                const number = e.currentTarget.dataset.number;
                this.quickDial(number);
            });
        });
    }

}

// 添加隐藏类样式
const style = document.createElement('style');
style.textContent = `
    .hidden {
        display: none !important;
    }
    
    .control-btn.active {
        background: rgba(52, 152, 219, 0.3) !important;
        border-color: #3498db !important;
        color: #3498db !important;
    }
    
    .control-btn.end-call {
        background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
    }
    
    .control-btn.end-call:hover {
        background: linear-gradient(135deg, #c0392b, #a93226) !important;
    }
`;
document.head.appendChild(style);

const carPhoneSystem = new CarPhoneSystem();
// 页面加载完成后初始化系统
document.addEventListener('DOMContentLoaded', () => {
    const activeNavBtn = document.querySelector('.nav-btn.active');
    const isPhonePage = activeNavBtn && activeNavBtn.textContent.includes('📞');
    if (isPhonePage) {
        console.log('✅ 通过导航状态确认：这是电话页面');
            // 获取保存的数据
            const savedData = JSON.parse(localStorage.getItem('carPhoneSystemData') || '{}');
            
            // 恢复状态
            carPhoneSystem.init();
            carPhoneSystem.restoreState(savedData);
            carPhoneSystem.updateDisplay();

            function saveCarPhoneSystemData() {
                try {
                    const systemDataPhone = {
                        isInitialized: true,
                        config: carPhoneSystem.getConfig(),
                        state: carPhoneSystem.getState(),
                        lastSaved: new Date().toISOString()
                    };
                    localStorage.setItem('carPhoneSystemData', JSON.stringify(systemDataPhone));
                    localStorage.setItem('carPhoneSystemInitialized', 'true');
                    console.log('📱 电话系统数据已保存 -', new Date().toLocaleTimeString());
                } catch (error) {
                    console.error('保存电话系统数据失败:', error);
                } 
            }

            setInterval(() => saveCarPhoneSystemData(), 3000);
    }
});

// 监听localStorage变化
window.addEventListener('storage', function(event) {
    if (event.key === 'crossPageMessage' && event.newValue) {
        try {
            const message = JSON.parse(event.newValue);
            console.log('收到跨页面消息:', message);
            
            // 处理消息
            handleCrossPageMessage(message);
        } catch (error) {
            console.error('解析跨页面消息失败:', error);
        }
    }
});

// 页面加载时检查是否有待处理的消息
document.addEventListener('DOMContentLoaded', function() {
    const pendingMessage = localStorage.getItem('crossPageMessage');
    if (pendingMessage) {
        try {
            const message = JSON.parse(pendingMessage);
            handleCrossPageMessage(message);
            localStorage.removeItem('crossPageMessage');
        } catch (error) {
            console.error('处理待处理消息失败:', error);
        }
    }
});

// 处理消息的函数
function handleCrossPageMessage(data) {
    if (data.type === 'phone') {
        if (data.content === 'start') {
            const savedData = JSON.parse(localStorage.getItem('carPhoneSystemData') || '{}');
            carPhoneSystem.restoreState(savedData);
            carPhoneSystem.answerIncomingCall();
        }
        else if (data.content === 'end') {
            const savedData = JSON.parse(localStorage.getItem('carPhoneSystemData') || '{}');
            carPhoneSystem.restoreState(savedData);
            carPhoneSystem.declineIncomingCall();
        }
        else if (data.content === 'hang_up') {
            const savedData = JSON.parse(localStorage.getItem('carPhoneSystemData') || '{}');
            carPhoneSystem.restoreState(savedData);
            carPhoneSystem.endCall();
        }
        else if (data.content === 'make') {
            const savedData = JSON.parse(localStorage.getItem('carPhoneSystemData') || '{}');
            carPhoneSystem.restoreState(savedData);
            if (data.contacts && /^\d/.test(String(data.contacts))) { //数字拨号
                if (carPhoneSystem.isInCall) {
                    carPhoneSystem.showNotification('当前正在通话中', 'warning');
                    return;
                }
                let number = data.contacts;
                const callerName = carPhoneSystem.contacts[number] || '未知联系人';
                carPhoneSystem.startCall(callerName, number, 'outgoing');
                carPhoneSystem.showNotification(`正在拨打 ${callerName}`, 'info');
            }
            else { //联系人
                if (carPhoneSystem.isInCall) {
                    carPhoneSystem.showNotification('当前正在通话中', 'warning');
                    return;
                }
                const entry = Object.entries(carPhoneSystem.contacts).find(([phone, contactName]) => contactName === data.contacts);
                let number = entry[0];
                const callerName = carPhoneSystem.contacts[number] || '未知联系人';
                carPhoneSystem.startCall(callerName, number, 'outgoing');
                carPhoneSystem.showNotification(`正在拨打 ${callerName}`, 'info');
            }
        }
    }
}
