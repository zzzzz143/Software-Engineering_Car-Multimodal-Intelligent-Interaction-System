export function initAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const mainInterface = document.querySelector('.main-interface');
    const authModal = document.getElementById('authModal');

    // 登录功能
    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                authModal.style.display = 'none';
                mainInterface.style.display = 'block';
                updateUserStatus(username);
            } else {
                alert(`登录失败: ${data.error}`);
            }
        } catch (error) {
            alert('登录失败: ' + error.message);
        }
    });

    // 注册功能
    registerBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (response.status === 201) {
                alert('注册成功，请登录');
            } else {
                alert(`注册失败: ${data.error}`);
            }
        } catch (error) {
            alert('注册失败: ' + error.message);
        }
    });
}

function updateUserStatus(username) {
    const userStatus = document.getElementById('userStatus');
    userStatus.textContent = `已登录：${username}`;
    userStatus.style.color = 'green';
}