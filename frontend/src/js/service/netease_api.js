/**
 * 网易云音乐API服务
 * 封装网易云音乐API调用，用于获取音乐资源
 */
class NeteaseApiService {
    constructor() {
        // 网易云API baseURL
        this.baseUrl = 'http://localhost:3001';
    }

    /**
     * 获取音乐URL
     * @param {number} id - 网易云歌曲ID
     * @return {Promise<string>} - 返回歌曲URL
     */
    async getMusicUrl(id) {
        try {
            const response = await fetch(`${this.baseUrl}/song/url/v1?id=${id}&level=standard`);
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
            const response = await fetch(`${this.baseUrl}/song/detail?ids=${id}`);
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
            const response = await fetch(`${this.baseUrl}/lyric?id=${id}`);
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
            const response = await fetch(`${this.baseUrl}/search?keywords=${encodeURIComponent(keyword)}&limit=${limit}`);
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
}

export const neteaseApi = new NeteaseApiService();
