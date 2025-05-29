from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, Optional, Sequence, Type

from flask import Response, current_app, request
from flask.views import MethodView
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session, object_session

from marshmallow import EXCLUDE, Schema
from models import (
    CAN,
    Agreement,
    AgreementReason,
    AgreementSortCondition,
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
    AGREEMENT_ITEM_RESPONSE_SCHEMAS,
    AGREEMENT_LIST_RESPONSE_SCHEMAS,
    AGREEMENT_TYPE_TO_CLASS_MAPPING,
    AGREEMENTS_REQUEST_SCHEMAS,
    ENDPOINT_STRING,
)
from ops_api.ops.schemas.agreements import AgreementRequestSchema, MetaSchema
from ops_api.ops.services.agreements import AgreementsService, associated_with_agreement
from ops_api.ops.services.ops_service import AuthorizationError, OpsService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


@dataclass
class QueryParameters:
    search: Optional[str] = None
    research_project_id: Optional[int] = None


class AgreementItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.GET_AGREEMENT) as event_meta:
            item = self._get_item(id)

            if item:
                schema = AGREEMENT_ITEM_RESPONSE_SCHEMAS.get(item.agreement_type)
                serialized_agreement = schema.dump(item)

                # add Meta data to the response
                meta_schema = MetaSchema()

                data_for_meta = {
                    "isEditable": associated_with_agreement(serialized_agreement.get("id")),
                }
                meta = meta_schema.dump(data_for_meta)
                serialized_agreement["_meta"] = meta

                response = make_response_with_headers(serialized_agreement)
            else:
                response = make_response_with_headers({}, 404)

            event_meta.metadata.update({"agreement_id": id})

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

            if not associated_with_agreement(old_agreement.id):
                raise AuthorizationError(
                    f"User is not associated with the agreement for id: {id}.",
                    "Agreement",
                )

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
            service: OpsService[Agreement] = AgreementsService(current_app.db_session)
            old_agreement: Agreement = service.get(id)

            if not associated_with_agreement(old_agreement.id):
                raise AuthorizationError(
                    f"User is not associated with the agreement for id: {id}.",
                    "Agreement",
                )

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

            if not associated_with_agreement(agreement.id):
                raise AuthorizationError(
                    f"User is not associated with the agreement for id: {id}.",
                    "Agreement",
                )

            current_app.db_session.delete(agreement)
            current_app.db_session.commit()

            meta.metadata.update({"Deleted Agreement": id})

            return make_response_with_headers({"message": "Agreement deleted", "id": agreement.id}, 200)


class AgreementListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        with OpsEventHandler(OpsEventType.GET_AGREEMENT) as event_meta:
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
            only_my = data.get("only_my", [])

            logger.debug("Beginning agreement queries")
            for agreement_cls in agreement_classes:
                agreements = _get_agreements(current_app.db_session, agreement_cls, request_schema, data)
                result.extend(agreements)
            logger.debug("Agreement queries complete")

            sort_conditions = data.get("sort_conditions", [])
            sort_descending = data.get("sort_descending", [])
            if sort_conditions:
                result = _sort_agreements(result, sort_conditions[0], sort_descending[0])
            logger.debug("Serializing results")

            agreement_response = []
            # Serialize all agreements, not in batch because that kills our sort

            for agreement in result:
                schema = AGREEMENT_LIST_RESPONSE_SCHEMAS.get(agreement.agreement_type)

                serialized_agreement = schema.dump(agreement)

                # add Meta data to the response
                meta_schema = MetaSchema()

                data_for_meta = {
                    "isEditable": True if only_my else associated_with_agreement(serialized_agreement.get("id")),
                }
                meta = meta_schema.dump(data_for_meta)
                serialized_agreement["_meta"] = meta

                agreement_response.append(serialized_agreement)

            logger.debug("Serialization complete")

            event_meta.metadata.update({"agreement_ids": [agreement.id for agreement in result]})

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
    for item in data:
        if item in [
            "agreement_type",
            "versions",
            "created_by_user",  # handled by created_by
            "updated_by_user",  # handled by updated_by
            "project_officer",  # handled by project_officer_id
            "alternate_project_officer",  # handled by alternate_project_officer_id
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
                if agreement.awarding_entity_id != data["awarding_entity_id"]:
                    # Check if any budget line items are in execution or higher (by enum definition)
                    if any(
                        [
                            list(BudgetLineItemStatus.__members__.values()).index(bli.status)
                            >= list(BudgetLineItemStatus.__members__.values()).index(BudgetLineItemStatus.IN_EXECUTION)
                            for bli in agreement.budget_line_items
                        ]
                    ):
                        raise ValueError(
                            "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."
                        )
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

            case "agreement_reason":
                if isinstance(data[item], str):
                    setattr(agreement, item, AgreementReason[data[item]])

            case "agreement_type":
                if isinstance(data[item], str):
                    setattr(agreement, item, AgreementType[data[item]])

            case "contract_type":
                if isinstance(data[item], str):
                    setattr(agreement, item, ContractType[data[item]])

            case "service_requirement_type":
                if isinstance(data[item], str):
                    setattr(agreement, item, ServiceRequirementType[data[item]])
            case "vendor":
                if isinstance(data[item], str):
                    add_update_vendor(data, "vendor", agreement)
            case _:
                if getattr(agreement, item) != data[item]:
                    setattr(agreement, item, data[item])


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


def _get_agreements(  # noqa: C901 - too complex
    session: Session, agreement_cls: Type[Agreement], schema: Schema, data: dict[str, Any]
) -> Sequence[Agreement]:
    # Use validated parameters to filter agreements
    fiscal_years = data.get("fiscal_year", [])
    budget_line_statuses = data.get("budget_line_status", [])
    portfolios = data.get("portfolio", [])
    project_id = data.get("project_id", [])
    agreement_reason = data.get("agreement_reason", [])

    contract_number = data.get("contract_number", [])
    contract_type = data.get("contract_type", [])
    agreement_type = data.get("agreement_type", [])
    delivered_status = data.get("delivered_status", [])
    awarding_entity_id = data.get("awarding_entity_id", [])
    project_officer_id = data.get("project_officer_id", [])
    alternate_project_officer_id = data.get("alternate_project_officer_id", [])
    foa = data.get("foa", [])
    name = data.get("name", [])
    search = data.get("search", [])
    only_my = data.get("only_my", [])

    logger.debug(f"Query parameters: {schema.dump(data)}")

    query = (
        select(agreement_cls)
        .distinct()
        .join(BudgetLineItem, isouter=True)
        .join(CAN, isouter=True)
        .order_by(agreement_cls.id)
    )
    if fiscal_years:
        query = query.where(BudgetLineItem.fiscal_year.in_(fiscal_years))
    if budget_line_statuses:
        query = query.where(BudgetLineItem.status.in_(budget_line_statuses))
    if portfolios:
        query = query.where(CAN.portfolio_id.in_(portfolios))
    if project_id:
        query = query.where(agreement_cls.project_id.in_(project_id))
    if agreement_reason:
        query = query.where(agreement_cls.agreement_reason.in_(agreement_reason))
    if agreement_cls in [ContractAgreement] and contract_number:
        query = query.where(agreement_cls.contract_number.in_(contract_number))
    if agreement_cls in [ContractAgreement] and contract_type:
        query = query.where(agreement_cls.contract_type.in_(contract_type))
    if agreement_type:
        query = query.where(agreement_cls.agreement_type.in_(agreement_type))
    if agreement_cls in [ContractAgreement] and delivered_status:
        query = query.where(agreement_cls.delivered_status.in_(delivered_status))
    if awarding_entity_id:
        query = query.where(agreement_cls.awarding_entity_id.in_(awarding_entity_id))
    if project_officer_id:
        query = query.where(agreement_cls.project_officer_id.in_(project_officer_id))
    if alternate_project_officer_id:
        query = query.where(agreement_cls.alternate_project_officer_id.in_(alternate_project_officer_id))
    if agreement_cls in [GrantAgreement] and foa:
        query = query.where(agreement_cls.foa.in_(foa))
    if name:
        query = query.where(agreement_cls.name.in_(name))
    query = __get_search_clause(agreement_cls, query, search)

    logger.debug(f"query: {query}")
    all_results = session.scalars(query).all()

    if only_my and True in only_my:
        results = [agreement for agreement in all_results if associated_with_agreement(agreement.id)]
    else:
        results = all_results

    return results


def _sort_agreements(results, sort_condition, sort_descending):
    match (sort_condition):
        case AgreementSortCondition.AGREEMENT:
            return sorted(results, key=lambda agreement: agreement.name, reverse=sort_descending)
        case AgreementSortCondition.PROJECT:
            return sorted(results, key=project_sort, reverse=sort_descending)
        case AgreementSortCondition.TYPE:
            return sorted(results, key=agreement_type_sort, reverse=sort_descending)
        case AgreementSortCondition.AGREEMENT_TOTAL:
            return sorted(results, key=agreement_total_sort, reverse=sort_descending)
        case AgreementSortCondition.NEXT_BUDGET_LINE:
            return sorted(results, key=next_budget_line_sort, reverse=sort_descending)
        case AgreementSortCondition.NEXT_OBLIGATE_BY:
            return sorted(results, key=next_obligate_by_sort, reverse=sort_descending)
        case _:
            return results


def project_sort(agreement):
    return agreement.project.title if agreement.project else "TBD"


def agreement_type_sort(agreement):
    agreement_type = str(agreement.agreement_type)
    procurement_shop = agreement.procurement_shop.abbr if agreement.procurement_shop else None
    if procurement_shop and procurement_shop != "GCS" and agreement.agreement_type == AgreementType.CONTRACT:
        agreement_type = "AA"

    return agreement_type


def agreement_total_sort(agreement):
    # Filter out DRAFT budget line items
    filtered_blis = list(filter(lambda bli: bli.status != BudgetLineItemStatus.DRAFT, agreement.budget_line_items))

    # Calculate sum of amounts, skipping None values by using 0 instead
    bli_totals = Decimal("0")
    for bli in filtered_blis:
        if bli.amount is not None:
            bli_totals += bli.amount + bli.fees

    return bli_totals


def next_budget_line_sort(agreement):
    next_bli = _get_next_obligated_bli(agreement.budget_line_items)

    if next_bli:
        amount = next_bli.amount if next_bli.amount is not None else Decimal("0")
        total = amount + next_bli.fees
        return total
    else:
        return Decimal("0")


def next_obligate_by_sort(agreement):
    next_bli = _get_next_obligated_bli(agreement.budget_line_items)

    return next_bli.date_needed if next_bli else date.today()


def _get_next_obligated_bli(budget_line_items):
    next_bli = None
    for bli in budget_line_items:
        if bli.status != BudgetLineItemStatus.DRAFT and bli.date_needed and bli.date_needed >= date.today():
            if not next_bli or bli.date_needed < next_bli.date_needed:
                next_bli = bli
    return next_bli


def __get_search_clause(agreement_cls, query, search):
    if search:
        for search_term in search:
            if not search_term:  # if search_term is empty then do not return any results
                query = query.where(agreement_cls.name.is_(None))
            else:
                # Use ilike for case-insensitive search
                query = query.where(agreement_cls.name.ilike(f"%{search_term}%"))
    return query
