from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from models import ResearchProject


class ResearchProjectSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ResearchProject
        include_relationships = True
        load_instance = True
