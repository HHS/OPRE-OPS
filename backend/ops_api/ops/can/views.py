from flask import jsonify
from flask import Response
from ops.can.models import BudgetLineItem
from ops.can.models import CAN
from ops.can.models import CANFiscalYear
from sqlalchemy.exc import NoResultFound


def get_all_cans() -> Response:
    cans = CAN.query.all()
    response = jsonify([can.to_dict() for can in cans])
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


def load_can(pk: int) -> Response:
    can = CAN.query.filter(CAN.id == pk).one()
    response = jsonify(can.to_dict(nested=True))
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


def get_portfolio_cans(pk: int) -> Response:
    cans = CAN.query.filter(CAN.managing_portfolio_id == pk).all()
    response = jsonify([can.to_dict() for can in cans])
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


def all_can_fiscal_years() -> Response:
    canFiscalYears = CANFiscalYear.query.all()
    response = jsonify([cfy.to_dict() for cfy in canFiscalYears])
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


def get_can_fiscal_year(can_id: int, year: int) -> Response:
    try:
        canFiscalYear = CANFiscalYear.query.filter(
            CANFiscalYear.can_id == can_id, CANFiscalYear.fiscal_year == year
        ).one()

        response = jsonify(canFiscalYear.to_dict())
        response.headers.add("Access-Control-Allow-Origin", "*")
    except NoResultFound:
        response = {}

    return response


def all_budget_line_items() -> Response:
    budget_line_items = BudgetLineItem.query.all()
    response = jsonify([bli.to_dict(nested=True) for bli in budget_line_items])
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


def get_budget_line_items_by_can_and_fiscal_year(
    can_id: int, fiscal_year: int
) -> Response:
    budget_line_items = BudgetLineItem.query.filter(
        BudgetLineItem.can_id == can_id, BudgetLineItem.fiscal_year == fiscal_year
    ).all()
    response = jsonify([bli.to_dict(nested=True) for bli in budget_line_items])
    response.headers.add("Access-Control-Allow-Origin", "*")

    return response
