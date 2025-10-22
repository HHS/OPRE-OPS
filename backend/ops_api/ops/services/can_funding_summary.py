from typing import List, Optional

from models import CANMethodOfTransfer
from ops_api.ops.utils.cans import aggregate_funding_summaries, get_can_funding_summary, get_filtered_cans


class CANFundingSummaryService:
    def apply_filters_and_return(
        self,
        cans: list,
        fiscal_year: str = None,
        active_period: list = None,
        transfer: list = None,
        portfolio: list = None,
        fy_budget: list = None,
    ) -> dict:
        # Filter cans based on the provided parameters
        cans_with_filters = get_filtered_cans(
            cans,
            int(fiscal_year) if fiscal_year else None,
            active_period,
            transfer,
            portfolio,
            fy_budget,
        )
        # Generate funding summaries for each filtered CAN
        can_funding_summaries = [
            get_can_funding_summary(can, int(fiscal_year) if fiscal_year else None)
            for can in cans_with_filters
        ]
        # Aggregate and return the final summary
        aggregated_summary = aggregate_funding_summaries(can_funding_summaries)
        return aggregated_summary

    def get_single_can(self, can: dict, fiscal_year: Optional[str] = None) -> dict:
        # Get funding summary for a single CAN
        can_funding_summary = get_can_funding_summary(
            can, int(fiscal_year) if fiscal_year else None
        )
        return can_funding_summary

    def get_all_cans(
        self,
        cans: List[dict],
        fiscal_year: Optional[str] = None,
        active_period: Optional[List[int]] = None,
        transfer: Optional[List[str]] = None,
        portfolio: Optional[List[str]] = None,
        fy_budget: Optional[List[int]] = None,
    ) -> dict:
        return self.apply_filters_and_return(
            cans, fiscal_year, active_period, transfer, portfolio, fy_budget
        )

    def get_list(
        self, cans, fiscal_year, active_period, transfer, portfolio, fy_budget
    ) -> dict:
        return self.apply_filters_and_return(
            cans, fiscal_year, active_period, transfer, portfolio, fy_budget
        )

    @staticmethod
    def get_mapped_transfer_value(
        transfer: list[str],
    ) -> tuple[bool, Optional[List[CANMethodOfTransfer]]]:
        try:
            transfer = [CANMethodOfTransfer[t] for t in transfer]
        except KeyError:
            return False, None
        if not transfer:
            return False, None
        return True, transfer
