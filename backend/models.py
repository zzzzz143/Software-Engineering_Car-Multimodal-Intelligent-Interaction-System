from .extensions import db
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)  # 用户ID
    username = db.Column(db.String(80), unique=True, nullable=False)  # 用户名
    password_hash = db.Column(db.Text)  # 密码哈希
    role = db.Column(db.String(20), nullable=False, default='driver')  # 用户类型(driver/passenger/maintenance/admin)
    type = db.Column(db.String(10), default='normal')  # 用户权限(normal/privileged)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))  # 注册时间
    status = db.Column(db.String(20), default='online')  # 用户状态(online/offline)
    last_login = db.Column(db.DateTime, default=datetime.now(timezone.utc))  # 最后登录时间
    
    publicUser = db.relationship('PublicUser', backref='user', cascade='all, delete-orphan', uselist=False)

class PublicUser(db.Model):
    __tablename__ = 'publicUsers'
    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)  # 普通用户ID
    email = db.Column(db.String(120), unique=True)  # 邮箱
    home_address = db.Column(db.String(200))  # 家庭地址
    school_address = db.Column(db.String(200))  # 学校地址
    company_address = db.Column(db.String(200))  # 公司地址
    wake_word = db.Column(db.String(50))  # 唤醒词
    
    vehicle = db.relationship('Vehicle', backref='publicUser', cascade='all, delete-orphan', lazy=True)

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    id = db.Column(db.Integer, primary_key=True) # 车辆ID
    user_id = db.Column(db.Integer, db.ForeignKey('publicUsers.id')) # 用户ID
    vehicle_model = db.Column(db.String(50)) # 车型
    license_plate = db.Column(db.String(20), unique=True) # 车牌号码
    vin = db.Column(db.String(17), unique=True) # VIN码