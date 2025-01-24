from __future__ import annotations

from flask import Response, current_app, request

from marshmallow import fields
from models import ContractAgreement, ContractType
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.agreements import AgreementData
from ops_api.ops.schemas.team_members import TeamMembers
from ops_api.ops.utils.response import make_response_with_headers


class ContractAgreementResponse(AgreementData):
    contract_number = fields.Str(default=None)
    vendor = fields.Str(default=None)
    delivered_status = fields.Bool(default=False)
    contract_type = fields.Enum(ContractType, default=False)
    support_contacts = fields.List(
        fields.Nested(TeamMembers),
        default=[],
    )


class ContractItemAPI(BaseItemAPI):
    def __init__(self, model: ContractAgreement = ContractAgreement):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)
        return response


class ContractListAPI(BaseListAPI):
    def __init__(self, model: ContractAgreement = ContractAgreement):
        super().__init__(model)
        self._response_schema = ContractAgreementResponse()
        self._response_schema_collection = ContractAgreementResponse(many=True)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        stmt = self._get_query(self.model, **request.args)

        result = current_app.db_session.execute(stmt).all()

        response = make_response_with_headers(self._response_schema_collection.dump([item[0] for item in result]))

        return response
