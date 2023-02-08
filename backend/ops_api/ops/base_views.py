from flask import Response, jsonify
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from models.base import BaseModel


def generate_validator(model: BaseModel) -> BaseModel.Validator:
    return model.Validator()


class BaseItemAPI(MethodView):
    init_every_request = False

    def __init__(self, model: BaseModel):
        self.model = model
        self.validator = generate_validator(model)

    def _get_item(self, id: int) -> BaseModel:
        return self.model.query.filter_by(id=id).first_or_404()

    @jwt_required()
    def get(self, id: int) -> Response:
        item = self._get_item(id)
        return jsonify(item.to_dict())


class BaseListAPI(MethodView):
    init_every_request = False

    def __init__(self, model: BaseModel):
        self.model = model
        self.validator = generate_validator(model)

    @jwt_required()
    def get(self) -> Response:
        items = self.model.query.all()
        return jsonify([item.to_dict() for item in items])
