from datetime import date
from typing import Any

from flask import current_app
from marshmallow import EXCLUDE, Schema
from sqlalchemy import inspect

from models import BaseModel


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


def validate_and_prepare_change_data(
    request_json, model_instance: BaseModel, schema: Schema, protected=None, partial: bool = False
) -> tuple[dict[str, Any], dict[str, Any]]:
    if protected is None:
        protected = ["id"]
    try:
        old_data = {
            key: value for key, value in vars(model_instance).items() if key in request_json and key not in protected
        }  # only keep the attributes from the request body and omit protected ones
    except AttributeError:
        old_data = {}

    # load and validate the request data
    # schema.load will run the validator and throw a ValidationError if it fails
    loaded_data = schema.load(request_json, unknown=EXCLUDE, partial=partial)
    loaded_data_dict = vars(loaded_data) if not isinstance(loaded_data, dict) else loaded_data

    # build dict of requested changes, omitting protected fields and unchanged fields
    change_data_dict = {
        key: value
        for key, value in loaded_data_dict.items()
        if key not in protected and key in request_json and value != old_data.get(key, None)
    }
    filtered_old_data = {key: value for key, value in old_data.items() if key in change_data_dict}

    return change_data_dict, filtered_old_data


def update_model_instance_data(model_instance: BaseModel, data: dict[str, Any]) -> None:
    for item in data:
        if item in [c_attr.key for c_attr in inspect(model_instance).mapper.column_attrs]:
            setattr(model_instance, item, data[item])


def update_and_commit_model_instance(model_instance: BaseModel, data: dict[str, Any]):
    update_model_instance_data(model_instance, data)
    current_app.db_session.add(model_instance)
    current_app.db_session.commit()
    return model_instance


def convert_date_strings_to_dates(data: dict[str, Any], date_keys: list[str] | None = None) -> dict[str, Any]:
    if not date_keys:
        date_keys = ["period_start", "period_end", "actual_date", "target_date", "date_needed"]
    for k in date_keys:
        if k in data:
            data[k] = date.fromisoformat(data[k]) if data[k] else None
    return data


def get_all_classes(cls: type):
    all_classes = [cls]
    for subclass in cls.__subclasses__():
        all_classes.extend(get_all_classes(subclass))
    return all_classes


def get_all_class_names(cls: type):
    return [cls.__name__ for cls in get_all_classes(cls)]
