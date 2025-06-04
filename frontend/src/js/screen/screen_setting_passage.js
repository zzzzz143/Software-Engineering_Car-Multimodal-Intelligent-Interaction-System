// ---------------------------------------账号信息-----------------------------------------
class AccountManager {
    constructor() {
        this.username = null;
        this.email = null;
        this.home_address = null;
        this.school_address = null;
        this.company_address = null;
        this.wake_word = null;
        this.initEventListeners();
        this.loadAccountInfo();
    }
    async loadAccountInfo() {
        try {
            const response = await fetch('/api/publicUser/account', {
                headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
            });
            if (response.ok) {
                const data = await response.json();
                console.log('加载的账号信息:', data);
                document.querySelector('.user-name').textContent = data.username || '--';
                document.querySelector('.user-email').textContent = data.email || '--';
    
                this.username = data.username;
                this.email = data.email;
                this.home_address = data.addresses.home_address;
                this.school_address = data.addresses.school_address;
                this.company_address = data.addresses.company_address;
                this.wake_word = data.wake_word;    
            } else {
                console.error('加载账号信息失败:', response.statusText);
            }
        } catch (error) {
            console.error('加载账号信息失败:', error);
        }
    }

    initEventListeners() {
        // 基础信息编辑
        document.querySelector('.edit-profile-btn').addEventListener('click', this.handleEditProfile);
        
        const settings = {
            password: document.querySelector('.security'), // 对应🔐图标
            quicknav: document.querySelector('.quick-nav'), // 对应⚡图标
            voice: document.querySelector('.voice-assistant') // 对应🎤图标
        };

        if (settings.password) {
            settings.password.closest('.setting-item').addEventListener('click', () => this.handlePasswordChange());
        }
        if (settings.quicknav) {
            settings.quicknav.closest('.setting-item').addEventListener('click', () => this.handleQuickNavSettings());
        }
        if (settings.voice) {
            settings.voice.closest('.setting-item').addEventListener('click', () => this.handleVoiceSettings());
        }
    }

    handleEditProfile = async () => {
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

    handlePasswordChange = async () => {
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
            const response = await fetch('/api/publicUser/account/password', {
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
            if (response.ok) {
                const data = await response.json();
                alert(data.message);
            } else {
                console.error('修改密码失败:', response.statusText);
            }
        }
        catch (error) {
            console.error('修改密码失败:', error);
            alert('修改失败');
        }
    }

    handleQuickNavSettings = async () => {
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

    handleVoiceSettings = async () => {
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
            const response = await fetch('/api/publicUser/account', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            if (response.ok) {
                const data = await response.json();
                this.loadAccountInfo();
            } else {
                console.error('更新账号信息失败:', response.statusText);
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
        
        // 设置全局引用，便于其他模块访问
        window.accountManager = accountManager;
        
        console.log('初始化账号信息完成');
        
    } catch (error) {
        console.error('初始化账号信息时出错:', error);
    }
});