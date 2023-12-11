from contextlib import suppress

from flask import Response, current_app, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from marshmallow import ValidationError
from models import OpsEventType
from models.base import BaseModel
from models.cans import AgreementType, BudgetLineItem, BudgetLineItemStatus
from models.workflows import BliPackage, BliPackageSnapshot, PackageType
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, OPSMethodView
from ops_api.ops.resources.packages import BliPackageData, PackageData
from ops_api.ops.utils.auth import ExtraCheckError, Permission, PermissionType, is_authorized
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from sqlalchemy.future import select
from typing_extensions import Any, override

ENDPOINT_STRING = "/bli-package"


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
    @is_authorized(PermissionType.GET, Permission.BLI_PACKAGE)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)
        return response

    @override
    @is_authorized(PermissionType.POST, Permission.BLI_PACKAGE)
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        current_app.logger.info(f"********** /bli-package Request: {request.json}")
        try:
            # with OpsEventHandler(OpsEventHandler.CREATE_BLI_PACKAGE) as meta:
            if "package_type" not in request.json:
                raise RuntimeError(f"{message_prefix}: Params failed validation")

            try:
                package_type = PackageType[request.json["package_type"]]
            except KeyError:
                raise ValueError("Invalid package_type")

            current_app.logger.info(package_type.name)
            errors = BliPackageData.get_schema(package_type).validate(request.json)
            self.check_errors(errors)

            data = BliPackageData.get_schema(package_type).load(request.json)
            new_bli_package = self._create_bli_package(data, BliPackage.get_class(package_type))

            token = verify_jwt_in_request()
            user = get_user_from_token(token[1])
            new_bli_package.created_by = user.id

            # Create Workflow Step Instance
            # Update Workflow Step Instance
            new_bli_package.current_workflow_step_instance_id = 1

            # Handle budget_line_item IDs and create BliPackageSnapshot records
            budget_line_item_ids = request.json.get("budget_line_item_ids", [])
            for bli_id in budget_line_item_ids:
                bli = current_app.db_session.query(BudgetLineItem).get(bli_id)
                if bli:
                    snapshot = BliPackageSnapshot(budget_line_item_id=bli.id, bli_package_id=new_bli_package.id)
                    current_app.db_session.add(snapshot)
                else:
                    raise ValueError(f"BudgetLineItem with ID {bli_id} does not exist.")

            current_app.db_session.add(new_bli_package)
            current_app.db_session.commit()

            new_bli_package_dict = new_bli_package.to_dict()
            # meta.metadata.update({"New Bli Package": new_bli_package_dict})
            current_app.logger.info(f"POST to {ENDPOINT_STRING}: New Bli Package created: {new_bli_package_dict}")

            return make_response_with_headers({"message": "Bli Package created", "id": new_bli_package.id}, 201)
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: {se}")
            return make_response_with_headers({}, 500)

    @override
    @is_authorized(PermissionType.PUT, Permission.BLI_PACKAGE)
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"

        try:
            with OpsEventHandler(OpsEventType.UPDATE_BLI_PACKAGE) as meta:
                old_bli_package: BliPackage = self._get_item(id)
                # if not old_bli_package:
                #     raise RuntimeError("Invalid BliPackage id.")
                # elif any(bli.status == BudgetLineItemStatus.IN_EXECUTION for bli in old_bli_package.budget_line_items):
                #     raise RuntimeError(f"BliPackage {id} has budget line items in executing status.")
                # # reject change of package_type
                # # for PUT, it must exist in request
                try:
                    req_type = request.json["package_type"]
                    if req_type != old_bli_package.package_type.name:
                        raise ValueError(f"{req_type} != {old_bli_package.package_type.name}")
                except (KeyError, ValueError) as e:
                    raise RuntimeError("Invalid package_type, package_type must not change") from e
                schema = PackageData.get_schema(old_bli_package.package_type)

                OPSMethodView._validate_request(
                    schema=schema,
                    message=f"{message_prefix}: Params failed validation:",
                )

                data = schema.load(request.json)
                data = data.__dict__
                bli_package = update_bli_package(data, old_bli_package)
                bli_package_dict = bli_package.to_dict()
                meta.metadata.update({"updated_bli_package": bli_package_dict})
                current_app.logger.info(f"{message_prefix}: Updated Agreement: {bli_package_dict}")

                return make_response_with_headers({"message": "BLI Package updated", "id": bli_package.id}, 200)

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
    @is_authorized(PermissionType.POST, Permission.BLI_PACKAGE)
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        current_app.logger.info(f"********** /bli-package Request: {request.json}")
        try:
            # with OpsEventHandler(OpsEventHandler.CREATE_BLI_PACKAGE) as meta:
            # if "package_type" not in request.json:
            #     raise RuntimeError(f"{message_prefix}: Params failed validation")

            # try:
            #     package_type = PackageType[request.json["package_type"]]
            # except KeyError:
            #     raise ValueError("Invalid package_type")

            # current_app.logger.info(package_type.name)
            # errors = BliPackageData.get_schema(package_type).validate(request.json)
            # self.check_errors(errors)
            package_type = PackageType.BLI
            data = BliPackageData.get_schema(package_type).load(request.json)
            new_bli_package = self._create_bli_package(data, BliPackage.get_class(package_type))

            if submitter_id := request.json.get("submitter_id"):
                new_bli_package.submitter_id = submitter_id

            token = verify_jwt_in_request()
            user = get_user_from_token(token[1])
            new_bli_package.created_by = user.id

            # Create Workflow Step Instance
            # Update Workflow Step Instance
            new_bli_package.current_workflow_step_instance_id = 1

            # Handle budget_line_item IDs and create BliPackageSnapshot records
            budget_line_item_ids = request.json.get("budget_line_item_ids", [])
            for bli_id in budget_line_item_ids:
                bli = current_app.db_session.query(BudgetLineItem).get(bli_id)
                if bli:
                    snapshot = BliPackageSnapshot(budget_line_item_id=bli.id, bli_package_id=new_bli_package.id)
                    current_app.db_session.add(snapshot)
                else:
                    raise ValueError(f"BudgetLineItem with ID {bli_id} does not exist.")

            current_app.db_session.add(new_bli_package)
            current_app.db_session.commit()

            new_bli_package_dict = new_bli_package.to_dict()
            # meta.metadata.update({"New Bli Package": new_bli_package_dict})
            current_app.logger.info(f"POST to {ENDPOINT_STRING}: New Bli Package created: {new_bli_package_dict}")

            return make_response_with_headers({"message": "Bli Package created", "id": new_bli_package.id}, 201)
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: {se}")
            return make_response_with_headers({}, 500)

    def _create_bli_package(self, data, package_cls):
        new_bli_package = package_cls(**data.__dict__)
        return new_bli_package

    def check_errors(self, errors):
        if errors:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")
            raise RuntimeError(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")


def update_data(bli_package: BliPackage, data: dict[str, Any]) -> None:
    changed = False
    for item in data:
        # subclass attributes won't have the old (deleted) value in get_history
        # unless they were loaded before setting
        _hack_to_fix_get_history = getattr(bli_package, item)  # noqa: F841
        match (item):
            case "package_type":
                continue

            case _:
                if getattr(bli_package, item) != data[item]:
                    setattr(bli_package, item, data[item])
                    changed = True

    if changed:
        bli_package.budget_line_items
        for bli in bli_package.budget_line_items:
            with suppress(AttributeError):
                if bli.status.value <= BudgetLineItemStatus.PLANNED.value:
                    bli.status = BudgetLineItemStatus.DRAFT


def update_bli_package(data: dict[str, Any], bli_package: BliPackage):
    update_data(bli_package, data)
    current_app.db_session.add(bli_package)
    current_app.db_session.commit()
    return bli_package
