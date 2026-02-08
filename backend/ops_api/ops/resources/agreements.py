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
from ops_api.ops.schemas.agreements import (
    AgreementFiltersQueryParametersSchema,
    AgreementListFilterOptionResponseSchema,
    AgreementRequestSchema,
    MetaSchema,
)
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.services.budget_line_items import (
    get_bli_is_editable_meta_data_for_agreements,
)
from ops_api.ops.services.ops_service import OpsService, ValidationError
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
            meta.metadata.update({"agreement_id": id})

            try:
                agreement, status_code = _update(id, message_prefix, meta, partial=False)
            except ValidationError as ve:
                error_details = ve.details if hasattr(ve, "details") else str(ve)
                meta.metadata.update(error_details)
                raise

            return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, status_code)

    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    def patch(self, id: int) -> Response:
        message_prefix = f"PATCH to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
            meta.metadata.update({"agreement_id": id})

            try:
                agreement, status_code = _update(id, message_prefix, meta, partial=True)
            except ValidationError as ve:
                error_details = ve.details if hasattr(ve, "details") else str(ve)
                meta.metadata.update(error_details)
                raise

            return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, status_code)

    @is_authorized(
        PermissionType.DELETE,
        Permission.AGREEMENT,
    )
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_AGREEMENT) as meta:
            meta.metadata.update({"agreement_id": id})
            service: OpsService[Agreement] = AgreementsService(current_app.db_session)
            agreement: Agreement = service.get(id)

            try:
                service.delete(agreement.id)
            except ValidationError as ve:
                error_details = ve.details if hasattr(ve, "details") else str(ve)
                meta.metadata.update(error_details)
                raise

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
        """
        Create a new agreement with optional nested budget line items and services components.

        This endpoint supports atomic creation of an agreement along with its related entities
        in a single API call. All operations are performed within a single database transaction -
        if any part fails, the entire operation is rolled back.

        **Nested Entity Creation**:
        - `budget_line_items`: Optional array of budget line items to create with the agreement
        - `services_components`: Optional array of services components to create with the agreement

        **Budget Line Item to Services Component Linking**:
        Budget line items can reference services components in two ways:
        1. `services_component_id`: Reference an existing services component by database ID
        2. `services_component_ref`: Reference a services component being created in the same request
           by its `ref` field value

        **Services Component Reference Mechanism**:
        - Each services component in the `services_components` array can have a `ref` field (string)
        - Budget line items can reference these using `services_component_ref`
        - If no `ref` is provided, the array index (as a string) is used: "0", "1", "2", etc.
        - Example:
          ```json
          {
            "services_components": [
              {"ref": "base_period", "number": 1, "optional": false}
            ],
            "budget_line_items": [
              {"line_description": "Budget", "amount": 500000, "can_id": 500,
               "services_component_ref": "base_period"}
            ]
          }
          ```

        **Request Body**:
        Standard agreement fields plus:
        - `budget_line_items` (array, optional): Budget line items to create atomically
          - Each item excludes `agreement_id` (set automatically)
          - Can include `services_component_ref` to link to a newly created SC
          - Can include `services_component_id` to link to an existing SC
          - Cannot have both `services_component_id` and `services_component_ref`
        - `services_components` (array, optional): Services components to create atomically
          - Each item excludes `agreement_id` (set automatically)
          - Can include `ref` field for referencing (defaults to array index if omitted)

        **Response** (201 Created):
        ```json
        {
          "message": "Agreement created with X budget line items and Y services components",
          "id": <agreement_id>,
          "budget_line_items_created": X,
          "services_components_created": Y
        }
        ```

        **Backward Compatibility**:
        Omitting `budget_line_items` and `services_components` creates an agreement
        without nested entities, maintaining compatibility with existing code.

        **Error Handling**:
        - Returns 400 for validation errors (e.g., invalid `services_component_ref`)
        - Returns 404 for missing references (e.g., invalid `can_id`)
        - On error, all changes are rolled back (no partial data created)

        Returns:
            Response: JSON response with agreement ID and creation counts

        Raises:
            ValidationError: Invalid data or references
            ResourceNotFoundError: Referenced entity doesn't exist
        """
        with OpsEventHandler(OpsEventType.CREATE_NEW_AGREEMENT) as meta:
            if "agreement_type" not in request.json:
                raise ValidationError({"agreement_type": ["This field is required."]})

            try:
                agreement_type = AgreementType[request.json["agreement_type"]]
            except KeyError as err:
                raise ValidationError({"agreement_type": ["Invalid agreement type provided."]}) from err

            meta.metadata.update({"agreement_type": agreement_type.name})
            schema = AGREEMENTS_REQUEST_SCHEMAS.get(agreement_type)

            data = schema.load(request.json, unknown=EXCLUDE)

            service: OpsService[Agreement] = AgreementsService(current_app.db_session)

            data["agreement_cls"] = AGREEMENT_TYPE_TO_CLASS_MAPPING.get(agreement_type)

            try:
                agreement, results = service.create(data)
            except ValidationError as ve:
                error_details = ve.details if hasattr(ve, "details") else str(ve)
                meta.metadata.update(error_details)
                raise

            bli_count = results.get("budget_line_items_created", 0)
            sc_count = results.get("services_components_created", 0)

            new_agreement_dict = agreement.to_dict()
            meta.metadata.update({"New Agreement": new_agreement_dict})

            # Build response message based on what was created
            message = _build_creation_message(bli_count, sc_count)

            logger.info(
                f"POST to {ENDPOINT_STRING}: {message} (agreement_id={agreement.id}, "
                f"bli_count={bli_count}, sc_count={sc_count})"
            )

            return make_response_with_headers(
                {
                    "message": message,
                    "id": agreement.id,
                    "budget_line_items_created": bli_count,
                    "services_components_created": sc_count,
                },
                201,
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


class AgreementListFilterOptionAPI(BaseItemAPI):
    """API endpoint for retrieving agreement filter options."""

    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._get_schema = AgreementFiltersQueryParametersSchema()
        self._response_schema = AgreementListFilterOptionResponseSchema()

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        """Get filter options for agreements."""
        request_schema = AgreementFiltersQueryParametersSchema()
        data = request_schema.load(request.args.to_dict(flat=False))
        logger.debug(f"Agreement filter query parameters: {request_schema.dump(data)}")

        service: OpsService[Agreement] = AgreementsService(current_app.db_session)
        filter_options = service.get_filter_options(data)

        return make_response_with_headers(filter_options)


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

    # Validation: budget_line_items and services_components cannot be updated
    forbidden_fields = []
    errors = {}
    if "budget_line_items" in request.json:
        forbidden_fields.append("budget_line_items")
    if "services_components" in request.json:
        forbidden_fields.append("services_components")
    for field in forbidden_fields:
        errors[field] = ["This field cannot be included in update requests."]
    if errors:
        raise ValidationError(errors=errors)

    data = schema.load(request.json, unknown=EXCLUDE, partial=partial)

    # Remove the fields from data (these fields are only for creation)
    data.pop("budget_line_items", None)
    data.pop("services_components", None)

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
        "isEditable": (is_editable if is_editable is not None else associated_with_agreement(agreement.id)),
        "immutable_awarded_fields": agreement.immutable_awarded_fields,
    }
    meta = meta_schema.dump(data_for_meta)
    serialized_agreement["_meta"] = meta

    return serialized_agreement


def _build_creation_message(bli_count: int, sc_count: int) -> str:
    """
    Build a creation response message based on the number of budget line items
    and services components created.

    Args:
        bli_count: Number of budget line items created
        sc_count: Number of services components created

    Returns:
        A formatted message string
    """
    message_parts = ["Agreement created"]

    if bli_count > 0:
        message_parts.append(f"{bli_count} budget line item{'s' if bli_count != 1 else ''}")
    if sc_count > 0:
        message_parts.append(f"{sc_count} services component{'s' if sc_count != 1 else ''}")

    if len(message_parts) > 1:
        return message_parts[0] + " with " + " and ".join(message_parts[1:])

    return message_parts[0]
