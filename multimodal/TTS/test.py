# 合并到command_process.py文件中
import requests

# 服务的地址
base_url = "http://127.0.0.1:9880"

# 函数接收文本参数，将text的值设置为该文本值，并返回音频信息
def get_tts_with_default_refer(text, text_language="zh"):
    params = {
        "text": text,
        "text_language": text_language
    }
    try:
        response = requests.get(f"{base_url}/tts", params=params, stream=True)
        response.raise_for_status()  # 检查请求是否成功
        with open("output.wav", "wb") as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:  # 过滤掉保持连接的新块
                    f.write(chunk)
        print("音频文件已保存为 output.wav")
    except requests.exceptions.RequestException as e:
        print(f"请求失败：{e}")

# 调用示例
if __name__ == "__main__":
    # 用户提供的文本
    user_text = "这里是用户想要转换为音频的文本内容。"
    # 使用默认参考音频
    get_tts_with_default_refer(user_text)