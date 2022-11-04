from flask import Response, jsonify
from ops.can.models import CAN, CANFiscalYear
from ops.can.utls import can_dumper
from ops.utils import db


def fiscal_year_by_can(can_id: int, fiscal_year: int) -> Response:
    can = db.session.execute(
        db.select(CANFiscalYear.can).where(
            CANFiscalYear.can_id == can_id,
            CANFiscalYear.fiscal_year == fiscal_year,
        )
    ).one()
    return jsonify(can_dumper(can))


def all_cans() -> Response:
    cans = db.session.execute(db.select(CAN)).all()
    return jsonify([can_dumper(can) for can in cans])


def load_can(pk: int) -> Response:
    can = db.session.execute(db.select(CAN).where(CAN.id == pk)).one()
    return jsonify(can_dumper(can))
