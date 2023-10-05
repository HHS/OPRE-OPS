from contextlib import suppress
from dataclasses import dataclass
from dataclasses import fields as dc_fields
from typing import Optional

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from marshmallow import ValidationError, fields
from models import DirectAgreement, GrantAgreement, IaaAaAgreement, IaaAgreement, OpsEventType, User
from models.base import BaseModel
from models.cans import (
    Agreement,
    AgreementReason,
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ProductServiceCode,
)
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, OPSMethodView
from ops_api.ops.dataclass_schemas.agreements import (
    ContractAgreementData,
    DirectAgreementData,
    GrantAgreementData,
    IaaAaAgreementData,
    IaaAgreementData,
)
from ops_api.ops.dataclass_schemas.team_members import TeamMembers
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from sqlalchemy.future import select
from typing_extensions import Any, override

ENDPOINT_STRING = "/agreements"


AGREEMENT_TYPE_TO_CLASS_MAPPING = {
    AgreementType.CONTRACT: ContractAgreement,
    AgreementType.GRANT: GrantAgreement,
    AgreementType.IAA: IaaAgreement,
    AgreementType.DIRECT_ALLOCATION: DirectAgreement,
    AgreementType.IAA_AA: IaaAaAgreement,
}


AGREEMENT_TYPE_TO_DATACLASS_MAPPING = {
    AgreementType.CONTRACT: ContractAgreementData,
    AgreementType.GRANT: GrantAgreementData,
    AgreementType.IAA: IaaAgreementData,
    AgreementType.DIRECT_ALLOCATION: DirectAgreementData,
    AgreementType.IAA_AA: IaaAaAgreementData,
}

AGREEMENTS_REQUEST_SCHEMAS = {
    AgreementType.CONTRACT: mmdc.class_schema(AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.CONTRACT))(),
    AgreementType.GRANT: mmdc.class_schema(AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.GRANT))(),
    AgreementType.IAA: mmdc.class_schema(AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.IAA))(),
    AgreementType.DIRECT_ALLOCATION: mmdc.class_schema(
        AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.DIRECT_ALLOCATION)
    )(),
    AgreementType.IAA_AA: mmdc.class_schema(AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.IAA_AA))(),
}


@dataclass
class AgreementResponse:
    id: int
    type: str
    name: str
    created_by: int
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


def associated_with_agreement(self, id: int) -> bool:
    jwt_identity = get_jwt_identity()
    agreement_stmt = select(Agreement).where(Agreement.id == id)
    agreement = current_app.db_session.scalar(agreement_stmt)

    oidc_ids = set()
    if agreement.created_by_user:
        oidc_ids.add(str(agreement.created_by_user.oidc_id))
    if agreement.project_officer_user:
        oidc_ids.add(str(agreement.project_officer_user.oidc_id))
    oidc_ids |= set(str(tm.oidc_id) for tm in agreement.team_members)

    ret = jwt_identity in oidc_ids

    return ret


class AgreementItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)
        return response

    @override
    @is_authorized(PermissionType.PUT, Permission.AGREEMENT)
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"

        try:
            with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
                old_agreement: Agreement = self._get_item(id)
                if not old_agreement:
                    raise RuntimeError("Invalid Agreement id.")
                elif any(bli.status == BudgetLineItemStatus.IN_EXECUTION for bli in old_agreement.budget_line_items):
                    raise RuntimeError(f"Agreement {id} has budget line items in executing status.")
                # reject change of agreement_type
                # for PUT, it must exist in request
                try:
                    req_type = request.json["agreement_type"]
                    if req_type != old_agreement.agreement_type.name:
                        raise ValueError(f"{req_type} != {old_agreement.agreement_type.name}")
                except (KeyError, ValueError) as e:
                    raise RuntimeError("Invalid agreement_type, agreement_type must not change") from e

                schema = AGREEMENTS_REQUEST_SCHEMAS.get(old_agreement.agreement_type)

                OPSMethodView._validate_request(
                    schema=schema,
                    message=f"{message_prefix}: Params failed validation:",
                )

                data = schema.dump(schema.load(request.json))
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
    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    def patch(self, id: int) -> Response:
        message_prefix = f"PATCH to {ENDPOINT_STRING}"

        try:
            with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
                old_agreement: Agreement = self._get_item(id)
                if not old_agreement:
                    raise RuntimeError(f"Invalid Agreement id: {id}.")
                elif any(bli.status == BudgetLineItemStatus.IN_EXECUTION for bli in old_agreement.budget_line_items):
                    raise RuntimeError(f"Agreement {id} has budget line items in executing status.")
                # reject change of agreement_type
                try:
                    req_type = request.json.get("agreement_type", old_agreement.agreement_type.name)
                    if req_type != old_agreement.agreement_type.name:
                        raise ValueError(f"{req_type} != {old_agreement.agreement_type.name}")
                except (KeyError, ValueError) as e:
                    raise RuntimeError("Invalid agreement_type, agreement_type must not change") from e

                schema = AGREEMENTS_REQUEST_SCHEMAS.get(old_agreement.agreement_type)

                OPSMethodView._validate_request(
                    schema=schema,
                    message=f"{message_prefix}: Params failed validation:",
                    partial=True,
                )

                agreement_fields = set(
                    f.name for f in dc_fields(AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(old_agreement.agreement_type))
                )

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

    @override
    @is_authorized(
        PermissionType.DELETE,
        Permission.AGREEMENT,
        extra_check=associated_with_agreement,
    )
    def delete(self, id: int) -> Response:
        message_prefix = f"DELETE from {ENDPOINT_STRING}"

        try:
            with OpsEventHandler(OpsEventType.DELETE_AGREEMENT) as meta:
                agreement: Agreement = self._get_item(id)

                if not agreement:
                    raise RuntimeError(f"Invalid Agreement id: {id}.")
                elif agreement.agreement_type != AgreementType.CONTRACT:
                    raise RuntimeError(f"Invalid Agreement type: {agreement.agreement_type}.")
                elif any(bli.status != BudgetLineItemStatus.DRAFT for bli in agreement.budget_line_items):
                    raise RuntimeError(f"Agreement {id} has budget line items not in draft status.")

                current_app.db_session.delete(agreement)
                current_app.db_session.commit()

                meta.metadata.update({"Deleted Agreement": id})

                return make_response_with_headers({"message": "Agreement deleted", "id": agreement.id}, 200)

        except RuntimeError as e:
            return make_response_with_headers({"message": f"{type(e)}: {e!s}", "id": agreement.id}, 400)

        except SQLAlchemyError as se:
            current_app.logger.error(f"{message_prefix}: {se}")
            return make_response_with_headers({}, 500)


class AgreementListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            IaaAaAgreement,
            DirectAgreement,
        ]
        result = []
        for agreement_cls in agreement_classes:
            result.extend(current_app.db_session.execute(self._get_query(agreement_cls, **request.args)).all())

        return make_response_with_headers([i.to_dict() for item in result for i in item])

    @override
    @is_authorized(PermissionType.POST, Permission.AGREEMENT)
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

                schema = AGREEMENTS_REQUEST_SCHEMAS.get(agreement_type)

                errors = schema.validate(request.json)
                self.check_errors(errors)

                data = schema.dump(schema.load(request.json))

                new_agreement = self._create_agreement(data, AGREEMENT_TYPE_TO_CLASS_MAPPING.get(agreement_type))

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
        tmp_team_members = data.get("team_members") if data.get("team_members") else []
        data["team_members"] = []

        if agreement_cls == ContractAgreement:
            tmp_support_contacts = data.get("support_contacts") if data.get("support_contacts") else []
            data["support_contacts"] = []

        new_agreement = agreement_cls(**data)

        new_agreement.team_members.extend(
            [current_app.db_session.get(User, tm_id.get("id")) for tm_id in tmp_team_members]
        )

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
    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        reasons = [item.name for item in AgreementReason]
        return make_response_with_headers(reasons)


class AgreementTypeListAPI(MethodView):
    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        return make_response_with_headers([e.name for e in AgreementType])


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
    changed = False
    for item in data:
        # subclass attributes won't have the old (deleted) value in get_history
        # unless they were loaded before setting
        _hack_to_fix_get_history = getattr(agreement, item)  # noqa: F841
        match (item):
            case "agreement_type":
                continue

            case "team_members":
                tmp_team_members = _get_user_list(data[item])
                agreement.team_members = tmp_team_members if tmp_team_members else []

            case "support_contacts":
                tmp_support_contacts = _get_user_list(data[item])
                agreement.support_contacts = tmp_support_contacts if tmp_support_contacts else []

            case "procurement_shop_id":
                if any(
                    [bli.status.value >= BudgetLineItemStatus.IN_EXECUTION.value for bli in agreement.budget_line_items]
                ):
                    raise ValueError(
                        "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."
                    )
                elif getattr(agreement, item) != data[item]:
                    setattr(agreement, item, data[item])
                    for bli in agreement.budget_line_items:
                        if bli.status.value <= BudgetLineItemStatus.PLANNED.value:
                            bli.proc_shop_fee_percentage = agreement.procurement_shop.fee
                    changed = True

            case _:
                if getattr(agreement, item) != data[item]:
                    setattr(agreement, item, data[item])
                    changed = True

    if changed:
        agreement.budget_line_items
        for bli in agreement.budget_line_items:
            with suppress(AttributeError):
                if bli.status.value <= BudgetLineItemStatus.PLANNED.value:
                    bli.status = BudgetLineItemStatus.DRAFT


def update_agreement(data: dict[str, Any], agreement: Agreement):
    update_data(agreement, data)
    current_app.db_session.add(agreement)
    current_app.db_session.commit()
    return agreement
