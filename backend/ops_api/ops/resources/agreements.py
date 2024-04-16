from contextlib import suppress
from dataclasses import dataclass
from typing import List, Optional

from flask import Response, current_app, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity
from marshmallow import EXCLUDE, Schema
from sqlalchemy.future import select
from typing_extensions import Any, override

from models import (
    CAN,
    ContractType,
    DirectAgreement,
    GrantAgreement,
    IaaAaAgreement,
    IaaAgreement,
    OpsEventType,
    User,
    Vendor,
)
from models.base import BaseModel
from models.cans import (
    Agreement,
    AgreementReason,
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ServiceRequirementType,
)
from ops_api.ops.auth.auth import Permission, PermissionType, is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, OPSMethodView, handle_api_error
from ops_api.ops.resources.agreements_constants import (
    AGREEMENT_TYPE_TO_CLASS_MAPPING,
    AGREEMENTS_REQUEST_SCHEMAS,
    ENDPOINT_STRING,
)
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


@dataclass
class QueryParameters:
    search: Optional[str] = None
    research_project_id: Optional[int] = None


def associated_with_agreement(self, id: int) -> bool:
    jwt_identity = get_jwt_identity()
    agreement_stmt = select(Agreement).where(Agreement.id == id)
    agreement = current_app.db_session.scalar(agreement_stmt)

    oidc_ids = set()
    if agreement.created_by_user:
        oidc_ids.add(str(agreement.created_by_user.oidc_id))
    if agreement.project_officer:
        oidc_ids.add(str(agreement.project_officer.oidc_id))
    oidc_ids |= set(str(tm.oidc_id) for tm in agreement.team_members)

    ret = jwt_identity in oidc_ids

    return ret


class AgreementItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @handle_api_error
    def get(self, id: int) -> Response:
        item = self._get_item(id)
        additional_fields = add_additional_fields_to_agreement_response(item)

        return self._get_item_with_try(id, additional_fields=additional_fields)

    @override
    @is_authorized(PermissionType.PUT, Permission.AGREEMENT)
    @handle_api_error
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
            old_agreement: Agreement = self._get_item(id)
            if not old_agreement:
                raise RuntimeError("Invalid Agreement id.")
            elif any(bli.status == BudgetLineItemStatus.IN_EXECUTION for bli in old_agreement.budget_line_items):
                raise RuntimeError(f"Agreement {id} has budget line items in executing status.")

            req_type = reject_change_of_agreement_type(old_agreement)

            schema = AGREEMENTS_REQUEST_SCHEMAS.get(old_agreement.agreement_type)

            OPSMethodView._validate_request(
                schema=schema,
                message=f"{message_prefix}: Params failed validation:",
            )

            data = schema.dump(schema.load(request.json, unknown=EXCLUDE))

            if data.get("contract_type") and req_type == AgreementType.CONTRACT.name:
                data["contract_type"] = ContractType[data["contract_type"]]

            agreement = update_agreement(data, old_agreement)
            agreement_dict = agreement.to_dict()
            meta.metadata.update({"updated_agreement": agreement_dict})
            current_app.logger.info(f"{message_prefix}: Updated Agreement: {agreement_dict}")

            return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, 200)

    @override
    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    @handle_api_error
    def patch(self, id: int) -> Response:
        message_prefix = f"PATCH to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
            old_agreement: Agreement = self._get_item(id)
            if not old_agreement:
                raise RuntimeError(f"Invalid Agreement id: {id}.")
            elif any(bli.status == BudgetLineItemStatus.IN_EXECUTION for bli in old_agreement.budget_line_items):
                raise RuntimeError(f"Agreement {id} has budget line items in executing status.")
            # reject change of agreement_type
            try:
                req_type = request.json.get("agreement_type", old_agreement.agreement_type.name)
                if req_type != old_agreement.agreement_type.name:
                    raise ValueError(f"{req_type} != {old_agreement.agreement_type.name}")
            except (KeyError, ValueError) as e:
                raise RuntimeError("Invalid agreement_type, agreement_type must not change") from e

            schema: Schema = AGREEMENTS_REQUEST_SCHEMAS.get(old_agreement.agreement_type)

            data = get_change_data(old_agreement, schema)

            agreement = update_agreement(data, old_agreement)

            agreement_dict = agreement.to_dict()
            meta.metadata.update({"updated_agreement": agreement_dict})
            current_app.logger.info(f"{message_prefix}: Updated Agreement: {agreement_dict}")

            return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, 200)

    @override
    @is_authorized(
        PermissionType.DELETE,
        Permission.AGREEMENT,
        extra_check=associated_with_agreement,
    )
    @handle_api_error
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_AGREEMENT) as meta:
            agreement: Agreement = self._get_item(id)

            if not agreement:
                raise RuntimeError(f"Invalid Agreement id: {id}.")
            elif agreement.agreement_type != AgreementType.CONTRACT:
                raise RuntimeError(f"Invalid Agreement type: {agreement.agreement_type}.")
            elif any(bli.status != BudgetLineItemStatus.DRAFT for bli in agreement.budget_line_items):
                raise RuntimeError(f"Agreement {id} has budget line items not in draft status.")

            current_app.db_session.delete(agreement)
            current_app.db_session.commit()

            meta.metadata.update({"Deleted Agreement": id})

            return make_response_with_headers({"message": "Agreement deleted", "id": agreement.id}, 200)


class AgreementListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @handle_api_error
    def get(self) -> Response:
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            IaaAaAgreement,
            DirectAgreement,
        ]
        result = []
        for agreement_cls in agreement_classes:
            result.extend(current_app.db_session.execute(self._get_query(agreement_cls, **request.args)).all())

        agreement_response: List[dict] = []
        for item in result:
            for agreement in item:
                additional_fields = add_additional_fields_to_agreement_response(agreement)
                agreement_dict = agreement.to_dict()
                agreement_dict.update(additional_fields)
                agreement_response.append(agreement_dict)

        return make_response_with_headers(agreement_response)

    @override
    @is_authorized(PermissionType.POST, Permission.AGREEMENT)
    @handle_api_error
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.CREATE_NEW_AGREEMENT) as meta:
            if "agreement_type" not in request.json:
                raise RuntimeError(f"{message_prefix}: Params failed validation")

            try:
                agreement_type = AgreementType[request.json["agreement_type"]]
            except KeyError:
                raise ValueError("Invalid agreement_type")

            current_app.logger.info(agreement_type.name)

            schema = AGREEMENTS_REQUEST_SCHEMAS.get(agreement_type)

            data = schema.dump(schema.load(request.json, unknown=EXCLUDE))

            new_agreement = self._create_agreement(data, AGREEMENT_TYPE_TO_CLASS_MAPPING.get(agreement_type))

            current_app.db_session.add(new_agreement)
            current_app.db_session.commit()

            new_agreement_dict = new_agreement.to_dict()
            meta.metadata.update({"New Agreement": new_agreement_dict})
            current_app.logger.info(f"POST to {ENDPOINT_STRING}: New Agreement created: {new_agreement_dict}")

            return make_response_with_headers({"message": "Agreement created", "id": new_agreement.id}, 201)

    def _create_agreement(self, data, agreement_cls):
        data["agreement_type"] = AgreementType[data["agreement_type"]] if data.get("agreement_type") else None
        data["agreement_reason"] = AgreementReason[data["agreement_reason"]] if data.get("agreement_reason") else None

        tmp_team_members = data.get("team_members") or []
        data["team_members"] = []

        if agreement_cls == ContractAgreement:
            data["contract_type"] = ContractType[data["contract_type"]] if data.get("contract_type") else None
            data["service_requirement_type"] = (
                ServiceRequirementType[data["service_requirement_type"]]
                if data.get("service_requirement_type")
                else None
            )

            tmp_support_contacts = data.get("support_contacts") or []
            data["support_contacts"] = []

            # TODO: add_vendor is here temporarily until we have vendor management
            # implemented in the frontend, i.e. the vendor is a drop-down instead
            # of a text field
            add_vendor(data, "incumbent")
            add_vendor(data, "vendor")

        new_agreement = agreement_cls(**data)

        new_agreement.team_members.extend(
            [current_app.db_session.get(User, tm_id.get("id")) for tm_id in tmp_team_members]
        )

        if agreement_cls == ContractAgreement:
            new_agreement.support_contacts.extend(
                [current_app.db_session.get(User, tm_id.get("id")) for tm_id in tmp_support_contacts]
            )

        return new_agreement

    def check_errors(self, errors):
        if errors:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")
            raise RuntimeError(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")


class AgreementReasonListAPI(MethodView):
    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @handle_api_error
    def get(self) -> Response:
        reasons = [item.name for item in AgreementReason]
        return make_response_with_headers(reasons)


class AgreementTypeListAPI(MethodView):
    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @handle_api_error
    def get(self) -> Response:
        return make_response_with_headers([e.name for e in AgreementType])


def _get_user_list(data: Any):
    tmp_ids = []
    if data:
        for item in data:
            try:
                tmp_ids.append(item.id)
            except AttributeError:
                tmp_ids.append(item["id"])
    if tmp_ids:
        return [current_app.db_session.get(User, tm_id) for tm_id in tmp_ids]


def update_data(agreement: Agreement, data: dict[str, Any]) -> None:
    changed = False
    for item in data:
        if item in [
            "vendor",
            "incumbent",
            "agreement_type",
            "versions",
            "created_by_user",  # handled by created_by
            "updated_by_user",  # handled by updated_by
            "project_officer",  # handled by project_officer_id
        ]:
            continue
        # subclass attributes won't have the old (deleted) value in get_history
        # unless they were loaded before setting
        _hack_to_fix_get_history = getattr(agreement, item)  # noqa: F841
        match (item):
            case "team_members":
                tmp_team_members = _get_user_list(data[item])
                agreement.team_members = tmp_team_members if tmp_team_members else []

            case "support_contacts":
                tmp_support_contacts = _get_user_list(data[item])
                agreement.support_contacts = tmp_support_contacts if tmp_support_contacts else []

            case "procurement_shop_id":
                if any(
                    [bli.status.value >= BudgetLineItemStatus.IN_EXECUTION.value for bli in agreement.budget_line_items]
                ):
                    raise ValueError(
                        "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."
                    )
                elif getattr(agreement, item) != data[item]:
                    setattr(agreement, item, data[item])
                    for bli in agreement.budget_line_items:
                        if bli.status.value <= BudgetLineItemStatus.PLANNED.value:
                            bli.proc_shop_fee_percentage = agreement.procurement_shop.fee
                    changed = True

            case "agreement_reason":
                if isinstance(data[item], str):
                    setattr(agreement, item, AgreementReason[data[item]])
                    changed = True

            case "agreement_type":
                if isinstance(data[item], str):
                    setattr(agreement, item, AgreementType[data[item]])
                    changed = True

            case "contract_type":
                if isinstance(data[item], str):
                    setattr(agreement, item, ContractType[data[item]])
                    changed = True

            case "service_requirement_type":
                if isinstance(data[item], str):
                    setattr(agreement, item, ServiceRequirementType[data[item]])
                    changed = True

            case _:
                if getattr(agreement, item) != data[item]:
                    setattr(agreement, item, data[item])
                    changed = True

    if changed:
        for bli in agreement.budget_line_items:
            with suppress(AttributeError):
                if bli.status.value <= BudgetLineItemStatus.PLANNED.value:
                    bli.status = BudgetLineItemStatus.DRAFT


def update_agreement(data: dict[str, Any], agreement: Agreement):
    update_data(agreement, data)

    # TODO: add_vendor is here temporarily until we have vendor management
    # implemented in the frontend, i.e. the vendor is a drop-down instead
    # of a text field
    add_vendor(data, "incumbent")
    add_vendor(data, "vendor")

    current_app.db_session.add(agreement)
    current_app.db_session.commit()
    return agreement


def get_change_data(old_agreement: Agreement, schema: Schema, partial: bool = True) -> dict[str, Any]:
    try:
        data = {
            key: value for key, value in old_agreement.to_dict().items() if key in request.json
        }  # only keep the attributes from the request body
    except AttributeError:
        data = {}
    change_data = schema.dump(schema.load(request.json, unknown=EXCLUDE, partial=partial))
    change_data = {
        key: value
        for key, value in change_data.items()
        if key not in {"status", "id"} and key in request.json and value != data.get(key, None)
    }  # only keep the attributes from the request body
    return change_data


def add_vendor(data: dict, field_name: str = "vendor") -> None:
    vendor = data.get(field_name)
    if vendor:
        vendor_obj = current_app.db_session.scalar(select(Vendor).where(Vendor.name.ilike(vendor)))
        if not vendor_obj:
            new_vendor = Vendor(name=vendor, duns=vendor)
            current_app.db_session.add(new_vendor)
            current_app.db_session.commit()
            data[f"{field_name}_id"] = new_vendor.id
        else:
            data[f"{field_name}_id"] = vendor_obj.id
        del data[field_name]


def add_additional_fields_to_agreement_response(agreement: Agreement) -> dict[str, Any]:
    """
    Add additional fields to the agreement response.

    N.B. This is a temporary solution to add additional fields to the response.
    This should be refactored to use marshmallow.
    Also, the frontend/OpenAPI needs to be refactored to not use these fields.
    """
    if not agreement:
        return {}

    transformed_blis = []
    for bli in agreement.budget_line_items:
        transformed_bli = bli.to_dict()
        if transformed_bli.get("amount"):
            transformed_bli["amount"] = float(transformed_bli.get("amount"))
        # nest the CAN object (temp needed for the frontend)
        if transformed_bli.get("can"):
            transformed_bli["can"] = current_app.db_session.get(CAN, transformed_bli.get("can")).to_dict()
        # include has_active_workflow
        transformed_bli["has_active_workflow"] = bli.has_active_workflow
        # include active_workflow_current_step_id
        transformed_bli["active_workflow_current_step_id"] = bli.active_workflow_current_step_id
        transformed_blis.append(transformed_bli)

    # change PS amount from string to float - this is a temporary solution in lieu of marshmallow
    transformed_ps = agreement.procurement_shop.to_dict() if agreement.procurement_shop else {}
    if transformed_ps:
        transformed_ps["fee"] = float(transformed_ps.get("fee"))

    return {
        "agreement_type": agreement.agreement_type.name if agreement.agreement_type else None,
        "agreement_reason": agreement.agreement_reason.name if agreement.agreement_reason else None,
        "budget_line_items": transformed_blis,
        "team_members": [tm.to_dict() for tm in agreement.team_members],
        "project": agreement.project.to_dict() if agreement.project else None,
        "procurement_shop": transformed_ps,
        "product_service_code": agreement.product_service_code.to_dict() if agreement.product_service_code else None,
        "display_name": agreement.display_name,
        "vendor": agreement.vendor.name if hasattr(agreement, "vendor") and agreement.vendor else None,
        "incumbent": agreement.incumbent.name if hasattr(agreement, "incumbent") and agreement.incumbent else None,
        "procurement_tracker_workflow_id": agreement.procurement_tracker_workflow_id,
    }


def reject_change_of_agreement_type(old_agreement):
    # reject change of agreement_type
    # for PUT, it must exist in request
    try:
        req_type = request.json["agreement_type"]
        if req_type != old_agreement.agreement_type.name:
            raise ValueError(f"{req_type} != {old_agreement.agreement_type.name}")
    except (KeyError, ValueError) as e:
        raise RuntimeError("Invalid agreement_type, agreement_type must not change") from e
    return req_type
