/**
 * 网易云音乐API服务
 * 封装网易云音乐API调用，用于获取音乐资源
 */
class NeteaseApiService {
    constructor() {
        // 网易云API baseURL
        this.baseUrl = 'http://127.0.0.1:3001';
        // 用户登录状态
        this.userInfo = null;
        this.token = null;
        
        // 初始化时检查本地存储的登录状态
        this.initializeAuth();
    }

    /**
     * 初始化认证状态
     * 从localStorage恢复用户信息和token
     */
    initializeAuth() {
        try {
            const savedToken = localStorage.getItem('netease_token');
            const savedUser = localStorage.getItem('netease_user');
            
            if (savedToken) {
                this.token = savedToken;
            }
            
            if (savedUser) {
                this.userInfo = JSON.parse(savedUser);
            }
        } catch (error) {
            console.error('初始化认证状态失败:', error);
        }
    }

    /**
     * 检查是否已登录
     * @return {boolean} - 是否已登录
     */
    isLoggedIn() {
        return this.token && this.userInfo;
    }

    /**
     * 获取当前用户信息
     * @return {Object|null} - 用户信息
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * 生成二维码登录key
     * @return {Promise<string>} - 返回二维码key
     */
    async generateQrKey() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`${this.baseUrl}/login/qr/key?timestamp=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`生成二维码key失败: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.data && data.data.unikey) {
                return data.data.unikey;
            } else {
                throw new Error('二维码key生成响应结构异常');
            }
        } catch (error) {
            console.error('生成二维码key时出错:', error);
            throw error;
        }
    }

    /**
     * 生成二维码图片
     * @param {string} key - 二维码key
     * @return {Promise<Object>} - 返回二维码信息
     */
    async createQrCode(key) {
        try {
            const timestamp = Date.now();
            const response = await fetch(`${this.baseUrl}/login/qr/create?key=${key}&qrimg=true&timestamp=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`生成二维码失败: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.data) {
                return {
                    qrimg: data.data.qrimg,
                    qrurl: data.data.qrurl
                };
            } else {
                throw new Error('二维码生成响应结构异常');
            }
        } catch (error) {
            console.error('生成二维码时出错:', error);
            throw error;
        }
    }

    /**
     * 检查二维码扫码状态
     * @param {string} key - 二维码key
     * @return {Promise<Object>} - 返回扫码状态
     */
    async checkQrStatus(key) {
        try {
            const timestamp = Date.now();
            const response = await fetch(`${this.baseUrl}/login/qr/check?key=${key}&timestamp=${timestamp}&noCookie=true`);
            
            if (!response.ok) {
                throw new Error(`检查二维码状态失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('检查二维码状态时出错:', error);
            throw error;
        }
    }

    /**
     * 获取用户详细信息
     * @return {Promise<Object>} - 返回用户详细信息
     */
    async getUserDetail() {
        try {
            if (!this.token) {
                throw new Error('未登录');
            }
            
            const timestamp = Date.now();
            const response = await fetch(`${this.baseUrl}/user/detail?timestamp=${timestamp}`, {
                headers: {
                    'Cookie': this.token
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取用户信息失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取用户信息时出错:', error);
            throw error;
        }
    }

    /**
     * 保存登录信息
     * @param {string} cookie - 登录cookie
     * @param {Object} userInfo - 用户信息
     */
    saveLoginInfo(cookie, userInfo) {
        try {
            this.token = cookie;
            this.userInfo = userInfo;
            
            // 保存到localStorage
            localStorage.setItem('netease_token', cookie);
            localStorage.setItem('netease_user', JSON.stringify(userInfo));
            
            console.log('✅ 登录信息已保存');
        } catch (error) {
            console.error('保存登录信息失败:', error);
        }
    }

    /**
     * 退出登录
     */
    logout() {
        try {
            this.token = null;
            this.userInfo = null;
            
            // 清除localStorage
            localStorage.removeItem('netease_token');
            localStorage.removeItem('netease_user');
            
            console.log('✅ 已退出登录');
        } catch (error) {
            console.error('退出登录失败:', error);
        }
    }

    /**
     * 启动二维码登录轮询
     * @param {string} key - 二维码key
     * @param {Function} onStatusChange - 状态变化回调
     * @return {number} - 定时器ID
     */
    startQrPolling(key, onStatusChange) {
        const timer = setInterval(async () => {
            try {
                const result = await this.checkQrStatus(key);
                const code = result.code;
                
                if (onStatusChange) {
                    onStatusChange(code, result);
                }
                
                // 处理不同状态码
                switch (code) {
                    case 800: // 二维码过期
                        clearInterval(timer);
                        console.log('二维码已过期');
                        break;
                        
                    case 801: // 等待扫码
                        console.log('等待扫码...');
                        break;
                        
                    case 802: // 待确认
                        console.log('待确认...');
                        // 在待确认状态时直接保存用户信息
                        if (result.nickname && result.avatarUrl) {
                            const userInfo = {
                                nickname: result.nickname,
                                avatarUrl: result.avatarUrl,
                                vipType: 0 // 默认值，后续可以从用户详情接口获取
                            };
                            
                            // 直接保存用户信息（不保存cookie，因为还没有完成登录）
                            this.userInfo = userInfo;
                            console.log('✅ 待确认状态，用户信息已保存:', userInfo);
                        }
                        break;
                        
                    case 803: // 授权登录成功
                        clearInterval(timer);
                        console.log('登录成功');
                        
                        // 保存cookie，完成登录流程
                        if (result.cookie) {
                            this.token = result.cookie;
                            
                            // 如果之前已经有用户信息（从802状态获取），直接保存完整登录信息
                            if (this.userInfo) {
                                this.saveLoginInfo(result.cookie, this.userInfo);
                                console.log('✅ 登录完成，使用已保存的用户信息:', this.userInfo);
                            } 
                            // 如果没有用户信息，尝试从当前返回结果中获取
                            else if (result.nickname && result.avatarUrl) {
                                const userInfo = {
                                    nickname: result.nickname,
                                    avatarUrl: result.avatarUrl,
                                    vipType: 0
                                };
                                this.saveLoginInfo(result.cookie, userInfo);
                                console.log('✅ 登录完成，从803状态获取用户信息:', userInfo);
                            } 
                            // 备用方案：通过API获取用户详情
                            else {
                                try {
                                    const userDetail = await this.getUserDetail();
                                    if (userDetail && userDetail.profile) {
                                        this.saveLoginInfo(result.cookie, userDetail.profile);
                                        console.log('✅ 登录完成，通过API获取用户信息:', userDetail.profile);
                                    } else {
                                        const defaultUserInfo = {
                                            nickname: '网易云用户',
                                            avatarUrl: '../../../src/assets/images/cd.png',
                                            vipType: 0
                                        };
                                        this.saveLoginInfo(result.cookie, defaultUserInfo);
                                        console.log('✅ 登录完成，使用默认用户信息');
                                    }
                                } catch (error) {
                                    console.error('获取用户详情失败:', error);
                                    const defaultUserInfo = {
                                        nickname: '网易云用户',
                                        avatarUrl: '../../../src/assets/images/cd.png',
                                        vipType: 0
                                    };
                                    this.saveLoginInfo(result.cookie, defaultUserInfo);
                                }
                            }
                        }
                        break;
                        
                    default:
                        console.log('未知状态码:', code);
                }
            } catch (error) {
                console.error('轮询二维码状态失败:', error);
                clearInterval(timer);
            }
        }, 3000); // 每3秒轮询一次
        
        return timer;
    }

    /**
     * 获取音乐URL
     * @param {number} id - 网易云歌曲ID
     * @return {Promise<string>} - 返回歌曲URL
     */
    async getMusicUrl(id) {
        try {
            const headers = {};
            if (this.token) {
                headers['Cookie'] = this.token;
            }
            
            const response = await fetch(`${this.baseUrl}/song/url/v1?id=${id}&level=standard`, { headers });
            if (!response.ok) {
                throw new Error(`获取音乐URL失败: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.data && data.data[0] && data.data[0].url) {
                return data.data[0].url;
            } else {
                throw new Error('获取音乐URL结构异常');
            }
        } catch (error) {
            console.error('获取音乐URL时出错:', error);
            return null;
        }
    }

    /**
     * 获取歌曲详情
     * @param {number} id - 网易云歌曲ID
     * @return {Promise<Object>} - 返回歌曲详情
     */
    async getSongDetail(id) {
        try {
            const headers = {};
            if (this.token) {
                headers['Cookie'] = this.token;
            }
            
            const response = await fetch(`${this.baseUrl}/song/detail?ids=${id}`, { headers });
            if (!response.ok) {
                throw new Error(`获取歌曲详情失败: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.songs && data.songs.length > 0) {
                const song = data.songs[0];
                return {
                    title: song.name,
                    artist: song.ar.map(artist => artist.name).join(', '),
                    album: song.al.name,
                    cover: song.al.picUrl,
                    duration: song.dt / 1000 // 转换为秒
                };
            } else {
                throw new Error('获取歌曲详情结构异常');
            }
        } catch (error) {
            console.error('获取歌曲详情时出错:', error);
            return null;
        }
    }

    /**
     * 获取歌词
     * @param {number} id - 网易云歌曲ID
     * @return {Promise<Array>} - 返回歌词数组
     */
    async getLyric(id) {
        try {
            const headers = {};
            if (this.token) {
                headers['Cookie'] = this.token;
            }
            
            const response = await fetch(`${this.baseUrl}/lyric?id=${id}`, { headers });
            if (!response.ok) {
                throw new Error(`获取歌词失败: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.lrc && data.lrc.lyric) {
                return this.parseLyric(data.lrc.lyric);
            } else {
                return [];
            }
        } catch (error) {
            console.error('获取歌词时出错:', error);
            return [];
        }
    }

    /**
     * 解析歌词文本为歌词数组
     * @param {string} lyricText - 歌词文本
     * @return {Array} - 返回处理后的歌词数组 [{time: 秒, text: '歌词文本'}, ...]
     */
    parseLyric(lyricText) {
        if (!lyricText) return [];
        
        const lines = lyricText.split('\n');
        const result = [];
        const pattern = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/; // 匹配[00:00.000]格式的时间戳
        
        for (let line of lines) {
            const match = pattern.exec(line);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3]);
                const time = minutes * 60 + seconds + milliseconds / 1000;
                const text = line.replace(pattern, '').trim();
                
                if (text) {
                    result.push({ time, text });
                }
            }
        }
        
        return result;
    }

    /**
     * 搜索歌曲
     * @param {string} keyword - 搜索关键词
     * @param {number} limit - 限制结果数量
     * @return {Promise<Array>} - 返回搜索结果数组
     */
    async searchSongs(keyword, limit = 10) {
        try {
            const headers = {};
            if (this.token) {
                headers['Cookie'] = this.token;
            }
            
            const response = await fetch(`${this.baseUrl}/search?keywords=${encodeURIComponent(keyword)}&limit=${limit}`, { headers });
            if (!response.ok) {
                throw new Error(`搜索歌曲失败: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.result && data.result.songs) {
                return data.result.songs.map(song => ({
                    id: song.id,
                    title: song.name,
                    artist: song.artists.map(artist => artist.name).join(', '),
                    album: song.album.name
                }));
            } else {
                return [];
            }
        } catch (error) {
            console.error('搜索歌曲时出错:', error);
            return [];
        }
    }
    
    /**
     * 获取完整的歌曲信息（整合歌曲详情、URL和歌词）
     * @param {number} id - 网易云歌曲ID
     * @return {Promise<Object>} - 返回完整的歌曲信息
     */
    async getFullSongInfo(id) {
        try {
            const [songDetail, audioUrl, lyrics] = await Promise.all([
                this.getSongDetail(id),
                this.getMusicUrl(id),
                this.getLyric(id)
            ]);
            
            if (songDetail && audioUrl) {
                return {
                    ...songDetail,
                    audioSrc: audioUrl,
                    lyrics: lyrics,
                    id: id
                };
            } else {
                throw new Error('获取歌曲信息不完整');
            }
        } catch (error) {
            console.error('获取完整歌曲信息时出错:', error);
            return null;
        }
    }

    /**
     * 通过昵称获取用户ID
     * @param {string} nickname - 用户昵称
     * @return {Promise<number|null>} - 返回用户ID
     */
    async getUserIdByNickname(nickname) {
        try {
            const timestamp = Date.now();
            const headers = {};
            if (this.token) {
                headers['Cookie'] = this.token;
            }
            
            const response = await fetch(`${this.baseUrl}/get/userids?nicknames=${encodeURIComponent(nickname)}&timestamp=${timestamp}`, { headers });
            
            if (!response.ok) {
                throw new Error(`获取用户ID失败: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('用户ID查询结果:', data);
            
            // 检查返回数据结构：{nicknames: {用户昵称: 用户ID}}
            if (data && data.nicknames && data.nicknames[nickname]) {
                const userId = data.nicknames[nickname];
                console.log(`✅ 获取用户ID成功: ${nickname} -> ${userId}`);
                return userId;
            } else {
                console.warn('未找到用户ID，返回数据结构:', data);
                return null;
            }
        } catch (error) {
            console.error('获取用户ID时出错:', error);
            return null;
        }
    }

    /**
     * 获取用户喜欢的音乐列表
     * @param {number} uid - 用户ID
     * @return {Promise<Array>} - 返回喜欢的音乐ID列表
     */
    async getUserLikedMusic(uid) {
        try {
            const timestamp = Date.now();
            const headers = {};
            if (this.token) {
                headers['Cookie'] = this.token;
            }
            console.log("=======", uid);
            const response = await fetch(`${this.baseUrl}/likelist?uid=${uid}&timestamp=${timestamp}`, { headers });
            
            if (!response.ok) {
                throw new Error(`获取喜欢音乐失败: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('喜欢音乐查询结果:', data);
            
            // 返回音乐ID数组
            if (data && data.ids && Array.isArray(data.ids)) {
                console.log(`✅ 获取用户喜欢音乐成功，共 ${data.ids.length} 首`);
                return data.ids;
            } else {
                console.warn('喜欢音乐数据格式异常');
                return [];
            }
        } catch (error) {
            console.error('获取用户喜欢音乐时出错:', error);
            return [];
        }
    }

    /**
     * 批量获取歌曲详情
     * @param {Array<number>} songIds - 歌曲ID数组
     * @param {number} limit - 限制获取数量
     * @return {Promise<Array>} - 返回歌曲详情数组
     */
    async getBatchSongDetails(songIds, limit = 20) {
        try {
            if (!songIds || songIds.length === 0) {
                return [];
            }
            
            // 限制获取数量，避免一次性获取太多
            const limitedIds = songIds.slice(0, limit);
            console.log(`正在获取 ${limitedIds.length} 首歌曲详情...`);
            
            // 并发获取歌曲信息，但限制并发数量
            const batchSize = 5; // 每批5首歌
            const results = [];
            
            for (let i = 0; i < limitedIds.length; i += batchSize) {
                const batch = limitedIds.slice(i, i + batchSize);
                const batchPromises = batch.map(id => this.getFullSongInfo(id));
                const batchResults = await Promise.all(batchPromises);
                
                // 过滤掉获取失败的歌曲
                const validResults = batchResults.filter(song => song !== null);
                results.push(...validResults);
                
                console.log(`批次 ${Math.floor(i/batchSize) + 1} 完成，获取到 ${validResults.length} 首有效歌曲`);
                
                // 添加小延迟，避免请求过于频繁
                if (i + batchSize < limitedIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            console.log(`✅ 批量获取歌曲详情完成，共 ${results.length} 首`);
            return results;
            
        } catch (error) {
            console.error('批量获取歌曲详情失败:', error);
            return [];
        }
    }

    /**
     * 获取用户喜欢的音乐并转换为完整歌曲信息
     * @param {string} nickname - 用户昵称
     * @param {number} limit - 限制获取数量（默认20首）
     * @return {Promise<Array>} - 返回完整的歌曲信息数组
     */
    async getUserLikedSongs(nickname, limit = 20) {
        try {
            console.log(`正在获取用户 ${nickname} 的喜欢音乐...`);
            
            // 1. 通过昵称获取用户ID
            const userId = await this.getUserIdByNickname(nickname);
            if (!userId) {
                console.warn('无法获取用户ID，跳过喜欢音乐获取');
                return [];
            }
            
            // 2. 获取用户喜欢的音乐ID列表
            const likedMusicIds = await this.getUserLikedMusic(userId);
            if (likedMusicIds.length === 0) {
                console.warn('用户没有喜欢的音乐');
                return [];
            }
            
            // 3. 批量获取歌曲详情
            const likedSongs = await this.getBatchSongDetails(likedMusicIds, limit);
            
            console.log(`✅ 用户 ${nickname} 喜欢音乐获取完成，共 ${likedSongs.length} 首`);
            return likedSongs;
            
        } catch (error) {
            console.error('获取用户喜欢音乐失败:', error);
            return [];
        }
    }

    /**
     * 获取用户歌单列表
     * @param {number} uid - 用户ID
     * @return {Promise<Array>} - 返回用户歌单列表
     */
    async getUserPlaylists(uid) {
        try {
            const timestamp = Date.now();
            const headers = {};
            if (this.token) {
                headers['Cookie'] = this.token;
            }
            
            const response = await fetch(`${this.baseUrl}/user/playlist?uid=${uid}&timestamp=${timestamp}`, { headers });
            
            if (!response.ok) {
                throw new Error(`获取用户歌单失败: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('用户歌单查询结果:', data);
            
            // 返回歌单数组
            if (data && data.playlist && Array.isArray(data.playlist)) {
                console.log(`✅ 获取用户歌单成功，共 ${data.playlist.length} 个歌单`);
                return data.playlist;
            } else {
                console.warn('用户歌单数据格式异常');
                return [];
            }
        } catch (error) {
            console.error('获取用户歌单时出错:', error);
            return [];
        }
    }

    /**
     * 获取歌单详情和歌曲列表
     * @param {number} playlistId - 歌单ID
     * @return {Promise<Array>} - 返回歌单中的歌曲ID列表
     */
    async getPlaylistTracks(playlistId) {
        try {
            const timestamp = Date.now();
            const headers = {};
            if (this.token) {
                headers['Cookie'] = this.token;
            }
            
            const response = await fetch(`${this.baseUrl}/playlist/detail?id=${playlistId}&timestamp=${timestamp}`, { headers });
            
            if (!response.ok) {
                throw new Error(`获取歌单详情失败: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('歌单详情查询结果:', data);
            
            // 提取歌曲ID列表
            if (data && data.playlist && data.playlist.trackIds && Array.isArray(data.playlist.trackIds)) {
                const trackIds = data.playlist.trackIds.map(track => track.id);
                console.log(`✅ 获取歌单歌曲成功，共 ${trackIds.length} 首`);
                return trackIds;
            } else {
                console.warn('歌单详情数据格式异常');
                return [];
            }
        } catch (error) {
            console.error('获取歌单详情时出错:', error);
            return [];
        }
    }

    /**
     * 获取用户"我喜欢的音乐"歌单并转换为完整歌曲信息
     * @param {string} nickname - 用户昵称
     * @param {number} limit - 限制获取数量（默认20首）
     * @return {Promise<Array>} - 返回完整的歌曲信息数组
     */
    async getUserFavoritePlaylist(nickname, limit = 20) {
        try {
            console.log(`正在获取用户 ${nickname} 的"我喜欢的音乐"歌单...`);
            
            // 1. 通过昵称获取用户ID
            const userId = await this.getUserIdByNickname(nickname);
            if (!userId) {
                console.warn('无法获取用户ID，跳过我喜欢的音乐获取');
                return [];
            }
            
            // 2. 获取用户所有歌单
            const playlists = await this.getUserPlaylists(userId);
            if (playlists.length === 0) {
                console.warn('用户没有歌单');
                return [];
            }
            
            // 3. 查找"我喜欢的音乐"歌单
            const favoritePlaylist = playlists.find(playlist => 
                playlist.name === "我喜欢的音乐" || playlist.specialType === 5
            );
            
            if (!favoritePlaylist) {
                console.warn('未找到"我喜欢的音乐"歌单');
                return [];
            }
            
            console.log(`✅ 找到"我喜欢的音乐"歌单，ID: ${favoritePlaylist.id}，歌曲数: ${favoritePlaylist.trackCount}`);
            
            // 4. 获取歌单中的歌曲ID列表
            const trackIds = await this.getPlaylistTracks(favoritePlaylist.id);
            if (trackIds.length === 0) {
                console.warn('"我喜欢的音乐"歌单为空');
                return [];
            }
            
            // 5. 批量获取歌曲详情
            const favoriteSongs = await this.getBatchSongDetails(trackIds, limit);
            
            console.log(`✅ 用户 ${nickname} "我喜欢的音乐"获取完成，共 ${favoriteSongs.length} 首`);
            return favoriteSongs;
            
        } catch (error) {
            console.error('获取用户"我喜欢的音乐"失败:', error);
            return [];
        }
    }
}

export const neteaseApi = new NeteaseApiService();
