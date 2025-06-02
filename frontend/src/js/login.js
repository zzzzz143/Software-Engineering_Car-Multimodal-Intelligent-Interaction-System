document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // 根据角色显示令牌输入
    document.getElementById('role').addEventListener('change', function() {
        document.getElementById('PermissioncodeField').style.display = 
            ['admin','maintenance'].includes(this.value) ? 'block' : 'none';
    });

    // 登录功能
    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password, role})
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                localStorage.setItem('role', role);
                alert('登录成功！');

                let redirectUrl;
                switch(role) {
                    case 'admin':
                        redirectUrl = '../../public/user/admin.html';
                        window.location.href = `${redirectUrl}`;
                        break;
                    case 'maintenance':
                        redirectUrl = '../../public/user/maintenance.html';
                        window.location.href = `${redirectUrl}`;
                        break;
                    default:
                        redirectUrl = '../../public/main.html';
                        window.location.href = `${redirectUrl}?role=${role}`;
                        break;
                }
            } else {
                alert(`登录失败: ${data.error}`);
            }
        } catch (error) {
            alert('登录错误: ' + error.message);
        }
    });

    // 注册功能
    registerBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        const Permissioncode = document.getElementById('Permissioncode').value || null;
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    username, 
                    password, 
                    role,
                    Permissioncode
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('注册成功，请登录');
            } else {
                alert(`注册失败: ${data.error}`);
            }
        } catch (error) {
            alert('注册失败: ' + error.message);
        }
    });
}); 