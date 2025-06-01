/**
 * 车载通话系统 JavaScript 控制器
 * 实现拨号、来电、通话等功能
 */

class CarPhoneSystem {
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
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.createIncomingCallModal();
        this.createSimulateCallButton();
        console.log('车载通话系统初始化完成');
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
        document.getElementById('clearNumber').addEventListener('click', () => {
            this.clearNumber();
        });

        // 拨打电话按钮
        document.getElementById('makeCall').addEventListener('click', () => {
            this.makeCall();
        });

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
        document.getElementById('answerCall').addEventListener('click', () => {
            this.answerIncomingCall();
        });
        
        document.getElementById('declineCall').addEventListener('click', () => {
            this.declineIncomingCall();
        });
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
        
        nameElement.textContent = name;
        numberElement.textContent = number;
        
        modal.classList.remove('hidden');
        
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
        modal.classList.add('hidden');
    }

    // 添加数字到号码显示
    addDigit(digit) {
        const phoneNumber = document.getElementById('phoneNumber');
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
        const currentValue = phoneNumber.value;
        
        if (currentValue.length > 0) {
            phoneNumber.value = currentValue.slice(0, -1);
            this.animateButton('clearNumber');
        }
    }

    // 拨打电话
    makeCall() {
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        
        if (!phoneNumber) {
            this.showNotification('请输入电话号码', 'warning');
            return;
        }
        
        if (this.isInCall) {
            this.showNotification('当前正在通话中', 'warning');
            return;
        }
        
        const callerName = this.contacts[phoneNumber] || '未知联系人';
        this.startCall(callerName, phoneNumber, 'outgoing');
        this.showNotification(`正在拨打 ${callerName}`, 'info');
    }

    // 快速拨号
    quickDial(number) {
        if (this.isInCall) {
            this.showNotification('当前正在通话中', 'warning');
            return;
        }
        
        const callerName = this.contacts[number] || '未知联系人';
        document.getElementById('phoneNumber').value = number;
        this.startCall(callerName, number, 'outgoing');
        this.showNotification(`正在拨打 ${callerName}`, 'info');
    }

    // 开始通话
    startCall(name, number, type) {
        this.isInCall = true;
        this.currentCall = { name, number, type };
        this.callStartTime = new Date();
        
        // 隐藏拨号器，显示通话界面
        document.getElementById('dialerWidget').classList.add('hidden');
        document.getElementById('callWidget').classList.remove('hidden');
        
        // 更新通话界面信息
        document.getElementById('callerName').textContent = name;
        document.getElementById('callerNumber').textContent = number;
        document.getElementById('callState').textContent = type === 'incoming' ? '通话中...' : '正在连接...';
        
        // 启动通话计时器
        this.startCallTimer();
        
        // 模拟连接延迟（仅用于拨出电话）
        if (type === 'outgoing') {
            setTimeout(() => {
                if (this.isInCall) {
                    document.getElementById('callState').textContent = '通话中...';
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
        document.getElementById('callWidget').classList.add('hidden');
        document.getElementById('dialerWidget').classList.remove('hidden');
        
        // 重置通话状态
        this.resetCallState();
        
        // 清空号码显示
        document.getElementById('phoneNumber').value = '';
        
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
                document.getElementById('callTimer').textContent = timeString;
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
        const icon = muteBtn.querySelector('.control-icon');
        const label = muteBtn.querySelector('.control-label');
        
        if (this.isMuted) {
            icon.textContent = '🔇';
            label.textContent = '取消静音';
            muteBtn.classList.add('active');
            this.showNotification('已静音', 'info');
        } else {
            icon.textContent = '🎤';
            label.textContent = '静音';
            muteBtn.classList.remove('active');
            this.showNotification('已取消静音', 'info');
        }
        
        this.animateButton('muteBtn');
    }

    // 切换免提状态
    toggleSpeaker() {
        this.isSpeakerOn = !this.isSpeakerOn;
        const speakerBtn = document.getElementById('speakerBtn');
        const icon = speakerBtn.querySelector('.control-icon');
        const label = speakerBtn.querySelector('.control-label');
        
        if (this.isSpeakerOn) {
            icon.textContent = '🔊';
            label.textContent = '关闭免提';
            speakerBtn.classList.add('active');
            this.showNotification('免提已开启', 'info');
        } else {
            icon.textContent = '🔈';
            label.textContent = '免提';
            speakerBtn.classList.remove('active');
            this.showNotification('免提已关闭', 'info');
        }
        
        this.animateButton('speakerBtn');
    }

    // 切换保持状态
    toggleHold() {
        this.isOnHold = !this.isOnHold;
        const holdBtn = document.getElementById('holdBtn');
        const icon = holdBtn.querySelector('.control-icon');
        const label = holdBtn.querySelector('.control-label');
        const callState = document.getElementById('callState');
        
        if (this.isOnHold) {
            icon.textContent = '▶️';
            label.textContent = '恢复';
            holdBtn.classList.add('active');
            callState.textContent = '通话保持中...';
            this.showNotification('通话已保持', 'info');
        } else {
            icon.textContent = '⏸️';
            label.textContent = '保持';
            holdBtn.classList.remove('active');
            callState.textContent = '通话中...';
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
        callBtn.addEventListener('click', (e) => {
            const number = e.currentTarget.dataset.number;
            this.quickDial(number);
        });
        
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

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    window.carPhoneSystem = new CarPhoneSystem();
});
