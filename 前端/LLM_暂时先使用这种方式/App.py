from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# 替换为实际的大模型API URL
MODEL_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
# 替换为您的实际API Key
API_KEY = "sk-d312c095790e4674998b1975c2ed5940"

@app.route('/api/model', methods=['POST', 'OPTIONS'])
def model_api():
    if request.method == 'OPTIONS':
        # 处理 OPTIONS 请求，返回 CORS 头信息
        return jsonify({}), 200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }

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
            # print("Response text:", response.text)  # 打印原始响应内容

            if response.status_code == 200:
                try:
                    response_data = response.json()
                    # print("Response data:", response_data)
                    return jsonify(response_data), 200, {
                        'Access-Control-Allow-Origin': '*'
                    }
                except ValueError as e:
                    print("Error parsing JSON:", e)
                    return jsonify({'error': 'Invalid JSON response from model API'}), 500, {
                        'Access-Control-Allow-Origin': '*'
                    }
            else:
                # 如果大模型API调用失败，返回错误信息
                error_message = f"Model API returned status code {response.status_code}: {response.text}"
                print("Error:", error_message)
                return jsonify({'error': error_message}), response.status_code, {
                    'Access-Control-Allow-Origin': '*'
                }
        except requests.RequestException as e:
            print("Request error:", e)
            return jsonify({'error': 'Network error when calling model API'}), 500, {
                'Access-Control-Allow-Origin': '*'
            }

    # 如果是 GET 请求，返回提示信息
    return jsonify({'message': 'This endpoint supports POST requests only.'}), 200, {
        'Access-Control-Allow-Origin': '*'
    }

if __name__ == '__main__':
    app.run(debug=True, host='10.130.87.194', port=5000)