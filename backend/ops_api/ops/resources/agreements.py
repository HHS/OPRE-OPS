from dataclasses import dataclass, fields as dc_fields
from typing import Optional, Type

import desert
from flask import Response, current_app, jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from marshmallow import fields
from models import ContractType, OpsEventType, User
from models.base import BaseModel
from models.cans import Agreement, AgreementReason, AgreementType, ContractAgreement, GrantAgreement, ProductServiceCode
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, OPSMethodView
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from sqlalchemy.future import select
from sqlalchemy.orm import with_polymorphic
from typing_extensions import Any, override

ENDPOINT_STRING = "/agreements"


@dataclass
class TeamMembers:
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None


@dataclass
class AgreementData:
    name: str
    number: str
    agreement_type: AgreementType = fields.Enum(AgreementType)
    description: Optional[str] = None
    product_service_code_id: Optional[int] = None
    agreement_reason: Optional[AgreementReason] = None
    incumbent: Optional[str] = None
    project_officer: Optional[int] = None
    team_members: Optional[list[TeamMembers]] = fields.List(
        fields.Nested(TeamMembers),
        default=[],
    )
    research_project_id: Optional[int] = None
    procurement_shop_id: Optional[int] = None
    notes: Optional[str] = None


@dataclass
class ContractAgreementData(AgreementData):
    contract_number: Optional[str] = None
    vendor: Optional[str] = None
    delivered_status: Optional[bool] = fields.Boolean(default=False)
    contract_type: Optional[ContractType] = fields.Enum(ContractType)
    support_contacts: Optional[list[TeamMembers]] = fields.List(
        fields.Nested(TeamMembers),
        default=[],
    )


@dataclass(kw_only=True)
class ContractAgreementPatchBody(ContractAgreementRequestBody):
    name: Optional[str] = None
    number: Optional[str] = None


@dataclass
class GrantAgreementData(AgreementData):
    foa: Optional[str] = None


@dataclass
class GrantAgreementPatchBody(GrantAgreementRequestBody):
    name: Optional[str] = None
    number: Optional[str] = None


REQUEST_SCHEMAS = {
    AgreementType.CONTRACT: {"PUT": ContractAgreementRequestBody, "PATCH": ContractAgreementPatchBody},
    AgreementType.GRANT: {"PUT": GrantAgreementRequestBody, "PATCH": GrantAgreementPatchBody},
}


def pick_schema_class(
    agreement_type: AgreementType, method: str
) -> Type[
    ContractAgreementRequestBody | ContractAgreementPatchBody | GrantAgreementRequestBody | GrantAgreementPatchBody
]:
    type_methods = REQUEST_SCHEMAS.get(agreement_type)
    if not type_methods:
        raise ValueError(f"Invalid agreement_type ({agreement_type})")
    schema = type_methods.get(method, None)
    if not schema:
        raise ValueError(f"Invalid agreement_type for method={method}")
    return schema


@dataclass
class AgreementResponse:
    id: int
    type: str
    name: str
    created_by: int
    number: str
    description: str
    product_service_code: Optional[ProductServiceCode]
    incumbent: str
    project_officer: TeamMembers
    research_project: int
    agreement_type: AgreementType = fields.Enum(AgreementType)
    agreement_reason: AgreementReason = fields.Enum(AgreementReason)
    team_members: Optional[list[TeamMembers]] = None
    budget_line_items: Optional[list[int]] = None
    procurement_shop: Optional[int] = None
    notes: Optional[str] = None


@dataclass
class QueryParameters:
    search: Optional[str] = None
    research_project_id: Optional[int] = None


class AgreementItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @override
    @jwt_required()
    def get(self, id: int) -> Response:
        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["GET_AGREEMENT"])

        if is_authorized:
            response = self._get_item_with_try(id)

        else:
            response = make_response_with_headers({}, 401)

        return response

    @override
    @jwt_required()
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"

        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["PUT_AGREEMENT"])
        if not is_authorized:
            return make_response_with_headers({}, 401)

        try:
            with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
                old_agreement: Agreement = self._get_item(id)
                if not old_agreement:
                    raise RuntimeError("Invalid Agreement id.")
                # reject change of agreement_type
                # for PUT, it must exist in request
                req_type = request.json.get("agreement_type", None)
                if req_type != old_agreement.agreement_type.name:
                    raise RuntimeError("Invalid agreement_type, agreement_type must not change")
                agreement_cls = pick_schema_class(old_agreement.agreement_type, "PUT")
                schema = desert.schema(agreement_cls)

                OPSMethodView._validate_request(
                    schema=schema,
                    message=f"{message_prefix}: Params failed validation:",
                )

                data = schema.load(request.json)
                data = data.__dict__
                agreement = update_agreement(data, old_agreement)
                agreement_dict = agreement.to_dict()
                meta.metadata.update({"updated_agreement": agreement_dict})
                current_app.logger.info(f"{message_prefix}: Updated Agreement: {agreement_dict}")

                return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, 200)
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"{message_prefix}: {se}")
            return make_response_with_headers({}, 500)

    @override
    @jwt_required()
    def patch(self, id: int) -> Response:
        message_prefix = f"PATCH to {ENDPOINT_STRING}"

        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["PATCH_AGREEMENT"])
        if not is_authorized:
            return make_response_with_headers({}, 401)

        try:
            with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
                old_agreement: Agreement = self._get_item(id)
                if not old_agreement:
                    raise RuntimeError("Invalid Agreement id.")
                # reject change of agreement_type
                if "agreement_type" in request.json:
                    req_type = request.json["agreement_type"]
                    if req_type != old_agreement.agreement_type.name:
                        raise RuntimeError("Invalid agreement_type, agreement_type must not change")
                agreement_cls = pick_schema_class(old_agreement.agreement_type, "PATCH")
                schema = desert.schema(agreement_cls)

                OPSMethodView._validate_request(
                    schema=schema,
                    message=f"{message_prefix}: Params failed validation:",
                )

                data = schema.load(request.json)
                data = data.__dict__
                data = {
                    k: v for (k, v) in data.items() if k in request.json
                }  # only keep the attributes from the request body
                agreement = update_agreement(data, old_agreement)
                agreement_dict = agreement.to_dict()
                meta.metadata.update({"updated_agreement": agreement_dict})
                current_app.logger.info(f"{message_prefix}: Updated Agreement: {agreement_dict}")

                return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, 200)
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"{message_prefix}: {se}")
            return make_response_with_headers({}, 500)


class AgreementListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)
        self._schema_contract = desert.schema(ContractAgreementData)
        self._schema_grant = desert.schema(GrantAgreementData)

    @staticmethod
    def _get_query(args):
        polymorphic_agreement = with_polymorphic(Agreement, [ContractAgreement, GrantAgreement])
        stmt = select(polymorphic_agreement).order_by(Agreement.id)
        query_helper = QueryHelper(stmt)

        match args:
            case {"search": search, **filter_args} if not search:
                query_helper.return_none()

            case {"search": search, **filter_args}:
                query_helper.add_search(polymorphic_agreement.name, search)

            case {**filter_args}:
                pass

        if(filter_args):
            # This part is necessary because otherwise the system gets confused. Need to
            # know what table to use to look up parameters from for filtering.
            contract_keys = {field.name for field in dc_fields(ContractAgreementData)}
            grant_keys = {field.name for field in dc_fields(GrantAgreementData)}
            for key, value in filter_args.items():
                if key in contract_keys:
                    agreement_model = ContractAgreement
                elif key in grant_keys:
                    agreement_model = GrantAgreement
                else:
                    agreement_model = Agreement
                query_helper.add_column_equals(getattr(agreement_model, key), value)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @override
    @jwt_required()
    def get(self) -> Response:
        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["GET_AGREEMENTS"])

        if is_authorized:
            stmt = self._get_query(request.args)

            result = current_app.db_session.execute(stmt).all()

            response = make_response_with_headers([i.to_dict() for item in result for i in item])
        else:
            response = make_response_with_headers({}, 401)

        return response

    @override
    @jwt_required()
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        try:
            with OpsEventHandler(OpsEventType.CREATE_NEW_AGREEMENT) as meta:
                if "agreement_type" not in request.json:
                    raise RuntimeError(f"{message_prefix}: Params failed validation")

                agreement_type = request.json["agreement_type"]
                match agreement_type:
                    case "CONTRACT":
                        print("contract")
                        errors = self._schema_contract.validate(request.json)
                        self.check_errors(errors)

                        data = self._schema_contract.load(request.json)
                        new_agreement = self._create_agreement(data, ContractAgreement)

                    case "GRANT":
                        print("grant")
                        errors = self._schema_grant.validate(request.json)
                        self.check_errors(errors)

                        data = self._schema_grant.load(request.json)
                        new_agreement = self._create_agreement(data, GrantAgreement)

                    case _:
                        raise ValueError("Invalid agreement_type")

                token = verify_jwt_in_request()
                user = get_user_from_token(token[1])
                new_agreement.created_by = user.id

                current_app.db_session.add(new_agreement)
                current_app.db_session.commit()

                new_agreement_dict = new_agreement.to_dict()
                meta.metadata.update({"New Agreement": new_agreement_dict})
                current_app.logger.info(f"POST to {ENDPOINT_STRING}: New Agreement created: {new_agreement_dict}")

                return make_response_with_headers({"message": "Agreement created", "id": new_agreement.id}, 201)
        except RuntimeError as re:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: {re}")
            return make_response_with_headers({}, 400)
        except PendingRollbackError as pr:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: {pr}")
            return make_response_with_headers({}, 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: {se}")
            return make_response_with_headers({}, 500)

    def _create_agreement(self, data, agreement_cls):
        tmp_team_members = data.team_members if data.team_members else []
        data.team_members = []

        if agreement_cls == ContractAgreement:
            tmp_support_contacts = data.support_contacts if data.support_contacts else []
            data.support_contacts = []

        new_agreement = agreement_cls(**data.__dict__)

        new_agreement.team_members.extend([current_app.db_session.get(User, tm_id.id) for tm_id in tmp_team_members])

        if agreement_cls == ContractAgreement:
            new_agreement.support_contacts.extend(
                [current_app.db_session.get(User, tm_id.id) for tm_id in tmp_support_contacts]
            )

        return new_agreement

    def check_errors(self, errors):
        if errors:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")
            raise RuntimeError(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")


class AgreementReasonListAPI(MethodView):
    def get(self) -> Response:
        reasons = [item.name for item in AgreementReason]
        return jsonify(reasons)


class AgreementTypeListAPI(MethodView):
    def get(self) -> Response:
        return jsonify([e.name for e in AgreementType])


def update_data(agreement: Agreement, data: dict[str, Any]) -> None:
    for item in data:
        if item not in ["team_members", "support_contacts"]:
            setattr(agreement, item, data[item])

        elif item == "team_members":
            tmp_team_members = data[item] if data[item] else []
            agreement.team_members = []
            if tmp_team_members:
                agreement.team_members.extend(
                    [current_app.db_session.get(User, tm_id.id) for tm_id in tmp_team_members]
                )

        elif item == "support_contacts":
            tmp_support_contacts = data[item] if data[item] else []
            agreement.support_contacts = []
            if tmp_support_contacts:
                agreement.support_contacts.extend(
                    [current_app.db_session.get(User, tm_id.id) for tm_id in tmp_support_contacts]
                )


def update_agreement(data: dict[str, Any], agreement: Agreement):
    update_data(agreement, data)
    current_app.db_session.add(agreement)
    current_app.db_session.commit()
    return agreement
