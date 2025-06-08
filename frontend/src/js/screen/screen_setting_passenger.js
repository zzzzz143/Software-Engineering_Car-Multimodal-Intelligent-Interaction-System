// ---------------------------------------账号信息-----------------------------------------
class AccountManager {
    constructor() {
        this.accountData = {
            username: '--',
            email: '--',
            addresses: {
                home_address: '--',
                school_address: '--',
                company_address: '--'
            },
            wake_word: '--'
        }
        this.loadAccountData();
        this.initEventListeners();
    }

    // 加载账号信息
    async loadAccountData() {
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
            this.accountData.username = data.username || '--';
            this.accountData.email = data.email || '--';
            this.accountData.addresses = data.addresses || {
                home_address: '--',
                school_address: '--',
                company_address: '--'
            };
            this.accountData.wake_word = data.wake_word || '--';

            document.querySelector('.user-name').textContent = data.username || '--';
            document.querySelector('.user-email').textContent = data.email || '--';
            ;
        } catch (error) {
            console.error('加载账号信息失败:', error);
        }
    }

    // 初始化账号信息监听
    initEventListeners() {
        this.setupActionButtons();
        this.setupActionSettings();
    }

    // 设置操作按钮事件
    setupActionButtons() {
        const editBtn = document.querySelector('.edit-profile-btn');
        const syncBtn = document.querySelectorAll('.action-btn.secondary')[0];
        const BackupBtn = document.querySelectorAll('.action-btn.secondary')[1];
        const logoutBtn = document.querySelector('.action-btn.logout');

        if (editBtn) editBtn.addEventListener('click', (e) => this.handleEditProfile(e));
        if (syncBtn) syncBtn.addEventListener('click', (e) => this.handleSyncAccount(e));
        if (BackupBtn) BackupBtn.addEventListener('click', (e) => this.handleBackupAccount(e));
        if (logoutBtn) logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
    }

    // 设置操作设置项事件
    setupActionSettings() {
        const security = document.querySelector('.security');
        const notification = document.querySelector('.notification');
        const privacy = document.querySelector('.privacy');
        const payment = document.querySelector('.payment');
        const quicknav = document.querySelector('.quick-nav');
        const voiceassistant = document.querySelector('.voice-assistant');

        if (security) security.closest('.setting-item').addEventListener('click', (e) => this.handleSecuritySettings(e));
        if (notification) notification.closest('.setting-item').addEventListener('click', (e) => this.handleNotificationSettings(e));
        if (privacy) privacy.closest('.setting-item').addEventListener('click', (e) => this.handlePrivacySettings(e));
        if (payment) payment.closest('.setting-item').addEventListener('click', (e) => this.handlePaymentSettings(e));
        if (quicknav) quicknav.closest('.setting-item').addEventListener('click', (e) => this.handleQuickNavSettings(e));
        if (voiceassistant) voiceassistant.closest('.setting-item').addEventListener('click', (e) => this.handleVoiceSettings(e));
    }   

    // 编辑个人信息
    handleEditProfile () {
        const currentUsername = this.accountData.username || '';
        const currentEmail = this.accountData.email || '';
        const newUsername = prompt('请输入新用户名', currentUsername);
        const newEmail = prompt('请输入新邮箱', currentEmail);
        const finalUsername = newUsername !== null ? newUsername : currentUsername;
        const finalEmail = newEmail !== null ? newEmail : currentEmail;
        
        const updateData = {};
        if (finalUsername !== currentUsername) updateData.username = newUsername;
        if (finalEmail !== currentEmail) updateData.email = newEmail;

        try {
            if (Object.keys(updateData).length > 0) {
                this.updateAccountInfo(updateData);
                alert('修改成功');
            } else {
                alert('未修改任何信息');
            }
        } catch (error) {
            console.error('修改失败:', error);
            alert('修改失败');
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

        const updateData = {};
        if (newPassword!== oldPassword) {
            updateData.old_password = oldPassword;
            updateData.new_password = newPassword;
            try {
                this.updateAccountInfo(updateData);
                alert('密码修改成功');
            }
            catch (error) {
                console.error('修改失败:', error);
            }
        }
        else {
            alert('未修改任何信息');
        }
    }

    // 修改通知设置
    handleNotificationSettings () {
        
    }

    // 修改隐私设置
    handlePrivacySettings () {
        
    }

    // 修改支付设置
    handlePaymentSettings () {
        
    }

    // 修改快速导航设置
    handleQuickNavSettings () {
        const currentHomeAddress = this.accountData.addresses.home_address || '';
        const currentSchoolAddress = this.accountData.addresses.school_address || '';
        const currentCompanyAddress = this.accountData.addresses.company_address || '';

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
                this.updateAccountInfo(updateData);
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
    handleVoiceSettings () {
        const currentWakeWord = this.accountData.wake_word || '';
        const newWakeWord = prompt('请输入唤醒词', currentWakeWord);
        const finalWakeWord = newWakeWord !== null ? newWakeWord : currentWakeWord;
        
        const updateData = {};
        if (finalWakeWord!== currentWakeWord) {
            updateData.wake_word = finalWakeWord;
            try {
                this.updateAccountInfo(updateData);
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
                this.loadAccountData();
                console.log('账号信息更新成功');
            } else {
                console.error('更新账号信息失败:', data.error);
            }
        }
        catch (error) {
            console.error('更新账号信息失败:', error);
        }
    }

    // 同步账号信息
    handleSyncAccount () {
        this.loadAccountData();
    }

    // 备份账号信息
    handleBackupAccount () {
        
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
}

// ---------------------------------------全局初始化-----------------------------------------
let accountManager = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 初始化账户信息管理器
        accountManager = new AccountManager();
        
        // 设置全局引用，便于其他模块访问
        window.accountManager = accountManager;
        
        console.log('初始化账号信息完成');
        
    } catch (error) {
        console.error('初始化账号信息时出错:', error);
    }
});