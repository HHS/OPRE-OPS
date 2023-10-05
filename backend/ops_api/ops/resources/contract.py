from __future__ import annotations

from contextlib import suppress
from dataclasses import dataclass, field
from typing import Optional

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from marshmallow_enum import EnumField
from models import ContractType
from models.base import BaseData
from models.cans import ContractAgreement
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.dataclass_schemas.team_members import TeamMembers
from ops_api.ops.resources.agreements import AgreementData
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy.future import select
from typing_extensions import override


@dataclass
class ContractAgreementResponse(AgreementData):
    contract_number: Optional[str] = None
    vendor: Optional[str] = None
    delivered_status: Optional[bool] = field(default=False)
    contract_type: Optional[ContractType] = EnumField(ContractType)
    support_contacts: Optional[list[TeamMembers]] = field(default_factory=lambda: [])


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

    @staticmethod
    def get_query(search=None, **kwargs):
        stmt = select(ContractAgreement).order_by(ContractAgreement.id)
        query_helper = QueryHelper(stmt)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(getattr(ContractAgreement, "name"), search)

        for key, value in kwargs.items():
            with suppress(AttributeError):
                query_helper.add_column_equals(getattr(ContractAgreement, key), value)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        stmt = self.get_query(**request.args)

        result = current_app.db_session.execute(stmt).all()

        response = make_response_with_headers(
            self._response_schema_collection.dump([contract[0] for contract in result])
        )

        return response
