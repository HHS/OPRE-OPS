from __future__ import annotations

from datetime import date

from _decimal import Decimal
from flask import current_app
from marshmallow import EXCLUDE, Schema, ValidationError, fields, validates_schema
from marshmallow_enum import EnumField

from models import AgreementReason, BudgetLineItem, BudgetLineItemStatus, ContractAgreement, ServicesComponent
from ops_api.ops.schemas.users import SafeUserSchema


def is_blank(value) -> bool:
    if isinstance(value, str):
        return (not value) or (value and len(value.strip()) == 0)
    else:
        return not value


class RequestBodySchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    status = EnumField(BudgetLineItemStatus, default=None, allow_none=True)
    line_description = fields.Str(default=None, allow_none=True)
    can_id = fields.Int(default=None, allow_none=True)
    amount = fields.Float(default=None, allow_none=True)
    date_needed = fields.Date(default=None, allow_none=True)
    comments = fields.Str(default=None, allow_none=True)
    proc_shop_fee_percentage = fields.Float(default=None, allow_none=True)
    services_component_id = fields.Int(default=None, allow_none=True)

    def get_target_status(self, data):
        requested_status = data.get("status") if "status" in data else None
        if requested_status:
            return requested_status
        current_bli = self.get_current_budget_line_item()
        if current_bli:
            return current_bli.status
        return None

    def target_status_is_beyond_draft(self, data):
        target_status = self.get_target_status(data)
        return target_status and target_status != BudgetLineItemStatus.DRAFT

    def status_is_changing_beyond_draft(self, data):
        requested_status = data.get("status") if "status" in data else None
        if not requested_status or requested_status == BudgetLineItemStatus.DRAFT:
            return False
        current_bli = self.get_current_budget_line_item()
        current_status = current_bli.status if current_bli else None
        return requested_status != current_status

    def get_current_budget_line_item(self):
        return current_app.db_session.get(BudgetLineItem, self.context.get("id"))

    def get_target_value(self, key: str, data: dict) -> bool:
        requested_value = data.get(key)
        if self.context.get("method") in ["POST", "PUT"]:
            return requested_value
        if key in data:
            return requested_value
        current_budget_line_item = self.get_current_budget_line_item()
        if current_budget_line_item and hasattr(current_budget_line_item, key):
            return getattr(current_budget_line_item, key)
        return requested_value

    def should_validate_field(self, key: str, data: dict) -> bool:
        if self.status_is_changing_beyond_draft(data):
            return True
        if self.target_status_is_beyond_draft(data) and key in data:
            return True
        return False

    @validates_schema
    def validate_agreement_id(self, data, **kwargs):
        key = "agreement_id"
        if self.status_is_changing_beyond_draft(data):
            target_value = self.get_target_value(key, data)
            if not target_value:
                raise ValidationError("BLI must have an Agreement when status is not DRAFT")

    @validates_schema
    def validate_agreement_project_id(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.project_id:
                raise ValidationError("BLI's Agreement must have a Project when status is not DRAFT")

    @validates_schema
    def validate_agreement_type(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.agreement_type:
                raise ValidationError("BLI's Agreement must have an AgreementType when status is not DRAFT")

    @validates_schema
    def validate_agreement_description(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.description:
                raise ValidationError("BLI's Agreement must have a Description when status is not DRAFT")

    @validates_schema
    def validate_agreement_product_service_code(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.product_service_code_id:
                raise ValidationError("BLI's Agreement must have a ProductServiceCode when status is not DRAFT")

    @validates_schema
    def validate_agreement_procurement_shop(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.procurement_shop_id:
                raise ValidationError("BLI's Agreement must have a ProcurementShop when status is not DRAFT")

    @validates_schema
    def validate_agreement_reason(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.agreement_reason:
                raise ValidationError("BLI's Agreement must have an AgreementReason when status is not DRAFT")

    @validates_schema
    def validate_agreement_reason_must_not_have_incumbent(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if (
                bli
                and bli.agreement_id
                and isinstance(bli.agreement, ContractAgreement)  # only contracts have incumbents
                and bli.agreement.agreement_reason == AgreementReason.NEW_REQ
                and bli.agreement.incumbent_id
            ):
                raise ValidationError(
                    "BLI's Agreement cannot have an Incumbent if it has an Agreement Reason of NEW_REQ"
                )

    @validates_schema
    def validate_agreement_reason_must_have_incumbent(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
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

    @validates_schema
    def validate_agreement_project_officer(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.project_officer:
                raise ValidationError("BLI's Agreement must have a ProjectOfficer when status is not DRAFT")

    @validates_schema
    def validate_need_by_date(self, data: dict, **kwargs):
        key = "date_needed"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            msg = "BLI must valid a valid Need By Date when status is not DRAFT"
            if is_blank(target_value):
                raise ValidationError(msg)

    @validates_schema
    def validate_need_by_date_in_the_future(self, data: dict, **kwargs):
        key = "date_needed"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            today = date.today()
            msg = "BLI must valid a Need By Date in the future when status is not DRAFT"
            if isinstance(target_value, date) and target_value <= today:
                raise ValidationError(msg)

    @validates_schema
    def validate_can(self, data: dict, **kwargs):
        key = "can_id"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            msg = "BLI must have a valid CAN when status is not DRAFT"
            if not target_value:
                raise ValidationError(msg)

    @validates_schema
    def validate_amount(self, data: dict, **kwargs):
        key = "amount"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            msg = "BLI must have a valid Amount when status is not DRAFT"
            if target_value is None:
                raise ValidationError(msg)

    @validates_schema
    def validate_amount_greater_than_zero(self, data: dict, **kwargs):
        key = "amount"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            msg = "BLI must be a valid Amount (greater than zero) when status is not DRAFT"
            if isinstance(target_value, (Decimal, float, int)) and (target_value <= 0):
                raise ValidationError(msg)

    @validates_schema
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


class POSTRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(required=True)  # agreement_id is required for POST


class PATCHRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(default=None, allow_none=True)  # agreement_id (and all params) are optional for PATCH


class QueryParametersSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    can_id = fields.Int(default=None, allow_none=True)
    agreement_id = fields.Int(default=None, allow_none=True)
    status = EnumField(BudgetLineItemStatus, default=None, allow_none=True)


class BLITeamMembersSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
    full_name = fields.Str(default=None, allow_none=True)
    email = fields.Str(default=None, allow_none=True)


class BudgetLineItemChangeRequestSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
    type = fields.Str(required=True)
    budget_line_item_id = fields.Int(required=True)
    has_budget_change = fields.Bool(required=True)
    has_status_change = fields.Bool(required=True)
    requested_change_data = fields.Dict(required=True)
    requested_change_diff = fields.Dict(required=True)
    created_by = fields.Int(required=True)
    created_by_user = fields.Nested(SafeUserSchema(), default=None, allow_none=True)
    created_on = fields.DateTime(required=True)
    managing_division_id = fields.Int(required=True, default=None, allow_none=True)


class BudgetLineItemCANSchema(Schema):
    id = fields.Int(required=True)
    display_name = fields.Str(required=True)
    number = fields.Str(required=True)
    description = fields.Str(required=True)
    purpose = fields.Str(required=True)
    nickname = fields.Str(required=True)
    appropriation_term = fields.Int(required=True)
    authorizer_id = fields.Int(required=True)
    managing_portfolio_id = fields.Int(required=True)
    expiration_date = fields.DateTime(default=None, allow_none=True, format="%Y-%m-%dT%H:%M:%S.%fZ")
    appropriation_date = fields.DateTime(default=None, allow_none=True, format="%Y-%m-%dT%H:%M:%S.%fZ")


class BudgetLineItemResponseSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
    agreement_id = fields.Int(required=True)
    can = fields.Nested(BudgetLineItemCANSchema, required=True)
    can_id = fields.Int(required=True)
    services_component_id = fields.Int(default=None, allow_none=True)
    amount = fields.Float(required=True)
    created_by = fields.Int(required=True)
    line_description = fields.Str(required=True)
    status = EnumField(BudgetLineItemStatus, required=True)
    comments = fields.Str(default=None, allow_none=True)
    proc_shop_fee_percentage = fields.Float(default=None, allow_none=True)
    created_on = fields.DateTime(required=True)
    updated_on = fields.DateTime(required=True)
    date_needed = fields.Date(required=True)
    portfolio_id = fields.Int(default=None, allow_none=True)
    fiscal_year = fields.Int(default=None, allow_none=True)
    team_members = fields.Nested(BLITeamMembersSchema(), many=True, default=None, allow_none=True)
    has_active_workflow = fields.Bool(required=True)
    active_workflow_current_step_id = fields.Int(default=None, allow_none=True)
    in_review = fields.Bool(required=True)
    change_requests_in_review = fields.Nested(
        BudgetLineItemChangeRequestSchema(), many=True, default=None, allow_none=True
    )
