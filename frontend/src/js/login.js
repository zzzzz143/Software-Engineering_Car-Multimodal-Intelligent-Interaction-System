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

            
            if (response.ok) {
                const data = await response.json();
                console.log('登录成功:', data);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user_id', data.user_info.user_id);
                localStorage.setItem('username', data.user_info.username);
                localStorage.setItem('role', data.user_info.role);
                alert('登录成功！');

                let redirectUrl;
                switch(role) {
                    case 'admin':
                        redirectUrl = '../../public/user/admin_screen.html';
                        window.location.href = `${redirectUrl}`;
                        break;
                    case 'maintenance':
                        redirectUrl = '../../public/user/maintenance_screen.html';
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