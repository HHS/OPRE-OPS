from dataclasses import dataclass
from dataclasses import fields as dc_fields
from typing import ClassVar, Optional

import desert
from flask import Response, current_app, jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from marshmallow import Schema, ValidationError, fields
from models import ContractType, OpsEventType, User
from models.base import BaseModel
from models.cans import Agreement, AgreementReason, AgreementType, ContractAgreement, ProductServiceCode
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, OPSMethodView
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from sqlalchemy.future import select
from typing_extensions import Any, override

ENDPOINT_STRING = "/agreements"


@dataclass
class TeamMembers:
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None


@dataclass
class AgreementData:
    _subclasses: ClassVar[dict[Optional[AgreementType], type["AgreementData"]]] = {}
    _schemas: ClassVar[dict[Optional[AgreementType], Schema]] = {}
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

    def __init_subclass__(cls, agreement_type: AgreementType, **kwargs):
        cls._subclasses[agreement_type] = cls  # type: ignore [assignment]
        super().__init_subclass__(**kwargs)

    @classmethod
    def get_schema(cls, agreement_type: Optional[AgreementType] = None) -> Schema:
        try:
            return cls._schemas[agreement_type]
        except KeyError:
            cls._schemas[agreement_type] = desert.schema(cls._subclasses.get(agreement_type, AgreementData))
            return cls._schemas[agreement_type]

    @classmethod
    def get_class(cls, agreement_type: Optional[AgreementType] = None) -> type["AgreementData"]:
        try:
            return cls._subclasses[agreement_type]
        except KeyError:
            return AgreementData


@dataclass
class ContractAgreementData(AgreementData, agreement_type=AgreementType.CONTRACT):
    contract_number: Optional[str] = None
    vendor: Optional[str] = None
    delivered_status: Optional[bool] = fields.Boolean(default=False)
    contract_type: Optional[ContractType] = fields.Enum(ContractType)
    support_contacts: Optional[list[TeamMembers]] = fields.List(
        fields.Nested(TeamMembers),
        default=[],
    )


@dataclass
class GrantAgreementData(AgreementData, agreement_type=AgreementType.GRANT):
    foa: Optional[str] = None


@dataclass
class DirectAgreementData(AgreementData, agreement_type=AgreementType.DIRECT_ALLOCATION):
    pass


@dataclass
class IaaAgreementData(AgreementData, agreement_type=AgreementType.IAA):
    pass


@dataclass
class IaaAaAgreementData(AgreementData, agreement_type=AgreementType.IAA_AA):
    pass


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
                try:
                    req_type = request.json["agreement_type"]
                    if req_type != old_agreement.agreement_type.name:
                        raise ValueError(f"{req_type} != {old_agreement.agreement_type.name}")
                except (KeyError, ValueError) as e:
                    raise RuntimeError("Invalid agreement_type, agreement_type must not change") from e
                schema = AgreementData.get_schema(old_agreement.agreement_type)

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
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
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
                    raise RuntimeError(f"Invalid Agreement id: {id}.")
                # reject change of agreement_type
                try:
                    req_type = request.json.get("agreement_type", old_agreement.agreement_type.name)
                    if req_type != old_agreement.agreement_type.name:
                        raise ValueError(f"{req_type} != {old_agreement.agreement_type.name}")
                except (KeyError, ValueError) as e:
                    raise RuntimeError("Invalid agreement_type, agreement_type must not change") from e
                schema = AgreementData.get_schema(old_agreement.agreement_type)

                OPSMethodView._validate_request(
                    schema=schema,
                    message=f"{message_prefix}: Params failed validation:",
                    partial=True,
                )

                agreement_fields = set(f.name for f in dc_fields(AgreementData.get_class(old_agreement.agreement_type)))
                data = {k: v for k, v in request.json.items() if k in agreement_fields}
                agreement = update_agreement(data, old_agreement)
                agreement_dict = agreement.to_dict()
                meta.metadata.update({"updated_agreement": agreement_dict})
                current_app.logger.info(f"{message_prefix}: Updated Agreement: {agreement_dict}")

                return make_response_with_headers({"message": "Agreement updated", "id": agreement.id}, 200)
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"{message_prefix}: {se}")
            return make_response_with_headers({}, 500)


class AgreementListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @staticmethod
    def _get_query(args):
        polymorphic_agreement = Agreement.get_polymorphic()
        stmt = select(polymorphic_agreement).order_by(Agreement.id)
        query_helper = QueryHelper(stmt)

        match args:
            case {"search": search, **filter_args} if not search:
                query_helper.return_none()

            case {"search": search, **filter_args}:
                query_helper.add_search(polymorphic_agreement.name, search)

            case {**filter_args}:
                pass

        for key, value in filter_args.items():
            query_helper.add_column_equals(Agreement.get_class_field(key), value)

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

                try:
                    agreement_type = AgreementType[request.json["agreement_type"]]
                except KeyError:
                    raise ValueError("Invalid agreement_type")

                current_app.logger.info(agreement_type.name)
                errors = AgreementData.get_schema(agreement_type).validate(request.json)
                self.check_errors(errors)

                data = AgreementData.get_schema(agreement_type).load(request.json)
                new_agreement = self._create_agreement(data, Agreement.get_class(agreement_type))

                token = verify_jwt_in_request()
                user = get_user_from_token(token[1])
                new_agreement.created_by = user.id

                current_app.db_session.add(new_agreement)
                current_app.db_session.commit()

                new_agreement_dict = new_agreement.to_dict()
                meta.metadata.update({"New Agreement": new_agreement_dict})
                current_app.logger.info(f"POST to {ENDPOINT_STRING}: New Agreement created: {new_agreement_dict}")

                return make_response_with_headers({"message": "Agreement created", "id": new_agreement.id}, 201)
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
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


def _get_user_list(data: Any):
    tmp_ids = []
    if data:
        for item in data:
            try:
                tmp_ids.append(item.id)
            except AttributeError:
                tmp_ids.append(item["id"])
    if tmp_ids:
        return [current_app.db_session.get(User, tm_id) for tm_id in tmp_ids]


def update_data(agreement: Agreement, data: dict[str, Any]) -> None:
    for item in data:
        if item in {"agreement_type", "agreement_reason"}:
            pass
        elif item not in {"team_members", "support_contacts"}:
            setattr(agreement, item, data[item])

        elif item == "team_members":
            tmp_team_members = _get_user_list(data[item])
            if tmp_team_members:
                agreement.team_members = tmp_team_members

        elif item == "support_contacts":
            tmp_support_contacts = _get_user_list(data[item])
            if tmp_support_contacts:
                agreement.support_contacts = tmp_support_contacts


def update_agreement(data: dict[str, Any], agreement: Agreement):
    update_data(agreement, data)
    current_app.db_session.add(agreement)
    current_app.db_session.commit()
    return agreement
