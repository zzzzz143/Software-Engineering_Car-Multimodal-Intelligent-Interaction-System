from flask import Blueprint, jsonify
from ..config import Config

map_bp = Blueprint('map', __name__)

# 高德地图配置路由
@map_bp.route('/api/driver/amapConfig', methods=['GET'])
def get_amap_config():
    return jsonify({
        'api_key': Config.AMAP_API_KEY,
        'security_code': Config.AMAP_SECURITY_CODE
    })