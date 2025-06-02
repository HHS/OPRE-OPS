from typing import List

from flask import Response, current_app
from sqlalchemy import select

from models import PortfolioUrl
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioUrlItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:

        return self._get_item_with_try(id)


class PortfolioUrlListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self) -> Response:
        result = current_app.db_session.execute(select(PortfolioUrl)).all()

        portfolio_url_response: List[dict] = []
        for item in result:
            for portfolio in item:
                project_dict = portfolio.to_dict()
                portfolio_url_response.append(project_dict)

        return make_response_with_headers(portfolio_url_response)
