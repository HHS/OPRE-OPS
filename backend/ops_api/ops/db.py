from flask_sqlalchemy import SQLAlchemy
from models.base import BaseModel

db = SQLAlchemy(model_class=BaseModel)
