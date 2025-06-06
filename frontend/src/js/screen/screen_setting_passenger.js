// ---------------------------------------账号信息-----------------------------------------
class AccountManager {
    constructor() {
        this.accountData = this.initializeAccountData();
    }

    // 初始化账号信息
    async initializeAccountData() {
        try {
            const response = await fetch('/api/account', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                console.error('加载账号信息失败:', response.statusText);
                return null;
            }
            const data = await response.json();
            console.log('加载的账号信息:', data);
            document.querySelector('.user-name').textContent = data.username || '--';
            document.querySelector('.user-email').textContent = data.email || '--';

            return {
                username: data.username || '--',
                email: data.email || '--',
                addresses: {
                    home_address: data.home_address || '--',
                    school_address: data.school_address || '--',
                    company_address: data.company_address || '--'
                },
                wake_word: data.wake_word || '--'
            };
        } catch (error) {
            console.error('加载账号信息失败:', error);
        }
    }

    // 初始化渲染所有内容
    initializeAccountListening() {
        this.setupActionButtons();
        this.setupActionSettings();
    }

    // 设置操作按钮事件
    setupActionButtons() {
        const editBtn = document.querySelector('.edit-profile-btn');
        const syncBtn = document.querySelectorAll('.action-btn.secondary')[0];
        const BackupBtn = document.querySelectorAll('.action-btn.secondary')[1];
        const dangerBtn = document.querySelector('.action-btn.danger');

        if (editBtn) editBtn.addEventListener('click', this.handleEditProfile);
        if (syncBtn) syncBtn.addEventListener('click', this.handleSyncAccount);
        if (BackupBtn) BackupBtn.addEventListener('click', this.handleBackupAccount);
        if (dangerBtn) dangerBtn.addEventListener('click', this.handleLogout);
    }

    // 设置操作设置项事件
    setupActionSettings() {
        const security = document.querySelector('.security');
        const notification = document.querySelector('.notification');
        const privacy = document.querySelector('.privacy');
        const payment = document.querySelector('.payment');
        const quicknav = document.querySelector('.quick-nav');
        const voiceassistant = document.querySelector('.voice-assistant');

        if (security) security.closest('.setting-item').addEventListener('click', this.handleSecuritySettings);
        if (notification) notification.closest('.setting-item').addEventListener('click', this.handleNotificationSettings);
        if (privacy) privacy.closest('.setting-item').addEventListener('click', this.handlePrivacySettings);
        if (payment) payment.closest('.setting-item').addEventListener('click', this.handlePaymentSettings);
        if (quicknav) quicknav.closest('.setting-item').addEventListener('click', this.handleQuickNavSettings);
        if (voiceassistant) voiceassistant.closest('.setting-item').addEventListener('click', this.handleVoiceSettings);
    }   

    // 编辑个人信息
    async handleEditProfile () {
        const currentUsername = this.username || '';
        const currentEmail = this.email || '';
        const newUsername = prompt('请输入新用户名', currentUsername);
        const newEmail = prompt('请输入新邮箱', currentEmail);
        const finalUsername = newUsername !== null ? newUsername : currentUsername;
        const finalEmail = newEmail !== null ? newEmail : currentEmail;
        
        const updateData = {};
        if (finalUsername !== currentUsername) updateData.username = newUsername;
        if (finalEmail !== currentEmail) updateData.email = newEmail;

        try {
            if (Object.keys(updateData).length > 0) {
                await this.updateAccountInfo(updateData);
                alert('修改成功');
            } else {
                alert('未修改任何信息');
            }
        } catch (error) {
            console.error('修改失败:', error);
            alert('修改失败');
        }
    }

    // 同步账号信息
    async handleSyncAccount () {
        initializeAccountData();
    }

    // 备份账号信息
    async handleBackupAccount () {
        
    }

    // 退出登录
    async handleLogout () {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
            });
            if (response.ok) {
                window.parent.location.href = '/login.html'; 
                // 清空localStorage
                localStorage.clear();
                alert('退出登录成功');
            }
        }
        catch (error) {
            console.error('退出登录失败:', error);
            alert('退出登录失败');
        }
    }

    // 修改密码
    async handleSecuritySettings () {
        const oldPassword = prompt('请输入旧密码');
        const newPassword = prompt('请输入新密码');
        const confirmPassword = prompt('请再次输入新密码');
        if (newPassword !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert('请填写完整的密码信息');
            return;
        }
        try {
            const response = await fetch('/api/account/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    oldPassword: oldPassword,
                    newPassword: newPassword
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
            } else {
                alert(data.error);
            }
        }
        catch (error) {
            console.error('修改密码失败:', error);
            alert('修改失败');
        }
    }

    // 修改通知设置
    async handleNotificationSettings () {
        
    }

    // 修改隐私设置
    async handlePrivacySettings () {
        
    }

    // 修改支付设置
    async handlePaymentSettings () {
        
    }

    // 修改快速导航设置
    async handleQuickNavSettings () {
        const currentHomeAddress = this.home_address || '';
        const currentSchoolAddress = this.school_address || '';
        const currentCompanyAddress = this.company_address || '';

        const newHomeAddress = prompt('请输入家庭地址', currentHomeAddress);
        const newSchoolAddress = prompt('请输入学校地址', currentSchoolAddress);
        const newCompanyAddress = prompt('请输入公司地址', currentCompanyAddress);
        
        const finalHomeAddress = newHomeAddress !== null ? newHomeAddress : currentHomeAddress;
        const finalSchoolAddress = newSchoolAddress!== null ? newSchoolAddress : currentSchoolAddress;
        const finalCompanyAddress = newCompanyAddress!== null ? newCompanyAddress : currentCompanyAddress;

        const updateData = { addresses: {} };
        if (finalHomeAddress !== currentHomeAddress) updateData.addresses.home_address = finalHomeAddress;
        if (finalSchoolAddress !== currentSchoolAddress) updateData.addresses.school_address = finalSchoolAddress;
        if (finalCompanyAddress !== currentCompanyAddress) updateData.addresses.company_address = finalCompanyAddress;
        try {
            if (Object.keys(updateData.addresses).length > 0) {
                await this.updateAccountInfo(updateData);
                alert('地址修改成功');
            }
            else {
                alert('未修改任何信息');
            }
        }
        catch (error) {
            console.error('修改失败:', error);
        }
    }

    // 修改语音助手设置
    async handleVoiceSettings () {
        const currentWakeWord = this.wake_word || '';
        const newWakeWord = prompt('请输入唤醒词', currentWakeWord);
        const finalWakeWord = newWakeWord !== null ? newWakeWord : currentWakeWord;
        
        const updateData = {};
        if (finalWakeWord!== currentWakeWord) {
            updateData.wake_word = finalWakeWord;
            try {
                await this.updateAccountInfo(updateData);
                alert('唤醒词修改成功');
            }
            catch (error) {
                console.error('修改失败:', error);
            }
        }
        else {
            alert('未修改任何信息');
        }
    }

    async updateAccountInfo(updateData) {
        try {
            const response = await fetch('/api/account', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            const data = await response.json();
            if (response.ok) {
                this.loadAccountInfo();
            }
        }
        catch (error) {
            console.error('更新账号信息失败:', error);
        }
    }
}

// ---------------------------------------全局初始化-----------------------------------------
let accountManager = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 初始化账户信息管理器
        accountManager = new AccountManager();
        accountManager.initializeAccountListening();
        
        // 设置全局引用，便于其他模块访问
        window.accountManager = accountManager;
        
        console.log('初始化账号信息完成');
        
    } catch (error) {
        console.error('初始化账号信息时出错:', error);
    }
});