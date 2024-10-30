from marshmallow_enum import EnumField
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from marshmallow import fields
from models import MethodologyType, ResearchProject


class ResearchProjectSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ResearchProject
        include_relationships = True
        load_instance = True

    methodologies = fields.List(EnumField(MethodologyType), default=[])
    populations = fields.List(EnumField(MethodologyType), default=[])
