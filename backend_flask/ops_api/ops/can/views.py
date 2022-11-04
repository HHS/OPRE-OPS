from fask import Response, jsonify
from flask_sqlalchemy import SQLAlchemy
from ops_api.ops.can.models import CAN


def fiscal_year_by_can_list():
    can = db.session.execute(db.select(CAN.eeeeiii))
