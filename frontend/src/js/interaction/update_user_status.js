export function updateUserStatus() {
    const userStatus = document.getElementById('userStatus');
    const username = localStorage.getItem('username');
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