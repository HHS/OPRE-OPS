from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

from flask import current_app
from marshmallow import ValidationError, validates_schema
from marshmallow_enum import EnumField

from models import AgreementReason, BudgetLineItemStatus
from models.cans import BudgetLineItem, ServicesComponent

ENDPOINT_STRING = "/budget-line-items"


def is_changing_status(data: dict) -> bool:
    # status defaults to EnumField so the isinstance is checking for if status has been set
    status = data.get("status") if not isinstance(data.get("status"), EnumField) else None
    return status and status != BudgetLineItemStatus.DRAFT


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
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and not bli.agreement_id and not data.get("agreement_id"):
                raise ValidationError("BLI must have an Agreement when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_project_id(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.project_id:
                raise ValidationError("BLI's Agreement must have a Project when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_type(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.agreement_type:
                raise ValidationError("BLI's Agreement must have an AgreementType when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_description(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.description:
                raise ValidationError("BLI's Agreement must have a Description when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_product_service_code(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.product_service_code_id:
                raise ValidationError("BLI's Agreement must have a ProductServiceCode when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_procurement_shop(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.procurement_shop_id:
                raise ValidationError("BLI's Agreement must have a ProcurementShop when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_reason(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.agreement_reason:
                raise ValidationError("BLI's Agreement must have an AgreementReason when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_reason_must_not_have_incumbent(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
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
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
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
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.project_officer:
                raise ValidationError("BLI's Agreement must have a ProjectOfficer when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_need_by_date(self, data: dict, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            bli_date_needed = bli.date_needed if bli else None
            data_date_needed = data.get("date_needed")
            msg = "BLI must valid a valid Need By Date when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_date_needed, data_date_needed):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_date_needed, data_date_needed):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_need_by_date_in_the_future(self, data: dict, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
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
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            bli_can_id = bli.can_id if bli else None
            data_can_id = data.get("can_id")
            msg = "BLI must have a valid CAN when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_can_id, data_can_id):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_can_id, data_can_id):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_amount(self, data: dict, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            bli_amount = bli.amount if bli else None
            data_amount = data.get("amount")
            msg = "BLI must have a valid Amount when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_amount, data_amount):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_amount, data_amount):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_amount_greater_than_zero(self, data: dict, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
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
class BudgetLineItemResponse:
    id: int
    agreement_id: int
    can_id: int
    amount: float
    created_by: int
    line_description: str
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
