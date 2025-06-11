import { startHUD } from '../hud.js';
// 功能1：获取指令编码并操作对应前端
// 功能2：警告类

//----------------------------------------------警告类---------------------------------------------------------------
// 警告与通知系统类
export class WarningSystem {
    constructor() {
        this.overlay = document.getElementById('warningOverlay');
        this.textElement = document.getElementById('warningText');
        this.iconElement = document.querySelector('.warning-icon');
        this.closeButton = document.getElementById('warningClose');
        this.isVisible = false;
        this.autoHideTimer = null;
        
        // 创建音频对象
        this.audio = new Audio();
        this.audio.src = '../assets/music/alert_sound.mp3';
        
        // 绑定关闭事件
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }
        
        // 点击覆盖层外部区域关闭（可选）
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });
        }
    }
    
    /**
     * 显示警告（播放声音）
     * @param {string} message - 警告文字内容
     * @param {Object} options - 配置选项
     */
    show(message, options = {}) {
        if (!this.overlay || !this.textElement) {
            console.error('警告系统未正确初始化');
            return;
        }
        
        const config = {
            autoHide: options.autoHide,
            duration: options.duration || 5000,
            playSound: options.playSound || false,
            warningFrequency: options.warningFrequency || 500, // 默认闪烁频率
            secondaryMessage: options.secondaryMessage || null, // 第二条信息
            secondaryDuration: options.secondaryDuration || 5000, // 第二条信息的显示时间
            secondaryWarningFrequency: options.secondaryWarningFrequency || 500 // 第二条信息的闪烁频率
        };
        
        // 移除通知模式样式
        this.overlay.classList.remove('notification-mode');
        
        // 设置警告图标和文字
        if (this.iconElement) {
            this.iconElement.textContent = '⚠️';
        }
        this.textElement.textContent = message;
        
        // 显示覆盖层
        this.overlay.style.display = 'block';
        this.isVisible = true;
        
        // 播放警告声音
        if (config.playSound) {
            this.playWarningSound();
            // 调用startHUD函数并传递警告灯参数
            console.log('show调用startHUD函数并传递警告灯参数');
            startHUD(60, 15, 4000, 4, 90, true, config.warningFrequency);
        }
        
        // 自动隐藏
        if (config.autoHide) {
            this.setAutoHide(config.duration);
        }
        
        // 如果有第二条信息，设置定时器在指定时间后更新信息
        if (config.secondaryMessage) {
            setTimeout(() => {
                this.updateMessage(config.secondaryMessage, config.secondaryWarningFrequency);
                // 如果有第二条信息的显示时间，设置定时器在指定时间后隐藏警告
                if (config.secondaryDuration) {
                    setTimeout(() => {
                        this.hide();
                    }, config.secondaryDuration);
                }
            }, config.duration);
        }
        
        console.log(`警告已显示: ${message}`);
    }
    
    /**
     * 显示通知（不播放声音）
     * @param {string} message - 通知文字内容
     * @param {Object} options - 配置选项
     */
    //  options 是例如{
    //     autoHide: true,
    //     duration: 3000
    // } 的内容，可省略
    showNotification(message, options = {}) {
        if (!this.overlay || !this.textElement) {
            console.error('通知系统未正确初始化');
            return;
        }
        
        const config = {
            autoHide: options.autoHide !== false,
            duration: options.duration || 1500,
            playSound: false
        };
        
        // 添加通知模式样式
        this.overlay.classList.add('notification-mode');
        
        // 设置通知图标和文字
        if (this.iconElement) {
            this.iconElement.textContent = '💡';
        }
        this.textElement.textContent = message;
        
        // 显示覆盖层
        this.overlay.style.display = 'block';
        this.isVisible = true;
        
        // 自动隐藏
        if (config.autoHide) {
            this.setAutoHide(config.duration);
        }
        
        console.log(`通知已显示: ${message}`);
    }
    
    /**
     * 隐藏警告/通知
     */
    hide() {
        if (!this.overlay) return;
        
        this.overlay.style.display = 'none';
        this.isVisible = false;
        
        // 移除通知模式样式
        this.overlay.classList.remove('notification-mode');

        // 停止播放警告声音
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            // 调用startHUD函数并关闭警告灯
            console.log('hide调用startHUD函数并传递警告灯参数');
            startHUD(60, 15, 4000, 4, 90, false, 30);
        }
        
        // 清除自动隐藏定时器
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
        
        console.log('警告/通知已隐藏');
    }
    
    /**
     * 设置自动隐藏
     * @param {number} duration - 持续时间（毫秒）
     */
    setAutoHide(duration) {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }
        
        this.autoHideTimer = setTimeout(() => {
            this.hide();
        }, duration);
    }
    
    /**
     * 播放警告声音
     */
    playWarningSound() {
        try {
            this.audio.currentTime = 0;
            this.audio.play().catch(error => {
                console.warn('无法播放警告声音:', error);
            });
        } catch (error) {
            console.warn('播放警告声音时出错:', error);
        }
    }
    
    /**
     * 检查是否正在显示
     */
    isShowing() {
        return this.isVisible;
    }
    
    /**
     * 更新警告文字（不重新显示）
     * @param {string} message - 新的警告文字
     * @param {number} warningFrequency - 新的闪烁频率
     */
    updateMessage(message, warningFrequency = 500) {
        if (this.textElement && this.isVisible) {
            this.textElement.textContent = message;
            // 调用startHUD函数并更新闪烁频率
            console.log('updateMessage调用startHUD函数并传递警告灯参数');
            startHUD(60, 15, 4000, 4, 90, true, warningFrequency);
        }
    }
}

const warningSystem = new WarningSystem();

//----------------------------------------------------指令处理--------------------------------------
export let isEmergency = false; // 紧急状态标志

// 指令编码处理主函数
export function processInstructionCode(instructionCode, source) {
    try {
        const parsedInstruction = parseInstructionCode(instructionCode);
        console.log(`${source}指令解析结果:`, parsedInstruction);
        
        // 执行相应的车辆控制操作
        executeVehicleCommand(parsedInstruction, source);
        
    } catch (error) {
        console.error(`解析${source}指令编码失败:`, error);
    }
}

// 指令编码解析函数
export function parseInstructionCode(instructionCode) {
    // 正则表达式匹配指令格式: AABB[文字描述]
    const instructionRegex = /^(\d{2})(\d{2})(?:\[([^\]]*)\])?$/;
    const match = instructionCode.match(instructionRegex);
    
    if (!match) {
        throw new Error(`无效的指令编码格式: ${instructionCode}`);
    }
    
    const [, opcode, operand, description] = match;
    
    return {
        opcode: parseInt(opcode, 10),
        operand: parseInt(operand, 10),
        description: description || null,
        originalCode: instructionCode,
        opcodeAction: getOpcodeAction(parseInt(opcode, 10)),
        operandTarget: getOperandTarget(parseInt(operand, 10))
    };
}

// 操作码映射
export function getOpcodeAction(opcode) {
    const opcodeMap = {
        0: 'TURN_ON',      // 打开
        1: 'TURN_OFF',     // 关闭
        2: 'SET_VALUE',    // 设置值
        3: 'START',        // 启动
        4: 'STOP',         // 停止
        5: 'INCREASE',     // 增加
        6: 'DECREASE',     // 减少
        7: 'TOGGLE',       // 切换
        8: 'QUERY',        // 查询
        9: 'ADJUST',       // 调整
        10: 'ACTIVATE',    // 激活
        11: 'DEACTIVATE',  // 停用
        12: 'SCHEDULE',    // 预约
        13: 'CANCEL_SCHEDULE', // 取消预约
        14: 'LOCATE',      // 定位
        15: 'CONNECT',     // 连接
        16: 'DISCONNECT',  // 断开连接
        17: 'SYNC',        // 同步
        18: 'RESET',       // 重置
        19: 'MODE_CHANGE', // 模式改变
        20: 'CUSTOM_SETTING', // 自定义设置
        21: 'SAVE_SETTING',   // 保存设置
        22: 'LOAD_SETTING',   // 加载设置
        23: 'EMERGENCY',      // 紧急操作
        24: 'STATUS_UPDATE',  // 状态更新
        25: 'CALCULATE',      // 计算
        26: 'PREVIOUS',       // 上一首 - 用于切换至上一首曲目
        27: 'NEXT',            //下一首 - 用于切换至下一首曲目
        28: 'CONFIRM',         // 确认 - 用于确认操作
        29: 'REJECT',          // 确认 - 用于确认操作
        30: 'CANCEL_EMERGENCY' // 取消紧急操作
    };
    
    return opcodeMap[opcode] || 'UNKNOWN';
}

// 操作数映射
export function getOperandTarget(operand) {
    const operandMap = {
        1: 'AC',                    // 空调
        2: 'NAVIGATION',            // 导航系统
        3: 'MEDIA_PLAYER',          // 媒体播放器
        4: 'WINDOW_DRIVER',         // 驾驶员车窗
        5: 'WINDOW_PASSENGER',      // 乘客车窗
        6: 'WINDOW_REAR_LEFT',      // 左后车窗
        7: 'WINDOW_REAR_RIGHT',     // 右后车窗
        8: 'SUNROOF',               // 天窗
        9: 'SEAT_HEATER_DRIVER',    // 驾驶员座椅加热
        10: 'SEAT_HEATER_PASSENGER', // 乘客座椅加热
        11: 'STEERING_WHEEL_HEATER', // 方向盘加热
        12: 'HEADLIGHT',            // 大灯
        13: 'FOG_LIGHT',            // 雾灯
        14: 'INTERIOR_LIGHT',       // 车内灯
        15: 'DOOR_LOCK',            // 车门锁
        16: 'TRUNK',                // 后备箱
        17: 'ENGINE',               // 发动机
        18: 'WIPERS',               // 雨刷
        19: 'REAR_WIPER',           // 后雨刷
        20: 'SIDE_MIRROR_LEFT',     // 左侧后视镜
        21: 'SIDE_MIRROR_RIGHT',    // 右侧后视镜
        22: 'REARVIEW_MIRROR',      // 车内后视镜
        23: 'PARKING_BRAKE',        // 驻车制动
        24: 'CRUISE_CONTROL',       // 巡航控制
        25: 'LANE_ASSIST',          // 车道辅助
        26: 'COLLISION_AVOIDANCE',  // 碰撞避免系统
        27: 'BLUETOOTH',            // 蓝牙
        28: 'WIFI',                 // 无线网络
        29: 'PHONE',                // 电话
        30: 'TEXT_MESSAGE',         // 短信
        31: 'BATTERY',              // 电池
        32: 'CHARGING',             // 充电系统
        33: 'TIRE_PRESSURE',        // 胎压
        34: 'OIL_LEVEL',            // 机油液位
        35: 'FUEL_LEVEL',           // 燃油液位
        36: 'AIR_SUSPENSION',       // 空气悬挂
        37: 'DRIVING_MODE',         // 驾驶模式
        38: 'ECO_MODE',             // 经济模式
        39: 'SPORT_MODE',           // 运动模式
        40: 'COMFORT_MODE',         // 舒适模式
        41: 'AIR_QUALITY',          // 空气质量
        42: 'AMBIENT_LIGHTING',     // 氛围灯光
        43: 'SEAT_POSITION_DRIVER', // 驾驶员座椅位置
        44: 'SEAT_POSITION_PASSENGER', // 乘客座椅位置
        45: 'MASSAGE_DRIVER',       // 驾驶员座椅按摩
        46: 'MASSAGE_PASSENGER',    // 乘客座椅按摩
        47: 'VOICE_ASSISTANT',      // 语音助手
        48: 'CAMERA_SYSTEM',        // 摄像头系统
        49: 'PARKING_ASSIST',       // 泊车辅助
        50: 'TRAFFIC_INFO'          // 交通信息
    };
    
    return operandMap[operand] || 'UNKNOWN';
}

// 车辆控制命令执行器
export function executeVehicleCommand(instruction, source) {
    const { opcode, operand, description, opcodeAction, operandTarget } = instruction;
    
    console.log(`执行${source}指令: ${opcodeAction} ${operandTarget}`, description ? `参数: ${description}` : '');

    if (opcode === 23 ) { // 紧急状态
        isEmergency = true;
        // 显示警告灯并设置闪烁频率
        warningSystem.show("警告：请目视前方！", {
            autoHide: false,
            duration: 5000, // 第一条信息的显示时间--5s
            playSound: true,
            warningFrequency: 50,
            secondaryMessage: "警告：请立即目视前方！！！", // 第二条信息
            secondaryDuration: 120000, // 第二条信息的显示时间
            secondaryWarningFrequency: 10 // 第二条信息的闪烁频率
        });
        return 
    }

    if (opcode === 28 || opcode === 29 || opcode === 30) { // 解除紧急状态
        isEmergency = false;
        warningSystem.hide();
        return;
    }

    if (isEmergency) {
        console.log('紧急状态，忽略非解除指令');
        return; 
    }
    
    // 根据操作的对象分类
    switch (operandTarget) {
        case 'NAVIGATION':
            handleNavigation(opcodeAction, operandTarget, description);
            break;
        case 'MEDIA_PLAYER':
            handlePlayer(opcodeAction, operandTarget, description);
            break;
        case 'PHONE':
            handlePhone(opcodeAction, operandTarget, description);
            break;
        case 'TEXT_MESSAGE':
            handlePhone(opcodeAction, operandTarget, description);
            break;
        default:
            handleSetting(opcodeAction, operandTarget, description);
    }
}

// 发送消息
function sendMessage(data) {
    // 使用localStorage发送消息
    const message = {
        ...data,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9) // 生成唯一ID
    };
    
    localStorage.setItem('crossPageMessage', JSON.stringify(message));
    console.log('发送跨页面消息:', message);
    
    // 立即清除，避免存储堆积
    setTimeout(() => {
        localStorage.removeItem('crossPageMessage');
    }, 100);
}

// 电话界面功能
export function handlePhone(action, target, description) {
    switch (target) {
        case 'PHONE':
            if (action == 'START') {
                sendMessage({ type: 'phone', content: 'start' });
                warningSystem.showNotification("接听电话");
            }
            else if (action == 'STOP') {
                sendMessage({ type: 'phone', content: 'end' });
                warningSystem.showNotification("拒接电话");
            }
            else if (action == 'TURN_ON') {
                sendMessage({ type: 'phone', content: 'make' , contacts: description});
                warningSystem.showNotification(`拨打电话：${description}`);
            }
            else if (action == 'TURN_OFF') {
                sendMessage({ type: 'phone', content: 'hang_up' });
                warningSystem.showNotification("挂断电话");
            }
            break;
        case 'TEXT_MESSAGE':
            if (action == 'START') {
                warningSystem.showNotification(`发送短信：${description}`);
            }
            break;
        default:
            console.log(`操作 ${target}`);
    }
}

// 播放器界面功能
export function handlePlayer(action, target, description) {
    switch (target) {
        case 'MEDIA_PLAYER':
            if (action == 'START') {
                sendMessage({ type: 'player', content: 'start' });
                warningSystem.showNotification("开始播放音乐");
            }
            else if (action == 'STOP') {
                sendMessage({ type: 'player', content: 'stop' });
                warningSystem.showNotification("停止播放音乐");
            }
            else if (action == 'INCREASE') {
                sendMessage({ type: 'player', content: 'increase' });
                warningSystem.showNotification("音量增大");
            }
            else if (action == 'DECREASE') {
                sendMessage({ type: 'player', content: 'decrease' });
                warningSystem.showNotification("音量减小");
            }
            else if (action == 'PREVIOUS') {
                sendMessage({ type: 'player', content: 'previous' });
                warningSystem.showNotification("上一首");
            }
            else if (action == 'NEXT') {
                sendMessage({ type: 'player', content: 'next' });
                warningSystem.showNotification("下一首");
            }
            break;
        default:
            console.log(`操作 ${target}`);
    }
}

// 导航器界面功能
export function handleNavigation(action, target, description) {
    switch (target) {
        case 'NAVIGATION':
            if (action == 'START') {
                sendMessage({ type: 'nav', content: 'start' });
                warningSystem.showNotification("开始导航");
            }
            else if (action == 'STOP') {
                sendMessage({ type: 'nav', content: 'stop' });
                warningSystem.showNotification("停止导航");
            }
            else if (action == 'TURN_ON') {
                sendMessage({ type: 'nav', content: 'nav_to', place: description });
                warningSystem.showNotification(`开始导航，目的地为：${description}`);
            }
            break;
        default:
            console.log(`操作 ${target}`);
    }
}