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
) -> dict[str, Any]:
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

    # build dict of requested changes, omitting protected fields and unchanged fields
    change_data_dict = {
        key: value
        for key, value in vars(loaded_data).items()
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


# should match the FE code in frontend/src/helpers/utils.js
codes_to_display_text = {
    "agreementType": {
        "CONTRACT": "Contract",
        "GRANT": "Grant",
        "DIRECT_ALLOCATION": "Direct Allocation",
        "IAA": "IAA",
        "MISCELLANEOUS": "Misc",
    },
    "agreementReason": {
        "NEW_REQ": "New Requirement",
        "RECOMPETE": "Recompete",
        "LOGICAL_FOLLOW_ON": "Logical Follow On",
    },
    "budgetLineStatus": {"DRAFT": "Draft", "PLANNED": "Planned", "IN_EXECUTION": "Executing", "OBLIGATED": "Obligated"},
    "validation": {
        "name": "Name",
        "type": "Type",
        "description": "Description",
        "psc": "Product Service Code",
        "naics": "NAICS Code",
        "program-support-code": "Program Support Code",
        "procurement-shop": "Procurement Shop",
        "reason": "Reason for creating the agreement",
        "incumbent": "Incumbent",
        "project-officer": "Project Officer",
        "team-member": "Team Members",
        "budget-line-items": "Budget Line Items",
    },
    "classNameLabels": {"ContractAgreement": "Contract Agreement", "BudgetLineItem": "Budget Line"},
    "baseClassNameLabels": {"ContractAgreement": "Agreement", "BudgetLineItem": "Budget Line"},
    "agreementPropertyLabels": {
        "agreement_reason": "Reason for Agreement",
        "agreement_type": "Agreement Type",
        "description": "Agreement Description",
        "incumbent": "Incumbent",
        "name": "Agreement Title",
        "notes": "Agreement Notes",
        "number": "Number",
        "procurement_shop": "Procurement Shop",
        "product_service_code": "Product Service Code",
        "project_officer": "Project Officer",
        "project": "Project",
        "team_members": "Team Members",
        "team_members_item": "Team Member",
        "contract_number": "Contract Number",
        "vendor": "Vendor",
        "delivered_status": "Delivered Status",
        "contract_type": "Contract Type",
        "support_contacts": "Support Contacts",
        "support_contacts_item": "Support Contact",
    },
    "budgetLineItemPropertyLabels": {
        "amount": "Amount",
        "can": "CAN",
        "comments": "Notes",
        "date_needed": "Need By Date",
        "line_description": "Description",
        "proc_shop_fee_percentage": "Shop Fee",
        "status": "Status",
    },
    "contractType": {
        "FIRM_FIXED_PRICE": "Firm Fixed Price (FFP)",
        "TIME_AND_MATERIALS": "Time & Materials (T&M)",
        "LABOR_HOUR": "Labor Hour (LH)",
        "COST_PLUS_FIXED_FEE": "Cost Plus Fixed Fee (CPFF)",
        "COST_PLUS_AWARD_FEE": "Cost Plus Award Fee (CPAF)",
        "HYBRID": "Hybrid (Any combination of the above)",
    },
    "serviceRequirementType": {"SEVERABLE": "Severable", "NON_SEVERABLE": "Non-Severable"},
}


def convert_code_for_display(list_name, code):
    if list_name not in codes_to_display_text:
        raise ValueError("Invalid list name")

    # Retrieve the mapping for the list name
    code_map = codes_to_display_text[list_name]

    # Return the display text for the code, or the original code value if no mapping is found
    return code_map[code] if code in code_map else code


def get_property_label(class_name, field_name):
    if class_name == "BudgetLineItem":
        return convert_code_for_display("budgetLineItemPropertyLabels", field_name)
    return convert_code_for_display("agreementPropertyLabels", field_name)
