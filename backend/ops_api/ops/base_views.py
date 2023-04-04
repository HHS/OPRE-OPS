from flask import Response, current_app, jsonify, make_response
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from models.base import BaseModel
from ops_api.ops.utils.auth import auth_gateway
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError


def generate_validator(model: BaseModel) -> BaseModel.Validator:
    try:
        return model.Validator()
    except AttributeError:
        return None


class OPSMethodView(MethodView):
    init_every_request = False

    def __init__(self, model: BaseModel):
        self.model = model
        self.validator = generate_validator(model)
        self.auth_gateway = auth_gateway

    def _get_item_by_oidc(self, oidc: str):
        current_app.logger.info(f"get User by_oidc: {id}")
        stmt = select(self.model).where(self.model.oidc_id == oidc).order_by(self.model.id)
        return current_app.db_session.scalar(stmt)

    def _get_item(self, id: int) -> BaseModel:
        stmt = select(self.model).where(self.model.id == id).order_by(self.model.id)
        return current_app.db_session.scalar(stmt)

    def _get_all_items(self) -> list[BaseModel]:
        stmt = select(self.model).order_by(self.model.id)
        # row objects containing 1 model instance each, need to unpack.
        return [row[0] for row in current_app.db_session.execute(stmt).all()]

    def _get_item_by_oidc_with_try(self, oidc: str):
        try:
            item = self._get_item_by_oidc(oidc)

            if item:
                response = jsonify(item.to_dict())
            else:
                response = jsonify({}), 404
        except SQLAlchemyError as se:
            current_app.logger.error(se)
            response = jsonify({}), 500

        response.headers.add("Access-Control-Allow-Origin", "*")
        return response

    def _get_item_with_try(self, id: int) -> Response:
        try:
            item = self._get_item(id)

            if item:
                # response = jsonify(item.to_dict()), 200
                response = make_response(item.to_dict(), 200)
            else:
                # response = jsonify({}), 404
                response = make_response({}, 404)
        except SQLAlchemyError as se:
            current_app.logger.error(se)
            response = make_response({}, 500)
            # response = jsonify({}), 500

        response.headers.add("Access-Control-Allow-Origin", "*")
        return response

    def _get_all_items_with_try(self) -> Response:
        try:
            item_list = self._get_all_items()

            if item_list:
                response = make_response([item.to_dict() for item in item_list], 200)
                # response = jsonify([item.to_dict() for item in item_list]), 200
            else:
                response = make_response({}, 404)
                # response = jsonify({}), 404
        except SQLAlchemyError as se:
            current_app.logger.error(se)
            # response = jsonify({}), 500
            response = make_response({}, 500)

        response.headers.add("Access-Control-Allow-Origin", "*")
        return response


class BaseItemAPI(OPSMethodView):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @jwt_required()
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class BaseListAPI(OPSMethodView):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @jwt_required()
    def get(self) -> Response:
        return self._get_all_items_with_try()

    @jwt_required()
    def post(self) -> Response:
        ...
