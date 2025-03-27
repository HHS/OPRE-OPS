from contextlib import suppress
from dataclasses import dataclass
from typing import Any, Optional

from flask import Response, current_app, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import object_session

from marshmallow import EXCLUDE, Schema
from models import (
    CAN,
    Agreement,
    AgreementReason,
    AgreementType,
    BaseModel,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractType,
    DirectAgreement,
    GrantAgreement,
    IaaAaAgreement,
    IaaAgreement,
    OpsEventType,
    ServiceRequirementType,
    User,
    Vendor,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, OPSMethodView
from ops_api.ops.resources.agreements_constants import (
    AGREEMENT_RESPONSE_SCHEMAS,
    AGREEMENT_TYPE_TO_CLASS_MAPPING,
    AGREEMENTS_REQUEST_SCHEMAS,
    ENDPOINT_STRING,
)
from ops_api.ops.schemas.agreements import AgreementRequestSchema
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

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        item = self._get_item(id)

        if item:
            schema = AGREEMENT_RESPONSE_SCHEMAS.get(item.agreement_type)
            serialized_agreement = schema.dump(item)
            response = make_response_with_headers(serialized_agreement)
        else:
            response = make_response_with_headers({}, 404)

        return response

    @is_authorized(PermissionType.PUT, Permission.AGREEMENT)
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

    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
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

    @is_authorized(
        PermissionType.DELETE,
        Permission.AGREEMENT,
        extra_check=associated_with_agreement,
    )
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

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            IaaAaAgreement,
            DirectAgreement,
        ]
        result = []
        request_schema = AgreementRequestSchema()
        data = request_schema.load(request.args.to_dict(flat=False))

        # Use validated parameters to filter agreements
        fiscal_years = data.get("fiscal_year", [])
        budget_line_statuses = data.get("budget_line_status", [])
        portfolios = data.get("portfolio", [])
        # logger.debug(f"Query parameters: {fiscal_years}, {budget_line_statuses}, {portfolios}" )

        logger.debug("Beginning agreement queries")
        for agreement_cls in agreement_classes:
            query = select(agreement_cls).join(BudgetLineItem).join(CAN).distinct()
            if fiscal_years:
                query = query.where(BudgetLineItem.fiscal_year.in_(fiscal_years))
            if budget_line_statuses:
                query = query.where(BudgetLineItem.status.in_(budget_line_statuses))
            if portfolios:
                query = query.where(CAN.portfolio_id.in_(portfolios))

            logger.debug(query)
            result.extend(current_app.db_session.execute(query).all())
        logger.debug("Agreement queries complete")

        logger.debug("Serializing results")
        # Group agreements by type to use batch serialization
        agreements_by_type = {}
        for item in result:
            for agreement in item:
                agreement_type = agreement.agreement_type
                if agreement_type not in agreements_by_type:
                    agreements_by_type[agreement_type] = []
                agreements_by_type[agreement_type].append(agreement)

        agreement_response = []
        # Serialize all agreements of the same type at once
        for agreement_type, agreements in agreements_by_type.items():
            schema = AGREEMENT_RESPONSE_SCHEMAS.get(agreement_type)
            # Use many=True for batch serialization
            serialized_agreements = schema.dump(agreements, many=True)
            agreement_response.extend(serialized_agreements)

        logger.debug("Serialization complete")

        return make_response_with_headers(agreement_response)

    @is_authorized(PermissionType.POST, Permission.AGREEMENT)
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.CREATE_NEW_AGREEMENT) as meta:
            if "agreement_type" not in request.json:
                raise RuntimeError(f"{message_prefix}: Params failed validation")

            try:
                agreement_type = AgreementType[request.json["agreement_type"]]
            except KeyError as err:
                raise ValueError("Invalid agreement_type") from err

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
            add_update_vendor(data, "vendor")

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
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        reasons = [item.name for item in AgreementReason]
        return make_response_with_headers(reasons)


class AgreementTypeListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
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

            case "awarding_entity_id":
                if any(
                    [bli.status.value >= BudgetLineItemStatus.IN_EXECUTION.value for bli in agreement.budget_line_items]
                ):
                    raise ValueError(
                        "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."
                    )
                elif getattr(agreement, item) != data[item]:
                    setattr(agreement, item, data[item])
                    # Flush the session to update the procurement_shop relationship
                    session = object_session(agreement)
                    session.flush()
                    # Refresh the agreement object to update the procurement_shop relationship
                    session.refresh(agreement)
                    for bli in agreement.budget_line_items:
                        if bli.status.value <= BudgetLineItemStatus.PLANNED.value:
                            bli.proc_shop_fee_percentage = (
                                agreement.procurement_shop.fee if agreement.procurement_shop else None
                            )
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
            case "vendor":
                if isinstance(data[item], str):
                    add_update_vendor(data, "vendor", agreement)
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


def add_update_vendor(data: dict, field_name: str = "vendor", agreement: Agreement = None) -> None:
    vendor = data.get(field_name)
    if vendor:
        vendor_obj = current_app.db_session.scalar(select(Vendor).where(Vendor.name.ilike(vendor)))
        if not vendor_obj:
            new_vendor = Vendor(name=vendor, duns=vendor)
            current_app.db_session.add(new_vendor)
            current_app.db_session.commit()
            if agreement is not None:
                setattr(agreement, f"{field_name}_id", new_vendor.id)
            else:
                data[f"{field_name}_id"] = new_vendor.id
        else:
            if agreement is not None:
                setattr(agreement, f"{field_name}_id", vendor_obj.id)
            else:
                data[f"{field_name}_id"] = vendor_obj.id
        if agreement is None:
            del data[field_name]


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
