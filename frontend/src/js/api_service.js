// 整合所有API相关功能
import { displayResponse, speakResponse } from './response_view.js';

// 聊天功能初始化
export function initChat() {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');

    sendBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/chat', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeader()
                },
                body: JSON.stringify({ input: userInput.value })
            });

            if (response.ok) {
                const data = await response.json();
                displayResponse(data.choices[0].message.content);
                speakResponse(data.choices[0].message.content);
            }
        } catch (error) {
            console.error("API请求失败:", error);
        }
    });
}

// 认证相关功能
function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 登录接口
export async function login(username, password) {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });
    return response.json();
}

// 注册接口
export async function register(username, password, email) {
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password, email })
    });
    return response.json();
}
