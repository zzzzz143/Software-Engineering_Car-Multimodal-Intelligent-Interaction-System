import json
from pathlib import Path
import sys
from ..command_process import process_system_info, process_user_command

multimodal_path = Path(__file__).parent.parent.parent.absolute().joinpath('multimodal')
sys.path.append(str(multimodal_path))
from multimodal import MultimodalProcessor

# 初始化多模态处理器
multimodal_processor = MultimodalProcessor()

def websocket_handler(environ, start_response):
    ws = environ.get('wsgi.websocket')
    if not ws:
        start_response('404 Not Found', [('Content-Type','text/plain')])
        return [b'Not a WebSocket request']

    try:
        while True:
            message = ws.receive()
            if message:
                try:
                    data = json.loads(message)
                    # print("接收到消息:", data)
                    handle_message(ws, data)
                except json.JSONDecodeError:
                    ws.send(json.dumps({'error': 'JSON解析错误'}))
                except Exception as e:
                    ws.send(json.dumps({'error': str(e)}))
    except Exception:
        pass
    finally:
        print("WebSocket连接断开!")
    return []

def handle_message(ws, data):
    """统一消息分发处理"""
    msg_type = data.get('type')
    handler = {
        'heartbeat': handle_heartbeat,
        'command': handle_command
    }.get(msg_type)
    
    handler(ws, data)

def handle_heartbeat(ws, data):
    """心跳处理模块化"""
    ws.send(json.dumps({'type':'heartbeat','status':'alive'}))

def handle_command(ws, data):
    """结果处理模块化"""
    user_id = data.get('user_id')
    is_wake = data.get('is_wake')
    wake_word = data.get('wake_word')
    
    print("后端接收请求")
    # print("后端接收请求:", data)
    result = multimodal_processor.process_request(data, is_wake)
    print("后端处理请求:", result)
    
    if result.get('error'):
        ws.send(json.dumps({'type':'error','message':result['error']}))

    gesture = result.get('gesture') or '无手势'
    video = result.get('video') or '视觉数据为空'
    audio = result.get('audio') or '音频数据为空'
    
    if any([gesture != '无手势', video != '视觉数据为空', audio != '音频数据为空']):
        image_info = f"{gesture or '无手势'},{video or '视觉数据为空'}"
        print("手势和视觉信息:", image_info)
        
        if image_info != '无手势,视觉数据为空':
            image_info = process_system_info(image_info, user_id)
        print("后端处理后的手势和视觉信息:", image_info)
        
        if audio == wake_word:
            audio_info = wake_word
        else:
            audio_info = audio or '音频数据为空'
        print("音频信息:", audio_info)
        
        if audio_info != '音频数据为空' and audio_info != wake_word:
            audio_info = process_user_command(audio_info, user_id)
        print("后端处理后的音频信息:", audio_info)
        
        ws.send(json.dumps({
            'type':'response',
            'image_info': image_info,
            'audio_info': audio_info
        }))