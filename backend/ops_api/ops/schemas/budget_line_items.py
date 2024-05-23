from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

from flask import current_app
from marshmallow import ValidationError, validates_schema
from marshmallow_enum import EnumField

from models import AgreementReason, BudgetLineItemStatus
from models.cans import BudgetLineItem, ServicesComponent
from ops_api.ops.schemas.users import SafeUser

ENDPOINT_STRING = "/budget-line-items"


def is_changing_status(data: dict) -> bool:
    # status defaults to EnumField so the isinstance is checking for if status has been set
    status = data.get("status") if not isinstance(data.get("status"), EnumField) else None
    return status and status != BudgetLineItemStatus.DRAFT


def get_current_budget_line_item(context: dict) -> Optional[BudgetLineItem]:
    return current_app.db_session.get(BudgetLineItem, context.get("id"))


def get_target_status(data: dict, context: dict) -> Optional[BudgetLineItemStatus]:
    target_status = data.get("status") if not isinstance(data.get("status"), EnumField) else None
    if target_status:
        return target_status
    current_bli = get_current_budget_line_item(context)
    if current_bli:
        return current_bli.status
    return None


def target_status_is_beyond_draft(data: dict, context: dict) -> bool:
    return is_changing_status(data)
    # target_status = get_target_status(data, context)
    # return target_status and target_status != BudgetLineItemStatus.DRAFT


def is_missing_required_value(current_value, update_requested: bool, requested_value) -> bool:
    target_value = requested_value if update_requested else current_value
    if isinstance(target_value, str):
        return target_value is None or (target_value and len(target_value.strip()) == 0)
    else:
        return target_value is None


def is_invalid_full(bli_data, request_data) -> bool:
    if isinstance(request_data, str):
        return is_invalid_partial(bli_data, request_data) or (request_data and len(request_data.strip()) == 0)
    else:
        return is_invalid_partial(bli_data, request_data) or not request_data


def is_invalid_partial(bli_data, request_data) -> bool:
    if isinstance(bli_data, str):
        return (
            (not request_data and not bli_data)
            or (bli_data and len(bli_data.strip()) == 0 and request_data and len(request_data.strip()) == 0)
            or (not request_data and bli_data and len(bli_data.strip()) == 0)
        )
    else:
        return not request_data and not bli_data


@dataclass(kw_only=True)
class RequestBody:
    status: Optional[BudgetLineItemStatus] = EnumField(BudgetLineItemStatus)
    line_description: Optional[str] = None
    can_id: Optional[int] = None
    amount: Optional[float] = None
    date_needed: Optional[date] = field(default=None, metadata={"format": "%Y-%m-%d"})
    comments: Optional[str] = None
    proc_shop_fee_percentage: Optional[float] = None
    services_component_id: Optional[int] = None

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_id(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if bli and not bli.agreement_id and not data.get("agreement_id"):
                raise ValidationError("BLI must have an Agreement when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_project_id(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if bli and bli.agreement_id and not bli.agreement.project_id:
                raise ValidationError("BLI's Agreement must have a Project when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_type(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if bli and bli.agreement_id and not bli.agreement.agreement_type:
                raise ValidationError("BLI's Agreement must have an AgreementType when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_description(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if bli and bli.agreement_id and not bli.agreement.description:
                raise ValidationError("BLI's Agreement must have a Description when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_product_service_code(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if bli and bli.agreement_id and not bli.agreement.product_service_code_id:
                raise ValidationError("BLI's Agreement must have a ProductServiceCode when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_procurement_shop(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if bli and bli.agreement_id and not bli.agreement.procurement_shop_id:
                raise ValidationError("BLI's Agreement must have a ProcurementShop when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_reason(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if bli and bli.agreement_id and not bli.agreement.agreement_reason:
                raise ValidationError("BLI's Agreement must have an AgreementReason when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_reason_must_not_have_incumbent(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if (
                bli
                and bli.agreement_id
                and bli.agreement.agreement_reason == AgreementReason.NEW_REQ
                and bli.agreement.incumbent_id
            ):
                raise ValidationError(
                    "BLI's Agreement cannot have an Incumbent if it has an Agreement Reason of NEW_REQ"
                )

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_reason_must_have_incumbent(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if (
                bli
                and bli.agreement_id
                and (
                    bli.agreement.agreement_reason == AgreementReason.RECOMPETE
                    or bli.agreement.agreement_reason == AgreementReason.LOGICAL_FOLLOW_ON
                )
                and not bli.agreement.incumbent_id
            ):
                raise ValidationError(
                    "BLI's Agreement must have an Incumbent if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON"
                )

    @validates_schema(skip_on_field_errors=False)
    def validate_project_officer(self, data, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            if bli and bli.agreement_id and not bli.agreement.project_officer:
                raise ValidationError("BLI's Agreement must have a ProjectOfficer when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_need_by_date(self, data: dict, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            bli_date_needed = bli.date_needed if bli else None
            data_date_needed = data.get("date_needed")
            msg = "BLI must valid a valid Need By Date when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_date_needed, data_date_needed):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_date_needed, data_date_needed):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_need_by_date_in_the_future(self, data: dict, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            bli_date_needed = bli.date_needed if bli else None
            data_date_needed = data.get("date_needed")
            today = date.today()
            msg = "BLI must valid a Need By Date in the future when status is not DRAFT"
            if (data_date_needed and data_date_needed <= today) or (
                not data_date_needed and bli_date_needed and bli_date_needed <= today
            ):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_can(self, data: dict, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            bli_can_id = bli.can_id if bli else None
            data_can_id = data.get("can_id")
            msg = "BLI must have a valid CAN when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_can_id, data_can_id):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_can_id, data_can_id):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_amount(self, data: dict, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            bli_amount = bli.amount if bli else None
            data_amount = data.get("amount")
            msg = "BLI must have a valid Amount when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_amount, data_amount):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_amount, data_amount):
                print(f"!!!!!!!!!! ~~~ validate_amount (PATCH) {msg} ~~~")
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_amount_greater_than_zero(self, data: dict, **kwargs):
        if target_status_is_beyond_draft(data, self.context):
            bli = get_current_budget_line_item(self.context)
            bli_amount = bli.amount if bli else None
            data_amount = data.get("amount")
            msg = "BLI must be a valid Amount (greater than zero) when status is not DRAFT"
            if (
                (data_amount is None and bli_amount is not None and bli_amount <= 0)
                or (bli_amount is None and data_amount is not None and data_amount <= 0)
                or (bli_amount is not None and bli_amount <= 0 and data_amount is not None and data_amount <= 0)
            ):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_services_component_id(self, data: dict, **kwargs):
        services_component_id = data.get("services_component_id")
        if services_component_id is not None:
            sc: ServicesComponent = current_app.db_session.get(ServicesComponent, services_component_id)
            if sc:
                sc_contract_agreement_id = sc.contract_agreement_id
                if self.context.get("method") in ["POST"]:
                    bli_agreement_id = data.get("agreement_id")
                else:
                    bli: BudgetLineItem = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
                    bli_agreement_id = bli.agreement_id if bli else None
                if sc_contract_agreement_id != bli_agreement_id:
                    raise ValidationError("The Services Component must belong to the same Agreement as the BLI")


@dataclass(kw_only=True)
class POSTRequestBody(RequestBody):
    agreement_id: int  # agreement_id is required for POST


@dataclass(kw_only=True)
class PATCHRequestBody(RequestBody):
    agreement_id: Optional[int] = None  # agreement_id (and all params) are optional for PATCH


@dataclass
class QueryParameters:
    can_id: Optional[int] = None
    agreement_id: Optional[int] = None
    status: Optional[BudgetLineItemStatus] = EnumField(BudgetLineItemStatus)


@dataclass
class BLITeamMembers:
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None


@dataclass
class BudgetLineItemChangeRequest:
    id: int
    type: str
    budget_line_item_id: int
    has_budget_change: bool
    has_status_change: bool
    requested_change_data: dict
    requested_change_diff: dict
    created_by: int
    created_by_user: Optional[SafeUser] = None
    created_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})


@dataclass
class BudgetLineItemCAN:
    id: int
    number: str
    description: str
    purpose: str
    nickname: str
    appropriation_term: int
    # arrangement_type: CANArrangementType
    authorizer_id: int
    managing_portfolio_id: int
    expiration_date: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    appropriation_date: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})


@dataclass
class BudgetLineItemResponse:
    id: int
    agreement_id: int
    can: BudgetLineItemCAN
    can_id: int
    amount: float
    created_by: int
    line_description: str
    active_workflow_current_step_id: Optional[int] = None
    status: BudgetLineItemStatus = EnumField(BudgetLineItemStatus)
    comments: Optional[str] = None
    proc_shop_fee_percentage: Optional[float] = None
    created_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    date_needed: date = field(default=None, metadata={"format": "%Y-%m-%d"})
    portfolio_id: Optional[int] = None
    fiscal_year: Optional[int] = None
    team_members: Optional[list[BLITeamMembers]] = field(default_factory=lambda: [])
    has_active_workflow: bool = False
    services_component_id: Optional[int] = None
    in_review: bool = False
    change_requests_in_review: Optional[list[BudgetLineItemChangeRequest]] = field(default_factory=lambda: [])
