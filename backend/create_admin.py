import sys
from app import app, db, User
from werkzeug.security import generate_password_hash
from datetime import datetime, timezone

def create_admin(username, password):
    if User.query.filter_by(role='admin').first():
        print("管理员已存在")
        return
    
    admin = User(
        username=username,
        password_hash=generate_password_hash(password),
        role='admin',
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(admin)
    db.session.commit()
    print(f"管理员 {username} 创建成功")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        create_admin(sys.argv[1], sys.argv[2])