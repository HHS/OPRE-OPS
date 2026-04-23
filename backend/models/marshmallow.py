from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from models import Project


class ResearchProjectSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Project
        include_relationships = True
        load_instance = True
