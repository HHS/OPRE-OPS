from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from models import MethodologyType, ResearchProject


class ResearchProjectSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ResearchProject
        include_relationships = True
        load_instance = True

    methodologies = fields.List(fields.Enum(MethodologyType), load_default=[], dump_default=[])
    populations = fields.List(fields.Enum(MethodologyType), load_default=[], dump_default=[])
