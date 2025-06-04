import json
from pathlib import Path
import sys
from ..command_process import process_system_info, process_user_command

# 初始化多模态处理器
multimodal_path = Path(__file__).parent.parent.parent.absolute().joinpath('multimodal')
sys.path.append(str(multimodal_path))
from multimodal import MultimodalProcessor
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
                    if data.get('type') == 'heartbeat':
                        # 心跳处理
                        ws.send(json.dumps({'type':'heartbeat','status':'alive'}))
                        continue
                    elif data.get('type') == 'wake_check':
                        user_id = data.get('user_id')                      
                        # 唤醒词检测处理
                        result = multimodal_processor.process_request(data)
                        print("wake_check响应请求:", result)
                        
                        gesture = result.get('gesture') or '无手势'
                        video = result.get('video') or '视觉数据为空'
                        audio = result.get('audio') or '音频数据为空'
                        is_wake = result.get('is_wake') or False
                        # 只处理手势和视觉识别信息
                        if gesture != '无手势' or video != '视觉数据为空' or audio!= '音频数据为空':
                            print("wake_check响应请求:", result)
                            # 手势和视觉识别处理
                            image_info = f"{gesture},{video}"
                            print("wake_check手势和视觉信息:", image_info)
                            
                            if image_info != '无手势,视觉数据为空':
                                image_info = process_system_info(image_info, user_id)
                            print("wake_check处理后的手势和视觉信息:", image_info)
                            
                            ws.send(json.dumps({
                                'type': 'wake_response',
                                'image': image_info,
                                'is_wake': is_wake
                            }))

                    elif data.get('type') == 'command':
                        user_id = data.get('user_id')
                        # 正常指令处理
                        command = multimodal_processor.process_request(data)
                        print("command响应请求:", command)
                        
                        gesture = command.get('gesture') or '无手势'
                        video = command.get('video') or '视觉数据为空'
                        audio = command.get('audio') or '音频数据为空'
                        # 处理手势、视觉、语音识别信息
                        if gesture != '无手势' or video != '视觉数据为空' or audio!= '音频数据为空':
                            print("command响应请求:", command)
                            # 手势和视觉识别处理
                            image_info = f"{gesture},{video}"
                            print("command手势和视觉信息:", image_info)
                            
                            if image_info != '无手势,视觉数据为空':
                                image_info = process_system_info(image_info, user_id)
                            print("command处理后的手势和视觉信息:", image_info)
                            
                            # 语音识别处理
                            audio_info = audio
                            print("command语音信息:", audio_info)
                            if not audio_info == '音频数据为空':
                                audio_info = process_user_command(audio_info, user_id)
                            print("command处理后的语音信息:", audio_info)
                            
                            processed_command = {
                                'image': image_info,
                                'audio': audio_info
                            }
                            print("command处理后的命令:", processed_command)
                            ws.send(json.dumps({
                                'type': 'command_response', 
                                'command': processed_command
                            }))
                    else:
                        ws.send(json.dumps({'error': '未知响应类型'}))
                except json.JSONDecodeError:
                    ws.send(json.dumps({'error': 'JSON解析错误'}))
                except Exception as e:
                    ws.send(json.dumps({'error': str(e)}))
    except Exception:
        pass
    finally:
        print("WebSocket连接断开!")
    return []