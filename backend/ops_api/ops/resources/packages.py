from contextlib import suppress
from dataclasses import dataclass
from typing import ClassVar, Optional

import desert
from flask import Response, current_app, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from marshmallow import Schema, ValidationError, fields
from models import OpsEventType, User
from models.base import BaseModel
from models.cans import AgreementType, BudgetLineItem, BudgetLineItemStatus
from models.workflows import BliPackage, Package, PackageType
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, OPSMethodView
from ops_api.ops.utils.auth import ExtraCheckError, Permission, PermissionType, is_authorized
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from sqlalchemy.future import select
from typing_extensions import Any, override

ENDPOINT_STRING = "/package"


@dataclass
class TeamMembers:
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None


@dataclass
class PackageData:
    _subclasses: ClassVar[dict[Optional[AgreementType], type["PackageData"]]] = {}
    _schemas: ClassVar[dict[Optional[AgreementType], Schema]] = {}
    package_type: PackageType = fields.Enum(PackageType)
    notes: Optional[str] = None
    current_workflow_step_instance_id: int = None

    def __init_subclass__(cls, package_type: PackageType, **kwargs):
        cls._subclasses[package_type] = cls  # type: ignore [assignment]
        super().__init_subclass__(**kwargs)

    @classmethod
    def get_schema(cls, package_type: Optional[PackageType] = None) -> Schema:
        try:
            return cls._schemas[package_type]
        except KeyError:
            cls._schemas[package_type] = desert.schema(cls._subclasses.get(package_type, PackageData))
            return cls._schemas[package_type]

    @classmethod
    def get_class(cls, package_type: Optional[PackageType] = None) -> type["PackageData"]:
        try:
            return cls._subclasses[package_type]
        except KeyError:
            return BliPackage


@dataclass
class PackageResponse:
    id: int
    current_workflow_step_instance_id: Optional[int] = None
    notes: Optional[str] = None
    package_type: PackageType = PackageType.BLI


@dataclass
class BliPackageData(PackageData, package_type=PackageType.BLI):
    submitter_id: int = None
    bli_package_snapshot_id: int = None
    package_type: PackageType = PackageType.BLI


@dataclass
class QueryParameters:
    search: Optional[str] = None
    bli_id: Optional[int] = None


def associated_with_agreement(self, id: int) -> bool:
    """
    Checks if the current user is associated with the Agreement.

    :param id: The ID of the Agreement.
    :return: True if the current user is associated with the Agreement, False otherwise.
    """
    jwt_identity = get_jwt_identity()
    agreement_stmt = select(BliPackage).where(BliPackage.id == id)
    agreement = current_app.db_session.scalar(agreement_stmt)

    oidc_ids = set()
    if agreement.created_by_user:
        oidc_ids.add(str(agreement.created_by_user.oidc_id))
    if agreement.project_officer_user:
        oidc_ids.add(str(agreement.project_officer_user.oidc_id))
    oidc_ids |= set(str(tm.oidc_id) for tm in agreement.team_members)

    ret = jwt_identity in oidc_ids

    return ret


def bli_associated_with_agreement(self, id: int, permission_type: PermissionType) -> bool:
    """
    Checks if a budget line item is associated with an agreement.

    :param id: The ID of the budget line item.
    :param permission_type: The type of permission (PUT or PATCH).
    :return: True if the budget line item is associated with an agreement, False otherwise.
    """
    jwt_identity = get_jwt_identity()
    try:
        agreement_id = request.json["agreement_id"]
        agreement_type = AgreementType[request.json["agreement_type"]]
        agreement_cls = BliPackage.get_class(agreement_type)
        agreement_id_field = agreement_cls.get_class_field("id")
        agreement_stmt = select(agreement_cls).where(agreement_id_field == agreement_id)
        agreement = current_app.db_session.scalar(agreement_stmt)

    except KeyError:
        budget_line_item_stmt = select(BudgetLineItem).where(BudgetLineItem.id == id)
        budget_line_item = current_app.db_session.scalar(budget_line_item_stmt)
        try:
            agreement = budget_line_item.agreement
        except AttributeError as e:
            # No BLI found in the DB. Erroring out.
            raise ExtraCheckError({}) from e

    if agreement is None:
        # We are faking a validation check at this point. We know there is no agreement associated with the BLI.
        # This is made to emulate the validation check from a marshmallow schema.
        if permission_type == PermissionType.PUT:
            raise ExtraCheckError(
                {
                    "_schema": ["BLI must have an Agreement when status is not DRAFT"],
                    "agreement_id": ["Missing data for required field."],
                }
            )
        elif permission_type == PermissionType.PATCH:
            raise ExtraCheckError({"_schema": ["BLI must have an Agreement when status is not DRAFT"]})
        else:
            raise ExtraCheckError({})
    oidc_ids = set()
    if agreement.created_by_user:
        oidc_ids.add(str(agreement.created_by_user.oidc_id))
    if agreement.project_officer_user:
        oidc_ids.add(str(agreement.project_officer_user.oidc_id))
    oidc_ids |= set(str(tm.oidc_id) for tm in agreement.team_members)

    ret = jwt_identity in oidc_ids

    return ret


class BliPackageItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = BliPackage):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)
        return response

    @override
    @is_authorized(PermissionType.PUT, Permission.BUDGET_LINE_ITEM)
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"

        try:
            with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
                old_bli_package: BliPackage = self._get_item(id)
                if not old_bli_package:
                    raise RuntimeError("Invalid Package id.")
                elif any(bli.status == BudgetLineItemStatus.IN_EXECUTION for bli in old_bli_package.budget_line_items):
                    raise RuntimeError(f"Agreement {id} has budget line items in executing status.")
                # reject change of agreement_type
                # for PUT, it must exist in request
                try:
                    req_type = request.json["agreement_type"]
                    if req_type != old_bli_package.agreement_type.name:
                        raise ValueError(f"{req_type} != {old_bli_package.agreement_type.name}")
                except (KeyError, ValueError) as e:
                    raise RuntimeError("Invalid agreement_type, agreement_type must not change") from e
                schema = BliPackageData.get_schema(old_bli_package.agreement_type)

                OPSMethodView._validate_request(
                    schema=schema,
                    message=f"{message_prefix}: Params failed validation:",
                )

                data = schema.load(request.json)
                data = data.__dict__
                package = update_package(data, old_bli_package)
                package_dict = package.to_dict()
                meta.metadata.update({"updated_agreement": package_dict})
                current_app.logger.info(f"{message_prefix}: Updated Agreement: {package_dict}")

                return make_response_with_headers({"message": "Agreement updated", "id": package.id}, 200)

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

    # @override
    # @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    # def patch(self, id: int) -> Response:
    #     message_prefix = f"PATCH to {ENDPOINT_STRING}"

    #     try:
    #         with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
    #             old_package: Package = self._get_item(id)
    #             if not old_package:
    #                 raise RuntimeError(f"Invalid Agreement id: {id}.")
    #             elif any(
    #                 bli.status == BudgetLineItemStatus.IN_EXECUTION
    #                 for bli in old_package.budget_line_items
    #             ):
    #                 raise RuntimeError(
    #                     f"Agreement {id} has budget line items in executing status."
    #                 )
    #             # reject change of agreement_type
    #             try:
    #                 req_type = request.json.get(
    #                     "agreement_type", old_package.agreement_type.name
    #                 )
    #                 if req_type != old_package.agreement_type.name:
    #                     raise ValueError(
    #                         f"{req_type} != {old_package.agreement_type.name}"
    #                     )
    #             except (KeyError, ValueError) as e:
    #                 raise RuntimeError(
    #                     "Invalid agreement_type, agreement_type must not change"
    #                 ) from e
    #             schema = PackageData.get_schema(old_package.agreement_type)

    #             OPSMethodView._validate_request(
    #                 schema=schema,
    #                 message=f"{message_prefix}: Params failed validation:",
    #                 partial=True,
    #             )

    #             agreement = update_package(data, old_package)
    #             agreement_dict = agreement.to_dict()
    #             meta.metadata.update({"updated_agreement": agreement_dict})
    #             current_app.logger.info(
    #                 f"{message_prefix}: Updated Agreement: {agreement_dict}"
    #             )

    #             return make_response_with_headers(
    #                 {"message": "Agreement updated", "id": agreement.id}, 200
    #             )
    #     except (KeyError, RuntimeError, PendingRollbackError) as re:
    #         current_app.logger.error(f"{message_prefix}: {re}")
    #         return make_response_with_headers({}, 400)
    #     except ValidationError as ve:
    #         # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
    #         current_app.logger.error(f"{message_prefix}: {ve}")
    #         return make_response_with_headers(ve.normalized_messages(), 400)
    #     except SQLAlchemyError as se:
    #         current_app.logger.error(f"{message_prefix}: {se}")
    #         return make_response_with_headers({}, 500)

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
                agreement: BliPackage = self._get_item(id)

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


class BliPackageListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = BliPackage):
        super().__init__(model)

    @staticmethod
    def _get_query(args):
        polymorphic_agreement = BliPackage.get_polymorphic()
        stmt = select(polymorphic_agreement).order_by(BliPackage.id)
        query_helper = QueryHelper(stmt)

        match args:
            case {"search": search, **filter_args} if not search:
                query_helper.return_none()

            case {"search": search, **filter_args}:
                query_helper.add_search(polymorphic_agreement.name, search)

            case {**filter_args}:
                pass  # Do nothing if only filters are provided

        for key, value in filter_args.items():
            with suppress(ValueError):
                query_helper.add_column_equals(BliPackage.get_class_field(key), value)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        stmt = self._get_query(request.args)

        result = current_app.db_session.execute(stmt).all()

        items = (i for item in result for i in item)

        response = make_response_with_headers([i.to_dict() for i in items])

        return response

    @override
    @is_authorized(PermissionType.POST, Permission.PACKAGE)
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
                errors = PackageData.get_schema(agreement_type).validate(request.json)
                self.check_errors(errors)

                data = PackageData.get_schema(agreement_type).load(request.json)
                new_agreement = self._create_agreement(data, BliPackage.get_class(agreement_type))

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

    def _create_agreement(self, data, package_cls):
        tmp_team_members = data.team_members if data.team_members else []
        data.team_members = []

        if package_cls == BliPackage:
            tmp_support_contacts = data.support_contacts if data.support_contacts else []
            data.support_contacts = []

        new_package = package_cls(**data.__dict__)

        new_package.team_members.extend([current_app.db_session.get(User, tm_id.id) for tm_id in tmp_team_members])

        if package_cls == BliPackage:
            new_package.support_contacts.extend(
                [current_app.db_session.get(User, tm_id.id) for tm_id in tmp_support_contacts]
            )

        return new_package

    def check_errors(self, errors):
        if errors:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")
            raise RuntimeError(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")


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


def update_data(agreement: BliPackage, data: dict[str, Any]) -> None:
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


def update_package(data: dict[str, Any], package: Package):
    update_data(package, data)
    current_app.db_session.add(package)
    current_app.db_session.commit()
    return package
