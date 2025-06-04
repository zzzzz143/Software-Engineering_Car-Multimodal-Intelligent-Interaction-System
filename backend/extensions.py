from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()
cors = CORS()

def init_app(app):
    db.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})