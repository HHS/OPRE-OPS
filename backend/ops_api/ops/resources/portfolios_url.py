from flask import Response, request
from flask_jwt_extended import jwt_required

from models import OpsEventType
from models.base import BaseModel
from models.utils import generate_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.cans import CreateUpdatePortfolioUrlSchema, PortfolioUrlCANSchema
from ops_api.ops.services.portfolio_url import PortfolioUrlService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioUrlItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self.portfolio_url_service = PortfolioUrlService()

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        schema = PortfolioUrlCANSchema()
        item = self.portfolio_url_service.get(id)
        return make_response_with_headers(schema.dump(item))

    @is_authorized(PermissionType.PATCH, Permission.PORTFOLIO)
    def patch(self, id: int) -> Response:
        """
        Update a PortfolioUrl with only the fields provided in the request body.
        """
        with OpsEventHandler(OpsEventType.UPDATE_PORTFOLIO_URL) as meta:
            request_data = request.get_json()
            # Setting partial to true ignores any missing fields.
            schema = CreateUpdatePortfolioUrlSchema(partial=True)
            serialized_request = schema.load(request_data)

            old_portfolio_url = self.portfolio_url_service.get(id)
            serialized_old_portfolio_url = schema.dump(old_portfolio_url)
            updated_portfolio_url = self.portfolio_url_service.update(serialized_request, id)
            serialized_portfolio_url = schema.dump(updated_portfolio_url)
            updates = generate_events_update(
                serialized_old_portfolio_url,
                serialized_portfolio_url,
                updated_portfolio_url.portfolio_id,
                updated_portfolio_url.updated_by,
            )
            meta.metadata.update({"portfolio_url_updates": updates})
            return make_response_with_headers(serialized_portfolio_url)

    @is_authorized(PermissionType.PUT, Permission.PORTFOLIO)
    def put(self, id: int) -> Response:
        """
        Update a PortfolioUrl
        """
        with OpsEventHandler(OpsEventType.UPDATE_PORTFOLIO_URL) as meta:
            request_data = request.get_json()
            schema = CreateUpdatePortfolioUrlSchema()
            serialized_request = schema.load(request_data)

            output_schema = PortfolioUrlCANSchema()
            old_portfolio_url = self.portfolio_url_service.get(id)
            serialized_old_portfolio_url = output_schema.dump(old_portfolio_url)
            updated_portfolio_url = self.portfolio_url_service.update(serialized_request, id)
            serialized_portfolio_url = output_schema.dump(updated_portfolio_url)
            updates = generate_events_update(
                serialized_old_portfolio_url,
                serialized_portfolio_url,
                updated_portfolio_url.portfolio_id,
                updated_portfolio_url.updated_by,
            )
            meta.metadata.update({"portfolio_url_updates": updates})
            return make_response_with_headers(serialized_portfolio_url)

    @is_authorized(PermissionType.DELETE, Permission.PORTFOLIO)
    def delete(self, id: int) -> Response:
        """
        Delete a PortfolioUrl with given id.
        """
        with OpsEventHandler(OpsEventType.DELETE_PORTFOLIO_URL) as meta:
            self.portfolio_url_service.delete(id)
            meta.metadata.update({"Deleted PortfolioUrl": id})
            return make_response_with_headers({"message": "PortfolioUrl deleted", "id": id}, 200)


class PortfolioUrlListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self.portfolio_url_service = PortfolioUrlService()

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        result = self.portfolio_url_service.get_list()
        portfolio_url_schema = PortfolioUrlCANSchema()
        return make_response_with_headers([portfolio_url_schema.dump(portfolio) for portfolio in result])

    @is_authorized(PermissionType.POST, Permission.PORTFOLIO)
    def post(self) -> Response:
        """
        Create a new PortfolioUrl object
        """
        with OpsEventHandler(OpsEventType.CREATE_PORTFOLIO_URL) as meta:
            request_data = request.get_json()
            schema = CreateUpdatePortfolioUrlSchema()
            serialized_request = schema.load(request_data)

            created_portfolio_url = self.portfolio_url_service.create(serialized_request)

            portfolio_url_schema = PortfolioUrlCANSchema()
            serialized_portfolio_url = portfolio_url_schema.dump(created_portfolio_url)
            meta.metadata.update({"new_portfolio_url": serialized_portfolio_url})
            return make_response_with_headers(serialized_portfolio_url, 201)
