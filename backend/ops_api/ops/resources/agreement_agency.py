from flask import Response, current_app
from flask_jwt_extended import jwt_required

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.agreement_agency import AgreementAgencySchema
from ops_api.ops.services.agreement_agency import AgreementAgencyService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


class AgreementAgencyItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        schema = AgreementAgencySchema()
        service = AgreementAgencyService(current_app.db_session)
        item = service.get(id)
        return make_response_with_headers(schema.dump(item))


class AgreementAgencyListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        service = AgreementAgencyService(current_app.db_session)
        result = service.get_list()
        agreement_agency_schema = AgreementAgencySchema()
        return make_response_with_headers(
            [agreement_agency_schema.dump(agreement_agency) for agreement_agency in result]
        )
