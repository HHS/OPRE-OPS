from flask import Response, current_app, request
from flask_jwt_extended import jwt_required

from models import OpsEventType
from models.utils import generate_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.cans import CreateUpdateFundingBudgetSchema, FundingBudgetSchema
from ops_api.ops.services.agreement_agency import AgreementAgencyService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class AgreementAgencyItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        schema = FundingBudgetSchema()
        service = AgreementAgencyService(current_app.db_session)
        item = service.get(id)
        return make_response_with_headers(schema.dump(item))

    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    def patch(self, id: int) -> Response:
        """
        Update an AgreementAgency with only the fields provided in the request body.
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN_FUNDING_BUDGET) as meta:
            service = AgreementAgencyService(current_app.db_session)
            request_data = request.get_json()
            # Setting partial to true ignores any missing fields.
            schema = CreateUpdateFundingBudgetSchema(partial=True)
            serialized_request = schema.load(request_data)

            old_agreement_agency = service.get(id)
            serialized_old_agreement_agency = schema.dump(old_agreement_agency)
            updated_agreement_agency = service.update(serialized_request, id)
            serialized_updated_agreement_agency = schema.dump(updated_agreement_agency)
            updates = generate_events_update(
                serialized_old_agreement_agency,
                serialized_updated_agreement_agency,
                updated_agreement_agency.id,
                updated_agreement_agency.updated_by,
            )
            meta.metadata.update({"agreement_agency_updates": updates})
            return make_response_with_headers(serialized_updated_agreement_agency)

    @is_authorized(PermissionType.PUT, Permission.AGREEMENT)
    def put(self, id: int) -> Response:
        """
        Update an AgreementAgency
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN_FUNDING_BUDGET) as meta:
            request_data = request.get_json()
            service = AgreementAgencyService(current_app.db_session)
            schema = CreateUpdateFundingBudgetSchema()
            serialized_request = schema.load(request_data)

            old_agreement_agency = service.get(id)
            serialized_old_agreement_agency = schema.dump(old_agreement_agency)
            updated_agreement_agency = service.update(serialized_request, id)
            serialized_updated_agreement_agency = schema.dump(updated_agreement_agency)
            updates = generate_events_update(
                serialized_old_agreement_agency,
                serialized_updated_agreement_agency,
                updated_agreement_agency.can_id,
                updated_agreement_agency.updated_by,
            )
            meta.metadata.update({"agreement_agency_updates": updates})
            return make_response_with_headers(serialized_updated_agreement_agency)

    @is_authorized(PermissionType.DELETE, Permission.CAN)
    def delete(self, id: int) -> Response:
        """
        Delete a CANFundingBudget with given id.
        """
        with OpsEventHandler(OpsEventType.DELETE_CAN_FUNDING_BUDGET) as meta:
            service = AgreementAgencyService(current_app.db_session)
            service.delete(id)
            meta.metadata.update({"deleted_agreement_agency": id})
            return make_response_with_headers({"message": "AgreementAgency deleted", "id": id}, 200)


class AgreementAgencyListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        service = AgreementAgencyService(current_app.db_session)
        result = service.get_list()
        funding_budget_schema = FundingBudgetSchema()
        return make_response_with_headers([funding_budget_schema.dump(funding_budget) for funding_budget in result])

    @is_authorized(PermissionType.POST, Permission.CAN)
    def post(self) -> Response:
        """
        Create a new CANFundingBudget object
        """
        with OpsEventHandler(OpsEventType.CREATE_CAN_FUNDING_BUDGET) as meta:
            service = AgreementAgencyService(current_app.db_session)
            request_data = request.get_json()
            schema = CreateUpdateFundingBudgetSchema()
            serialized_request = schema.load(request_data)

            created_funding_budget = service.create(serialized_request)

            funding_budget_schema = FundingBudgetSchema()
            serialized_funding_budget = funding_budget_schema.dump(created_funding_budget)
            meta.metadata.update({"new_can_funding_budget": serialized_funding_budget})
            return make_response_with_headers(serialized_funding_budget, 201)
