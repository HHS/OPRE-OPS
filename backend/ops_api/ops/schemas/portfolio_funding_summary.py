from marshmallow import Schema, ValidationError, fields, validates

from ops_api.ops.schemas.cans import DivisionSchema


class RequestSchema(Schema):
    # All fields are wrapped in List due to Flask query param parsing with flat=False
    fiscal_year = fields.List(fields.Integer(), allow_none=True)
    portfolio_ids = fields.List(fields.Integer(), allow_none=True)
    budget_min = fields.List(fields.Float(), allow_none=True)
    budget_max = fields.List(fields.Float(), allow_none=True)
    available_pct = fields.List(fields.String(), allow_none=True)

    @validates("available_pct")
    def validate_available_pct(self, value, **kwargs):
        """Validate that available_pct contains only valid range codes."""
        if value:
            valid_ranges = {"over90", "75-90", "50-75", "25-50", "under25"}
            invalid = set(value) - valid_ranges
            if invalid:
                raise ValidationError(
                    f"Invalid available_pct range codes: {invalid}. "
                    f"Valid codes are: {', '.join(sorted(valid_ranges))}"
                )


class FundingLineItem(Schema):
    amount = fields.Float(required=True)
    percent = fields.String(required=True)


class ResponseSchema(Schema):
    total_funding = fields.Nested(FundingLineItem)
    carry_forward_funding = fields.Nested(FundingLineItem)
    planned_funding = fields.Nested(FundingLineItem)
    obligated_funding = fields.Nested(FundingLineItem)
    in_execution_funding = fields.Nested(FundingLineItem)
    available_funding = fields.Nested(FundingLineItem)
    draft_funding = fields.Nested(FundingLineItem)
    new_funding = fields.Nested(FundingLineItem)


class PortfolioFundingSummaryItem(Schema):
    """Schema for a single portfolio with funding summary"""

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbreviation = fields.String(allow_none=True)
    division_id = fields.Integer(required=True)
    division = fields.Nested(DivisionSchema, allow_none=True)
    total_funding = fields.Nested(FundingLineItem)
    carry_forward_funding = fields.Nested(FundingLineItem)
    planned_funding = fields.Nested(FundingLineItem)
    obligated_funding = fields.Nested(FundingLineItem)
    in_execution_funding = fields.Nested(FundingLineItem)
    available_funding = fields.Nested(FundingLineItem)
    draft_funding = fields.Nested(FundingLineItem)
    new_funding = fields.Nested(FundingLineItem)


class ResponseListSchema(Schema):
    """Schema for list of portfolios with funding summaries"""

    portfolios = fields.List(fields.Nested(PortfolioFundingSummaryItem))
