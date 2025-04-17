from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS

# 初始化Flask应用
app = Flask(__name__)
# 启用CORS
CORS(app)
# 从.env加载配置
load_dotenv()  
MODEL_API_URL = os.getenv("MODEL_API_URL")
API_KEY = os.getenv("DASHSCOPE_API_KEY")

@app.route('/', methods=['POST', 'OPTIONS'])
def model_api():
    if request.method == 'OPTIONS':
        # 处理 OPTIONS 请求
        return jsonify({}), 200

    # 处理 POST 请求
    if request.method == 'POST':
        print("Received request:", request.get_json())  # 打印接收到的请求数据
        data = request.get_json()
        user_input = data.get('input', '')

        # 准备请求大模型API所需的数据
        payload = {
            "model": "qwen-plus",
            "messages": [
                {
                    "role": "user",
                    "content": user_input
                }
            ]
        }
        headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        }

        try:
            # 发送请求到大模型API
            response = requests.post(MODEL_API_URL, headers=headers, json=payload)

            # 打印响应状态码和数据
            # print("Response status code:", response.status_code)
            print("Response text:", response.text)  # 打印原始响应内容

            if response.status_code == 200:
                try:
                    response_data = response.json()
                    # print("Response data:", response_data)
                    return jsonify(response_data), 200
                except ValueError as e:
                    print("Error parsing JSON:", e)
                    return jsonify({'error': 'Invalid JSON response from model API'}), 500
            else:
                # 如果大模型API调用失败，返回错误信息
                error_message = f"Model API returned status code {response.status_code}: {response.text}"
                print("Error:", error_message)
                return jsonify({'error': error_message}), response.status_code, {
                    'Access-Control-Allow-Origin': '*'
                }
        except requests.RequestException as e:
            print("Request error:", e)
            return jsonify({'error': 'Network error when calling model API'}), 500

    # 如果是 GET 请求，返回提示信息
    return jsonify({'message': 'This endpoint supports POST requests only.'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)