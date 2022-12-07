from flask import jsonify
from flask.views import MethodView
from ops.utils import BaseModel


def generate_validator(model: BaseModel):
    return model.Validator()


class BaseItemAPI(MethodView):
    init_every_request = False

    def __init__(self, model):
        self.model = model
        self.validator = generate_validator(model)

    def _get_item(self, id):
        return self.model.query.filter_by(id=id).first_or_404()

    def get(self, id):
        item = self._get_item(id)
        return jsonify(item.to_dict())


class BaseListAPI(MethodView):
    init_every_request = False

    def __init__(self, model):
        self.model = model
        self.validator = generate_validator(model)

    def get(self):
        items = self.model.query.all()
        return jsonify([item.to_dict() for item in items])
