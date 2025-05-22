export function initAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const mainInterface = document.querySelector('.main-interface');
    const authModal = document.getElementById('authModal');

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

            // 根据角色显示令牌输入
            document.getElementById('role').addEventListener('change', function() {
                document.getElementById('PermissioncodeField').style.display = 
                    ['admin','maintenance'].includes(this.value) ? 'block' : 'none';
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

function loadRoleSpecificFeatures(role) {
    // 隐藏所有特权模块
    $('.privilege-module').hide();
    
    // 根据角色显示对应模块
    switch(role) {
        case 'admin':
            $('#adminDashboard').show();
            $('#auditLogSection').show();
            break;
        case 'maintenance':
            $('#maintenanceTools').show();
            $('#diagnosticReports').show();
            break;
        case 'driver':
            $('#navigationPanel').show();
            $('#rideHistory').show();
            break;
        default:
            $('#passengerView').show();
    }
}

function handleLoginResponse(userData) {
    localStorage.setItem('access_token', userData.access_token);
    localStorage.setItem('user_role', userData.role);  // 新增角色存储
    
    // 根据角色加载功能模块
    loadRoleSpecificFeatures(userData.role);
    
    // 隐藏登录模态框
    $('#loginModal').modal('hide');
}