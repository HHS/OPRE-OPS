from typing import Any

from flask import current_app
from marshmallow import EXCLUDE, Schema
from models import BaseModel
from sqlalchemy import inspect


def get_change_data(
    request_json, model_instance: BaseModel, schema: Schema, protected=None, partial: bool = False
) -> dict[str, Any]:
    if protected is None:
        protected = ["id"]
    try:
        data = {
            key: value
            for key, value in model_instance.to_dict().items()
            if key in request_json and key not in protected
        }  # only keep the attributes from the request body and omit protected ones
    except AttributeError:
        data = {}
    change_data = schema.dump(schema.load(request_json, unknown=EXCLUDE, partial=partial))
    change_data = {
        key: value
        for key, value in change_data.items()
        if key not in protected and key in request_json and value != data.get(key, None)
    }  # only keep the attributes from the request body and omit protected ones
    data |= change_data
    return data


def update_model_instance_data(model_instance: BaseModel, data: dict[str, Any]) -> None:
    for item in data:
        if item in [c_attr.key for c_attr in inspect(model_instance).mapper.column_attrs]:
            setattr(model_instance, item, data[item])


def update_and_commit_model_instance(model_instance: BaseModel, data: dict[str, Any]):
    update_model_instance_data(model_instance, data)
    current_app.db_session.add(model_instance)
    current_app.db_session.commit()
    return model_instance
