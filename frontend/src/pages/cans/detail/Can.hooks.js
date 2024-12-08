import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useGetCanByIdQuery, useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { getTypesCounts } from "./Can.helpers";
import { NO_DATA } from "../../../constants";

export default function useCan() {
    /**
     *  @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
     */

    const selectedFiscalYear = useSelector((state) => state.canDetail.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);
    const urlPathParams = useParams();
    const canId = parseInt(urlPathParams.id ?? "-1");
    /** @type {{data?: CAN | undefined, isLoading: boolean}} */
    const { data: can, isLoading } = useGetCanByIdQuery(canId);
    const { data: CANFunding, isLoading: CANFundingLoading } = useGetCanFundingSummaryQuery({
        ids: [canId],
        fiscalYear: fiscalYear
    });

    const budgetLineItemsByFiscalYear = React.useMemo(() => {
        if (!fiscalYear || !can) return [];

        return can?.budget_line_items?.filter((bli) => bli.fiscal_year === fiscalYear) ?? [];
    }, [can, fiscalYear]);

    const fundingReceivedByFiscalYear = React.useMemo(() => {
        if (!fiscalYear || !can) return [];

        return can?.funding_received?.filter((fr) => fr.fiscal_year === fiscalYear) ?? [];
    }, [can, fiscalYear]);

    const projectTypesCount = React.useMemo(
        () => (can ? getTypesCounts(can.projects ?? [], "project_type") : []),
        [can]
    );

    const budgetLineTypesCount = React.useMemo(
        () => getTypesCounts(budgetLineItemsByFiscalYear, "status"),
        [budgetLineItemsByFiscalYear]
    );


    const budgetLineAgreements = can?.budget_line_items?.map(
        (item) => item.agreement
    ) ?? [];


    const agreementTypesCount = React.useMemo(
        () => getTypesCounts(budgetLineAgreements, "agreement_type"),
        [fiscalYear, can]
    );


    return {
        can: can ?? null,
        isLoading,
        canId,
        fiscalYear,
        CANFundingLoading,
        budgetLineItemsByFiscalYear,
        number: can?.number ?? NO_DATA,
        description: can?.description,
        nickname: can?.nick_name,
        fundingDetails: can?.funding_details ?? {},
        fundingBudgets: can?.funding_budgets ?? [],
        fundingReceivedByFiscalYear: fundingReceivedByFiscalYear,
        divisionId: can?.portfolio?.division_id ?? -1,
        teamLeaders: can?.portfolio?.team_leaders ?? [],
        portfolioName: can?.portfolio?.name,
        totalFunding: CANFunding?.total_funding,
        plannedFunding: CANFunding?.planned_funding,
        obligatedFunding: CANFunding?.obligated_funding,
        inExecutionFunding: CANFunding?.in_execution_funding,
        inDraftFunding: CANFunding?.in_draft_funding,
        expectedFunding: CANFunding?.expected_funding,
        receivedFunding: CANFunding?.received_funding,
        subTitle: can ? `${can.nick_name} - ${can.active_period} ${can.active_period > 1 ? "Years" : "Year"}` : "",
        projectTypesCount,
        budgetLineTypesCount,
        agreementTypesCount
    };
}
