from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, Optional, Sequence, Type

from flask import Response, current_app, request
from flask.views import MethodView
from loguru import logger
from marshmallow import EXCLUDE
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from models import (
    CAN,
    AaAgreement,
    Agreement,
    AgreementReason,
    AgreementSortCondition,
    AgreementType,
    BaseModel,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    DirectAgreement,
    GrantAgreement,
    IaaAgreement,
    OpsEventType,
)
from models.utils import generate_agreement_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.resources.agreements_constants import (
    AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING,
    AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING,
    AGREEMENT_TYPE_TO_CLASS_MAPPING,
    AGREEMENT_TYPE_TO_DATACLASS_MAPPING,
    AGREEMENTS_REQUEST_SCHEMAS,
    ENDPOINT_STRING,
)
from ops_api.ops.schemas.agreements import AgreementRequestSchema, MetaSchema
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.services.budget_line_items import (
    get_bli_is_editable_meta_data_for_agreements,
)
from ops_api.ops.services.ops_service import OpsService
from ops_api.ops.utils.agreements_helpers import associated_with_agreement
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
            service: OpsService[Agreement] = AgreementsService(current_app.db_session)
            item: Agreement = service.get(id)

            serialized_agreement = _serialize_agreement_with_meta(
                item, AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING
            )

            response = make_response_with_headers(serialized_agreement)

            event_meta.metadata.update({"agreement_id": id})

            return response

    @is_authorized(PermissionType.PUT, Permission.AGREEMENT)
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
            agreement, status_code = _update(id, message_prefix, meta, partial=False)

            return make_response_with_headers(
                {"message": "Agreement updated", "id": agreement.id}, status_code
            )

    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    def patch(self, id: int) -> Response:
        message_prefix = f"PATCH to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
            agreement, status_code = _update(id, message_prefix, meta, partial=True)

            return make_response_with_headers(
                {"message": "Agreement updated", "id": agreement.id}, status_code
            )

    @is_authorized(
        PermissionType.DELETE,
        Permission.AGREEMENT,
    )
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_AGREEMENT) as meta:
            service: OpsService[Agreement] = AgreementsService(current_app.db_session)
            agreement: Agreement = service.get(id)

            if any(
                bli.status != BudgetLineItemStatus.DRAFT
                for bli in agreement.budget_line_items
            ):
                raise RuntimeError(
                    f"Agreement {id} has budget line items not in draft status."
                )

            service.delete(agreement.id)
            meta.metadata.update({"Deleted Agreement": id})

            return make_response_with_headers(
                {"message": "Agreement deleted", "id": agreement.id}, 200
            )


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
                DirectAgreement,
                AaAgreement,
            ]
            result = []
            request_schema = AgreementRequestSchema()
            data = request_schema.load(request.args.to_dict(flat=False))

            logger.debug("Beginning agreement queries")
            for agreement_cls in agreement_classes:
                agreements = _get_agreements(
                    current_app.db_session, agreement_cls, data
                )
                result.extend(agreements)
            logger.debug("Agreement queries complete")

            sort_conditions = data.get("sort_conditions", [])
            sort_descending = data.get("sort_descending", [])
            if sort_conditions:
                result = _sort_agreements(
                    result, sort_conditions[0], sort_descending[0]
                )
            else:
                # Default sort by id if no sort conditions are provided
                result = _sort_agreements(
                    result, AgreementSortCondition.AGREEMENT, False
                )

            logger.debug("Serializing results")

            agreement_response = []

            for agreement in result:
                serialized_agreement = _serialize_agreement_with_meta(
                    agreement,
                    AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING,
                    is_editable=associated_with_agreement(agreement.id),
                )

                agreement_response.append(serialized_agreement)

            logger.debug("Serialization complete")

            event_meta.metadata.update(
                {"agreement_ids": [agreement.id for agreement in result]}
            )

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

            schema = AGREEMENTS_REQUEST_SCHEMAS.get(agreement_type)

            data = schema.load(request.json, unknown=EXCLUDE)

            service: OpsService[Agreement] = AgreementsService(current_app.db_session)

            data["agreement_cls"] = AGREEMENT_TYPE_TO_CLASS_MAPPING.get(agreement_type)

            agreement = service.create(data)

            new_agreement_dict = agreement.to_dict()
            meta.metadata.update({"New Agreement": new_agreement_dict})
            logger.info(
                f"POST to {ENDPOINT_STRING}: New Agreement created: {new_agreement_dict}"
            )

            return make_response_with_headers(
                {"message": "Agreement created", "id": agreement.id}, 201
            )


class AgreementReasonListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        reasons = [item.name for item in AgreementReason]
        return make_response_with_headers(reasons)


class AgreementTypeListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        return make_response_with_headers([e.name for e in AgreementType])


def _get_agreements(
    session: Session, agreement_cls: Type[Agreement], data: dict[str, Any]
) -> Sequence[Agreement]:
    query = _build_base_query(agreement_cls)
    query = _apply_filters(query, agreement_cls, data)

    logger.debug(f"query: {query}")
    all_results = session.scalars(query).all()

    return _filter_by_ownership(all_results, data.get("only_my", []))


def _build_base_query(agreement_cls: Type[Agreement]) -> Select[tuple[Agreement]]:
    return (
        select(agreement_cls)
        .distinct()
        .join(BudgetLineItem, isouter=True)
        .join(CAN, isouter=True)
        .order_by(agreement_cls.id)
    )


def _apply_filters(
    query: Select[Agreement], agreement_cls: Type[Agreement], data: dict[str, Any]
) -> Select[Agreement]:
    """Apply filters to the query based on the provided data."""
    query = _apply_budget_line_filters(query, data)
    query = _apply_agreement_filters(query, agreement_cls, data)
    query = _apply_agreement_specific_filters(query, agreement_cls, data)
    query = _apply_search_filter(query, agreement_cls, data.get("search", []))

    return query


def _apply_budget_line_filters(
    query: Select[Agreement], data: dict[str, Any]
) -> Select[Agreement]:
    """Apply filters related to budget line items."""
    fiscal_years = data.get("fiscal_year", [])
    budget_line_statuses = data.get("budget_line_status", [])
    portfolios = data.get("portfolio", [])

    if fiscal_years:
        query = query.where(BudgetLineItem.fiscal_year.in_(fiscal_years))
    if budget_line_statuses:
        query = query.where(BudgetLineItem.status.in_(budget_line_statuses))
    if portfolios:
        query = query.where(CAN.portfolio_id.in_(portfolios))

    return query


def _apply_agreement_filters(
    query: Select[Agreement], agreement_cls: Type[Agreement], data: dict[str, Any]
) -> Select[Agreement]:
    """Apply general agreement filters."""
    common_filters = [
        ("project_id", agreement_cls.project_id),
        ("agreement_reason", agreement_cls.agreement_reason),
        ("agreement_type", agreement_cls.agreement_type),
        ("awarding_entity_id", agreement_cls.awarding_entity_id),
        ("project_officer_id", agreement_cls.project_officer_id),
        ("alternate_project_officer_id", agreement_cls.alternate_project_officer_id),
        ("name", agreement_cls.name),
        ("nick_name", agreement_cls.nick_name),
    ]

    for filter_key, column in common_filters:
        values = data.get(filter_key, [])
        if values:
            query = query.where(column.in_(values))

    return query


def _apply_agreement_specific_filters(
    query: Select[Agreement], agreement_cls: Type[Agreement], data: dict[str, Any]
) -> Select[Agreement]:
    """Apply filters specific to certain agreement types."""
    # Contract and AA Agreement filters
    if agreement_cls in [ContractAgreement, AaAgreement]:
        contract_filters = [
            ("contract_number", agreement_cls.contract_number),
            ("contract_type", agreement_cls.contract_type),
        ]
        for filter_key, column in contract_filters:
            values = data.get(filter_key, [])
            if values:
                query = query.where(column.in_(values))

    # Contract Agreement specific filters
    if agreement_cls == ContractAgreement:
        delivered_status = data.get("delivered_status", [])
        if delivered_status:
            query = query.where(agreement_cls.delivered_status.in_(delivered_status))

    # Grant Agreement specific filters
    if agreement_cls == GrantAgreement:
        foa = data.get("foa", [])
        if foa:
            query = query.where(agreement_cls.foa.in_(foa))

    return query


def _apply_search_filter(
    query: Select[Agreement], agreement_cls: Type[Agreement], search_terms: list[str]
) -> Select[Agreement]:
    """Apply search filter to agreement names."""
    if search_terms:
        for search_term in search_terms:
            if not search_term:
                query = query.where(agreement_cls.name.is_(None))
            else:
                query = query.where(agreement_cls.name.ilike(f"%{search_term}%"))

    return query


def _filter_by_ownership(results, only_my):
    """
    Filter results based on ownership if 'only_my' is True.
    """
    if only_my and True in only_my:
        return [
            agreement
            for agreement in results
            if associated_with_agreement(agreement.id)
        ]
    return results


def _sort_agreements(results, sort_condition, sort_descending):
    match (sort_condition):
        case AgreementSortCondition.AGREEMENT:
            return sorted(
                results, key=lambda agreement: agreement.name, reverse=sort_descending
            )
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
    procurement_shop = (
        agreement.procurement_shop.abbr if agreement.procurement_shop else None
    )
    if (
        procurement_shop
        and procurement_shop != "GCS"
        and agreement.agreement_type == AgreementType.CONTRACT
    ):
        agreement_type = "AA"

    return agreement_type


def agreement_total_sort(agreement):
    # Filter out DRAFT budget line items
    filtered_blis = list(
        filter(
            lambda bli: bli.status != BudgetLineItemStatus.DRAFT,
            agreement.budget_line_items,
        )
    )

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
        if (
            bli.status != BudgetLineItemStatus.DRAFT
            and bli.date_needed
            and bli.date_needed >= date.today()
        ):
            if not next_bli or bli.date_needed < next_bli.date_needed:
                next_bli = bli
    return next_bli


def __get_search_clause(agreement_cls, query, search):
    if search:
        for search_term in search:
            if (
                not search_term
            ):  # if search_term is empty then do not return any results
                query = query.where(agreement_cls.name.is_(None))
            else:
                # Use ilike for case-insensitive search
                query = query.where(agreement_cls.name.ilike(f"%{search_term}%"))
    return query


def _update(
    id: int, message_prefix: str, meta: OpsEventHandler, partial: bool = False
) -> tuple[Agreement, int]:
    """
    Update an existing agreement.
    """
    service: OpsService[Agreement] = AgreementsService(current_app.db_session)
    old_agreement: Agreement = service.get(id)
    old_serialized_agreement: Agreement = old_agreement.to_dict()
    schema = AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(old_agreement.agreement_type)()
    data = schema.load(request.json, unknown=EXCLUDE, partial=partial)
    data["agreement_cls"] = AGREEMENT_TYPE_TO_CLASS_MAPPING.get(
        old_agreement.agreement_type
    )

    agreement, status_code = service.update(old_agreement.id, data)

    response_schema = AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(
        agreement.agreement_type
    )()
    agreement_dict = response_schema.dump(agreement)
    agreement_updates = generate_agreement_events_update(
        old_serialized_agreement,
        agreement.to_dict(),
        agreement.id,
        agreement.updated_by,
    )
    meta.metadata.update({"agreement_updates": agreement_updates})
    current_app.logger.info(f"{message_prefix}: Updated Agreement: {agreement_dict}")
    return agreement, status_code


def _serialize_agreement_with_meta(
    agreement: Agreement,
    schema_mapping: dict[AgreementType, Any],
    is_editable: bool = None,
) -> dict:
    """
    Serialize an agreement with its metadata.
    """
    schema_type = schema_mapping.get(agreement.agreement_type)
    schema = schema_type()
    serialized_agreement = schema.dump(agreement)

    get_bli_is_editable_meta_data_for_agreements(serialized_agreement)

    meta_schema = MetaSchema()
    data_for_meta = {
        "isEditable": (
            is_editable
            if is_editable is not None
            else associated_with_agreement(agreement.id)
        )
    }
    meta = meta_schema.dump(data_for_meta)
    serialized_agreement["_meta"] = meta

    return serialized_agreement
