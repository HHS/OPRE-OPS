from flask import Response, jsonify
from ops.can.models import CAN
from ops.can.utils import can_dumper
from ops.utils import db


def all_cans() -> Response:
    cans = db.session.execute(db.select(CAN)).all()
    return jsonify([can_dumper(can) for can in cans])


def load_can(pk: int) -> Response:
    can = db.session.execute(db.select(CAN).where(CAN.id == pk)).one()
    return jsonify(can_dumper(can))
