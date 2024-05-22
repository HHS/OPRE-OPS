from datetime import date

from flask import current_app
from marshmallow import EXCLUDE, Schema, ValidationError, fields, validates_schema
from marshmallow_enum import EnumField

from models import AgreementReason, BudgetLineItem, BudgetLineItemStatus, ServicesComponent
from ops_api.ops.schemas.users import SafeUserSchema


class Missing:
    pass


class RequestBodySchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    status = EnumField(BudgetLineItemStatus, ZZZ_missing=Missing, default=None, allow_none=True)
    line_description = fields.Str(ZZZ_missing=Missing, default=None, allow_none=True)
    can_id = fields.Int(ZZZ_missing=Missing, default=None, allow_none=True)
    amount = fields.Float(ZZZ_missing=Missing, default=None, allow_none=True)
    date_needed = fields.Date(ZZZ_missing=Missing, default=None, allow_none=True)
    comments = fields.Str(ZZZ_missing=Missing, default=None, allow_none=True)
    proc_shop_fee_percentage = fields.Float(ZZZ_missing=Missing, default=None, allow_none=True)
    services_component_id = fields.Int(ZZZ_missing=Missing, default=None, allow_none=True)

    @validates_schema
    def validate_agreement_id(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and not bli.agreement_id and not data.get("agreement_id"):
                raise ValidationError("BLI must have an Agreement when status is not DRAFT")

    @validates_schema
    def validate_project_id(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.project_id:
                raise ValidationError("BLI's Agreement must have a Project when status is not DRAFT")

    @validates_schema
    def validate_agreement_type(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.agreement_type:
                raise ValidationError("BLI's Agreement must have an AgreementType when status is not DRAFT")

    @validates_schema
    def validate_agreement_description(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.description:
                raise ValidationError("BLI's Agreement must have a Description when status is not DRAFT")

    @validates_schema
    def validate_product_service_code(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.product_service_code_id:
                raise ValidationError("BLI's Agreement must have a ProductServiceCode when status is not DRAFT")

    @validates_schema
    def validate_procurement_shop(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.procurement_shop_id:
                raise ValidationError("BLI's Agreement must have a ProcurementShop when status is not DRAFT")

    @validates_schema
    def validate_agreement_reason(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.agreement_reason:
                raise ValidationError("BLI's Agreement must have an AgreementReason when status is not DRAFT")

    @validates_schema
    def validate_agreement_reason_must_not_have_incumbent(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if (
                bli
                and bli.agreement_id
                and bli.agreement.agreement_reason == AgreementReason.NEW_REQ
                and bli.agreement.incumbent_id
            ):
                raise ValidationError(
                    "BLI's Agreement cannot have an Incumbent if it has an Agreement Reason of NEW_REQ"
                )

    @validates_schema
    def validate_agreement_reason_must_have_incumbent(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
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
    def validate_project_officer(self, data, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.project_officer:
                raise ValidationError("BLI's Agreement must have a ProjectOfficer when status is not DRAFT")

    @validates_schema
    def validate_need_by_date(self, data: dict, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            bli_date_needed = bli.date_needed if bli else None
            data_date_needed = data.get("date_needed")
            msg = "BLI must valid a valid Need By Date when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and self.is_invalid_full(
                bli_date_needed, data_date_needed
            ):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and self.is_invalid_partial(bli_date_needed, data_date_needed):
                raise ValidationError(msg)

    @validates_schema
    def validate_need_by_date_in_the_future(self, data: dict, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            bli_date_needed = bli.date_needed if bli else None
            data_date_needed = data.get("date_needed")
            today = date.today()
            msg = "BLI must valid a Need By Date in the future when status is not DRAFT"
            if (data_date_needed and data_date_needed <= today) or (
                not data_date_needed and bli_date_needed and bli_date_needed <= today
            ):
                raise ValidationError(msg)

    @validates_schema
    def validate_can(self, data: dict, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            bli_can_id = bli.can_id if bli else None
            data_can_id = data.get("can_id")
            msg = "BLI must have a valid CAN when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and self.is_invalid_full(bli_can_id, data_can_id):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and self.is_invalid_partial(bli_can_id, data_can_id):
                raise ValidationError(msg)

    @validates_schema
    def validate_amount(self, data: dict, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            bli_amount = bli.amount if bli else None
            data_amount = data.get("amount")
            msg = "BLI must have a valid Amount when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and self.is_invalid_full(bli_amount, data_amount):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and self.is_invalid_partial(bli_amount, data_amount):
                raise ValidationError(msg)

    @validates_schema
    def validate_amount_greater_than_zero(self, data: dict, **kwargs):
        if self.target_status_is_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            bli_amount = bli.amount if bli else None
            data_amount = data.get("amount")
            msg = "BLI must be a valid Amount (greater than zero) when status is not DRAFT"
            if (
                (data_amount is None and bli_amount is not None and bli_amount <= 0)
                or (data_amount is not None and data_amount <= 0)
                or (bli_amount is not None and bli_amount <= 0 and data_amount is not None and data_amount <= 0)
            ):
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

    # ...

    def is_changing_status(self, data: dict) -> bool:
        # status defaults to EnumField so the isinstance is checking for if status has been set
        status = data.get("status") if not isinstance(data.get("status"), EnumField) else None
        return status and status != BudgetLineItemStatus.DRAFT

    def get_target_status(self, data):
        target_status = data.get("status") if not isinstance(data.get("status"), EnumField) else None
        if target_status:
            return target_status
        current_bli = self.get_current_budget_line_item()
        if current_bli:
            return current_bli.status
        return None

    def target_status_is_beyond_draft(self, data):
        return self.is_changing_status(data)
        # target_status = self.get_target_status(data)
        # return target_status and target_status != BudgetLineItemStatus.DRAFT

    def get_current_budget_line_item(self):
        return current_app.db_session.get(BudgetLineItem, self.context.get("id"))

    def is_invalid_full(self, bli_data, request_data) -> bool:
        if isinstance(request_data, str):
            return self.is_invalid_partial(bli_data, request_data) or (request_data and len(request_data.strip()) == 0)
        else:
            return self.is_invalid_partial(bli_data, request_data) or not request_data

    def is_invalid_partial(self, bli_data, request_data) -> bool:
        if isinstance(bli_data, str):
            return (
                (not request_data and not bli_data)
                or (bli_data and len(bli_data.strip()) == 0 and request_data and len(request_data.strip()) == 0)
                or (not request_data and bli_data and len(bli_data.strip()) == 0)
            )
        else:
            return not request_data and not bli_data


class POSTRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(required=True)  # agreement_id is required for POST


class PATCHRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(
        ZZZ_missing=Missing, default=None, allow_none=True
    )  # agreement_id (and all params) are optional for PATCH


class QueryParametersSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    can_id = fields.Int(ZZZ_missing=Missing, default=None, allow_none=True)
    agreement_id = fields.Int(ZZZ_missing=Missing, default=None, allow_none=True)
    status = EnumField(BudgetLineItemStatus, ZZZ_missing=Missing, default=None, allow_none=True)


class BLITeamMembersSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
    full_name = fields.Str(ZZZ_missing=Missing, default=None, allow_none=True)
    email = fields.Str(ZZZ_missing=Missing, default=None, allow_none=True)


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
    created_by_user = fields.Nested(SafeUserSchema(), ZZZ_missing=Missing, default=None, allow_none=True)
    created_on = fields.DateTime(required=True)


class BudgetLineItemResponseSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
    agreement_id = fields.Int(required=True)
    can_id = fields.Int(required=True)
    amount = fields.Float(required=True)
    created_by = fields.Int(required=True)
    line_description = fields.Str(required=True)
    status = EnumField(BudgetLineItemStatus, required=True)
    comments = fields.Str(ZZZ_missing=Missing, default=None, allow_none=True)
    proc_shop_fee_percentage = fields.Float(ZZZ_missing=Missing, default=None, allow_none=True)
    created_on = fields.DateTime(required=True)
    updated_on = fields.DateTime(required=True)
    date_needed = fields.Date(required=True)
    portfolio_id = fields.Int(ZZZ_missing=Missing, default=None, allow_none=True)
    fiscal_year = fields.Int(ZZZ_missing=Missing, default=None, allow_none=True)
    team_members = fields.Nested(BLITeamMembersSchema(), many=True, ZZZ_missing=Missing, default=None, allow_none=True)
    has_active_workflow = fields.Bool(required=True)
    services_component_id = fields.Int(ZZZ_missing=Missing, default=None, allow_none=True)
    in_review = fields.Bool(required=True)
    change_requests_in_review = fields.Nested(
        BudgetLineItemChangeRequestSchema(), many=True, ZZZ_missing=Missing, default=None, allow_none=True
    )
