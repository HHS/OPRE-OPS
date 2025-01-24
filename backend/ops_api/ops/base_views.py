from contextlib import suppress
from enum import Enum
from typing import Optional

from flask import Response, current_app, jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from sqlalchemy import select

from marshmallow import EXCLUDE, Schema
from models.base import BaseModel
from ops_api.ops.auth.authorization_providers import AuthorizationGateway, BasicAuthorizationProvider
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers


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
        self.auth_gateway = AuthorizationGateway(BasicAuthorizationProvider())

    def _get_item_by_oidc(self, oidc: str):
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
        item = self._get_item_by_oidc(oidc)

        if item:
            response = make_response_with_headers(item.to_dict())
        else:
            response = make_response_with_headers({}, 404)

        return response

    def _get_item_with_try(self, id: int, additional_fields: dict = None) -> Response:
        item = self._get_item(id)

        if item:
            item_dict = item.to_dict()
            item_dict.update(additional_fields or {})
            response = make_response_with_headers(item_dict)
        else:
            response = make_response_with_headers({}, 404)

        return response

    def _get_all_items_with_try(self) -> Response:
        item_list = self._get_all_items()

        if item_list:
            response = make_response_with_headers([item.to_dict() for item in item_list])
        else:
            response = make_response_with_headers({}, 404)

        return response

    @staticmethod
    def _validate_request(schema: Schema, message: Optional[str] = "", partial=False):
        # schema.load will run the validator and throw a ValidationError if it fails
        schema.load(request.json, unknown=EXCLUDE, partial=partial)

    @staticmethod
    def _get_query(model, search=None, **kwargs):
        stmt = select(model).order_by(model.id)
        query_helper = QueryHelper(stmt)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(getattr(model, "name"), search)

        for key, value in kwargs.items():
            with suppress(AttributeError):
                query_helper.add_column_equals(getattr(model, key), value)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt


class BaseItemAPI(OPSMethodView):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @jwt_required()
    @error_simulator
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class BaseListAPI(OPSMethodView):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        return self._get_all_items_with_try()

    @jwt_required()
    @error_simulator
    def post(self) -> Response:
        raise NotImplementedError


class EnumListAPI(MethodView):
    enum: Enum

    def __init_subclass__(self, enum: Enum, **kwargs):
        self.enum = enum
        super().__init_subclass__(**kwargs)

    def __init__(self, enum: Enum, **kwargs):
        super().__init__(**kwargs)

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        enum_items = {e.name: e.value for e in self.enum}  # type: ignore [attr-defined]
        return jsonify(enum_items)
