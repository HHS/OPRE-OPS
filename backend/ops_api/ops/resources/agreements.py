from dataclasses import dataclass
from typing import Any, Optional

from flask import Response, current_app, request
from flask.views import MethodView
from loguru import logger
from marshmallow import EXCLUDE

from models import (
    AaAgreement,
    Agreement,
    AgreementReason,
    AgreementType,
    BaseModel,
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

            serialized_agreement = _serialize_agreement_with_meta(item, AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING)

            response = make_response_with_headers(serialized_agreement)

            event_meta.metadata.update({"agreement_id": id})

            return response

    @is_authorized(PermissionType.PUT, Permission.AGREEMENT)
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
            agreement, status_code = _update(id, message_prefix, meta, partial=False)

            return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, status_code)

    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    def patch(self, id: int) -> Response:
        message_prefix = f"PATCH to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
            agreement, status_code = _update(id, message_prefix, meta, partial=True)

            return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, status_code)

    @is_authorized(
        PermissionType.DELETE,
        Permission.AGREEMENT,
    )
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_AGREEMENT) as meta:
            service: OpsService[Agreement] = AgreementsService(current_app.db_session)
            agreement: Agreement = service.get(id)

            if any(bli.status != BudgetLineItemStatus.DRAFT for bli in agreement.budget_line_items):
                raise RuntimeError(f"Agreement {id} has budget line items not in draft status.")

            service.delete(agreement.id)
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
                DirectAgreement,
                AaAgreement,
            ]
            request_schema = AgreementRequestSchema()
            data = request_schema.load(request.args.to_dict(flat=False))

            logger.debug("Beginning agreement queries")
            service = AgreementsService(current_app.db_session)
            agreements, metadata = service.get_list(agreement_classes, data)
            logger.debug("Agreement queries complete")

            logger.debug("Serializing results")

            agreement_response = []

            for agreement in agreements:
                serialized_agreement = _serialize_agreement_with_meta(
                    agreement,
                    AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING,
                    is_editable=associated_with_agreement(agreement.id),
                )

                agreement_response.append(serialized_agreement)

            logger.debug("Serialization complete")

            event_meta.metadata.update(
                {
                    "agreement_ids": [agreement.id for agreement in agreements],
                    "total_count": metadata["count"],
                    "limit": metadata["limit"],
                    "offset": metadata["offset"],
                }
            )

            # Return wrapped response with metadata
            response_data = {
                "data": agreement_response,
                "count": metadata["count"],
                "limit": metadata["limit"],
                "offset": metadata["offset"],
            }

            return make_response_with_headers(response_data)

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
            logger.info(f"POST to {ENDPOINT_STRING}: New Agreement created: {new_agreement_dict}")

            return make_response_with_headers({"message": "Agreement created", "id": agreement.id}, 201)


class AgreementReasonListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        reasons = [item.name for item in AgreementReason]
        return make_response_with_headers(reasons)


class AgreementTypeListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        return make_response_with_headers([e.name for e in AgreementType])


def __get_search_clause(agreement_cls, query, search):
    if search:
        for search_term in search:
            if not search_term:  # if search_term is empty then do not return any results
                query = query.where(agreement_cls.name.is_(None))
            else:
                # Use ilike for case-insensitive search
                query = query.where(agreement_cls.name.ilike(f"%{search_term}%"))
    return query


def _update(id: int, message_prefix: str, meta: OpsEventHandler, partial: bool = False) -> tuple[Agreement, int]:
    """
    Update an existing agreement.
    """
    service: OpsService[Agreement] = AgreementsService(current_app.db_session)
    old_agreement: Agreement = service.get(id)
    old_serialized_agreement: Agreement = old_agreement.to_dict()
    schema = AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(old_agreement.agreement_type)()
    data = schema.load(request.json, unknown=EXCLUDE, partial=partial)
    data["agreement_cls"] = AGREEMENT_TYPE_TO_CLASS_MAPPING.get(old_agreement.agreement_type)

    agreement, status_code = service.update(old_agreement.id, data)

    response_schema = AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(agreement.agreement_type)()
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
        "isEditable": (is_editable if is_editable is not None else associated_with_agreement(agreement.id))
    }
    meta = meta_schema.dump(data_for_meta)
    serialized_agreement["_meta"] = meta

    return serialized_agreement
