from flask import Response, jsonify
from ops.can.models import CAN
from ops.can.utils import can_dumper


def all_cans() -> Response:
    cans = CAN.query.all()
    return jsonify([can_dumper(can) for can in cans])


def load_can(pk: int) -> Response:
    can = CAN.query.filter(CAN.id == pk).one()
    return jsonify(can_dumper(can))
