from dataclasses import dataclass

from flask import Response, current_app, request
from flask_jwt_extended import verify_jwt_in_request
from marshmallow import Schema, ValidationError, fields
from models.base import BaseModel
from models.cans import BudgetLineItem
from models.workflows import BliPackage, BliPackageSnapshot
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy import desc
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from typing_extensions import override

ENDPOINT_STRING = "/approve"


@dataclass
class ApprovalSubmissionData(Schema):
    budget_line_item_ids: fields.List(fields.Int(), required=True)
    submitter_id: fields.Int(required=False)

    def __init__(self, *args, **kwargs):
        self.budget_line_item_ids = kwargs.get("budget_line_item_ids")
        self.submitter_id = kwargs.get("submitter_id")
        super().__init__(*args, **kwargs)


class ApproveSubmisionListApi(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.POST, Permission.BLI_PACKAGE)
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        current_app.logger.info(f"********** /approve Request: {request.json}")
        try:
            # with OpsEventHandler(OpsEventHandler.CREATE_BLI_PACKAGE) as meta:

            # Using a dataclass schema for ApprovalSubmissionData, load data from request.json
            # data = ApprovalSubmissionData().load(data=request.json)

            submitter_id = request.json.get("submitter_id")
            budget_line_item_ids = request.json.get("budget_line_item_ids", [])
            submission_notes = request.json.get("notes")

            # Create new BliPackage
            new_bli_package = BliPackage()

            if submitter_id := request.json.get("submitter_id"):
                new_bli_package.submitter_id = submitter_id

            token = verify_jwt_in_request()
            user = get_user_from_token(token[1])
            new_bli_package.created_by = user.id
            new_bli_package.submitter_id = user.id
            new_bli_package.notes = submission_notes

            # Create BliPackageSnapshot
            # Handle budget_line_item IDs and create BliPackageSnapshot records
            for bli_id in budget_line_item_ids:
                bli = current_app.db_session.query(BudgetLineItem).get(bli_id)
                latest_version = bli.versions.order_by(desc("id")).first()
                current_app.logger.info(f"Latest version: {latest_version}")
                if bli:
                    new_bli_package.bli_package_snapshots.append(
                        BliPackageSnapshot(
                            bli_id=bli.id,
                            package_id=new_bli_package.id,
                            version=latest_version,
                        )
                    )
                    # current_app.db_session.add(snapshot)
                else:
                    raise ValueError(f"BudgetLineItem with ID {bli_id} does not exist.")
            # Create Workflow Step Instance

            # Update Workflow Step Instance
            new_bli_package.current_workflow_step_instance_id = 1

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
