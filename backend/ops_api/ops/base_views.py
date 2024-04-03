from contextlib import suppress
from enum import Enum
from functools import wraps
from typing import Optional

from flask import Response, current_app, jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from marshmallow import EXCLUDE, Schema, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import PendingRollbackError
from typing_extensions import override

from models.base import BaseModel
from ops_api.ops.utils.auth import auth_gateway
from ops_api.ops.utils.authentication_gateway import NotActiveUserError
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers


def generate_validator(model: BaseModel) -> BaseModel.Validator:
    try:
        return model.Validator()
    except AttributeError:
        return None


def handle_api_error(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except (KeyError, RuntimeError, PendingRollbackError) as er:
            current_app.logger.error(er)
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            current_app.logger.error(ve)
            return make_response_with_headers(ve.normalized_messages(), 400)
        except NotActiveUserError as e:
            current_app.logger.error(e)
            return make_response_with_headers({}, 403)
        except Exception as e:
            current_app.logger.exception(e)
            return make_response_with_headers({}, 500)

    return decorated


class OPSMethodView(MethodView):
    init_every_request = False

    def __init__(self, model: BaseModel):
        self.model = model
        self.validator = generate_validator(model)
        self.auth_gateway = auth_gateway

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

    @override
    @jwt_required()
    @error_simulator
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class BaseListAPI(OPSMethodView):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @jwt_required()
    @error_simulator
    @handle_api_error
    def get(self) -> Response:
        return self._get_all_items_with_try()

    @override
    @jwt_required()
    @error_simulator
    @handle_api_error
    def post(self) -> Response:
        raise NotImplementedError


class EnumListAPI(MethodView):
    enum: Enum

    def __init_subclass__(self, enum: Enum, **kwargs):
        self.enum = enum
        super().__init_subclass__(**kwargs)

    def __init__(self, enum: Enum, **kwargs):
        super().__init__(**kwargs)

    @override
    @jwt_required()
    @error_simulator
    @handle_api_error
    def get(self) -> Response:
        enum_items = {e.name: e.value for e in self.enum}  # type: ignore [attr-defined]
        return jsonify(enum_items)
