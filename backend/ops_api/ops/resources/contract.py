from __future__ import annotations

from typing import Optional

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from marshmallow import fields
from models import ContractType
from models.base import BaseData
from models.cans import ContractAgreement
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.dataclass_schemas.agreements import AgreementData
from ops_api.ops.dataclass_schemas.team_members import TeamMembers
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from typing_extensions import override


class ContractAgreementResponse(AgreementData):
    contract_number: Optional[str] = fields.Str(default=None)
    vendor: Optional[str] = fields.Str(default=None)
    delivered_status: Optional[bool] = fields.Bool(default=False)
    contract_type: Optional[ContractType] = fields.Enum(ContractType, default=False)
    support_contacts: Optional[list[TeamMembers]] = fields.List(
        fields.Nested(TeamMembers),
        default=[],
    )


class ContractItemAPI(BaseItemAPI):
    def __init__(self, model: BaseData = ContractAgreement):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)
        return response


class ContractListAPI(BaseListAPI):
    def __init__(self, model: BaseData = ContractAgreement):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ContractAgreementResponse)()
        self._response_schema_collection = mmdc.class_schema(ContractAgreementResponse)(many=True)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        stmt = self._get_query(self.model, **request.args)

        result = current_app.db_session.execute(stmt).all()

        response = make_response_with_headers(self._response_schema_collection.dump([item[0] for item in result]))

        return response
