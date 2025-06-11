from flask import Blueprint, request, jsonify, send_file
import os
from ..utils.decorators import token_required
from ..text_to_speech import generate_speech

generate_speech_bp = Blueprint('generate_speech', __name__)

@generate_speech_bp.route('/api/generate_speech', methods=['POST'])
@token_required
def api_generate_speech(current_user):
    try:
        print("后端语音合成")
        data = request.get_json()
        text = data.get('text', '').strip()
        voice_index = data.get('voice_index', 0)
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # 调用火山引擎TTS函数
        audio_data = generate_speech(text, voice_index)
        
        # 构建路径
        base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'generateSpeech')
        
        # 创建目录结构
        os.makedirs(base_dir, exist_ok=True)
        
        # 构建完整文件路径
        filename = f"generate_speech_{current_user.id}.mp3"  # 文件名包含音色索引
        file_path = os.path.join(base_dir, filename)
        
        # 保存文件
        with open(file_path, "wb") as file_to_save:
            file_to_save.write(audio_data)
        
        return send_file(file_path, mimetype='audio/mpeg')
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error: {e}")  # 记录详细错误日志
        return jsonify({'error': f'Failed to generate speech: {str(e)}'}), 500