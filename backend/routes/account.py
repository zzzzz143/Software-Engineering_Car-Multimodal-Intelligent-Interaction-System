from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db
from ..utils.decorators import token_required

account_bp = Blueprint('account', __name__)

# 账号信息路由
@account_bp.route('/api/account', methods=['GET', 'PUT'])
@token_required
def account_info(current_user):
    if request.method == 'GET':
        try:
            publicUser = current_user.publicUser
            return jsonify({
                'username': current_user.username,
                'email': publicUser.email if publicUser else '',
                'addresses': {
                    'home_address': publicUser.home_address if publicUser else '',
                    'school_address': publicUser.school_address if publicUser else '',
                    'company_address': publicUser.company_address if publicUser else ''
                },
                'wake_word': publicUser.wake_word if publicUser else 'hey siri'
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    elif request.method == 'PUT':
        try:
            data = request.get_json()
            publicUser = current_user.publicUser
            if 'email' in data:
                publicUser.email = data['email']
            if 'addresses' in data:
                publicUser.home_address = data['addresses'].get('home_address', publicUser.home_address)
                publicUser.school_address = data['addresses'].get('school_address', publicUser.school_address)
                publicUser.company_address = data['addresses'].get('company_address', publicUser.company_address)
            if 'wake_word' in data:
                publicUser.wake_word = data['wake_word']
            
            db.session.commit()
            return jsonify({'message': '账号信息更新成功'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

# 密码修改路由
@account_bp.route('/api/account/password', methods=['PUT'])
@token_required
def change_password(current_user):
    try:
        data = request.get_json()
        old_password = data.get('oldPassword')
        new_password = data.get('newPassword')

        if not check_password_hash(current_user.password_hash, old_password):
            return jsonify({'error': '旧密码错误'}), 400
        current_user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({'message': '密码修改成功'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 登出路由
@account_bp.route('/api/logout', methods=['POST'])
@token_required
def logout(current_user):
    try:
        current_user.status = 'offline'
        db.session.commit()
        return jsonify({'message': '登出成功'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'登出失败: {str(e)}'}), 500