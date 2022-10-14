"""
Type hint definitions to provide clarity for data.
"""
import typing


class FundingLineItem(typing.TypedDict):
    """Dict type hint for line items in total funding."""

    amount: float
    label: str


class TotalFunding(typing.TypedDict):
    """Dict type hint for total funding."""

    total_funding: FundingLineItem
    planned_funding: FundingLineItem
    obligated_funding: FundingLineItem
    in_execution_funding: FundingLineItem
    available_funding: FundingLineItem
