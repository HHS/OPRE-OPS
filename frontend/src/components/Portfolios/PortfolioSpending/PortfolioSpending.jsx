import React, { useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    useGetPortfolioCansByIdQuery,
    useGetReportingSummaryQuery,
    useLazyGetBudgetLineItemQuery
} from "../../../api/opsAPI";
import CANBudgetLineTable from "../../CANs/CANBudgetLineTable";
import PortfolioSpendingTableLoading from "./PortfolioSpendingTableLoading";
import PortfolioBudgetSummary from "../PortfolioBudgetSummary";

const PortfolioSpending = () => {
    const [budgetLineItems, setBudgetLineItems] = React.useState([]);
    // NOTE: Portfolio 1 with FY 2021 is a good example to test this component
    const {
        portfolioId,
        fiscalYear,
        inDraftFunding,
        totalFunding,
        inExecutionFunding,
        obligatedFunding,
        plannedFunding
    } = useOutletContext();

    const {
        data: portfolioCans,
        isLoading: isCansLoading,
        isFetching: isCansFetching
    } = useGetPortfolioCansByIdQuery(
        {
            portfolioId,
            budgetFiscalYear: fiscalYear,
            includeInactive: true
        },
        {
            refetchOnMountOrArgChange: true
        }
    );

    const { data: reportingSummaryResponse } = useGetReportingSummaryQuery({
        fiscalYear,
        portfolioIds: [portfolioId]
    });

    const agreementSpendingData = reportingSummaryResponse?.spending;
    const reportingSummaryData = reportingSummaryResponse?.counts;

    const budgetLineIds = useMemo(
        () => [...new Set(portfolioCans?.flatMap((can) => can.budget_line_items) ?? [])],
        [portfolioCans]
    );

    // Lazy query hook
    const [trigger, { isLoading: isBudgetLineItemLoading }] = useLazyGetBudgetLineItemQuery();
    const fetchBudgetLineItems = useCallback(async () => {
        const promises = budgetLineIds.map((id) => {
            return trigger(id).unwrap();
        });
        try {
            const budgetLineItemsData = await Promise.all(promises);
            const budgetLineItemsByFiscalYear = budgetLineItemsData.filter(
                (item) => item.fiscal_year === fiscalYear || item.fiscal_year === null
            );
            setBudgetLineItems(budgetLineItemsByFiscalYear);
        } catch (error) {
            console.error("Failed to fetch budgetLineItems:", error);
        }
    }, [budgetLineIds, fiscalYear, trigger]);

    // When switching tabs components gets remounted, and while budgetLineIds are cached, useCallback still runs and fetches budgetLineItems
    const isBudgetLineItemLoadingOnRemount = budgetLineItems.length === 0 && budgetLineIds.length > 0;

    const isLoading = isCansLoading || isBudgetLineItemLoading || isBudgetLineItemLoadingOnRemount;
    const isTableLoading = isLoading || isCansFetching;

    useEffect(() => {
        setBudgetLineItems([]);

        if (budgetLineIds?.length) {
            fetchBudgetLineItems();
        }
    }, [budgetLineIds, fiscalYear, fetchBudgetLineItems]);

    return (
        <>
            <h2 className="font-sans-lg">Portfolio Budget & Spending Summary</h2>
            <p className="font-sans-sm">
                The summary below shows the budget and spending for this Portfolio for the selected fiscal year.
            </p>
            <PortfolioBudgetSummary
                fiscalYear={fiscalYear}
                inDraftFunding={inDraftFunding}
                totalFunding={totalFunding}
                inExecutionFunding={inExecutionFunding}
                obligatedFunding={obligatedFunding}
                plannedFunding={plannedFunding}
                spendingData={agreementSpendingData}
                counts={reportingSummaryData}
                contractTotal={agreementSpendingData?.agreement_types?.find((t) => t.type === "CONTRACT")?.total ?? 0}
                partnerTotal={agreementSpendingData?.agreement_types?.find((t) => t.type === "PARTNER")?.total ?? 0}
                grantTotal={agreementSpendingData?.agreement_types?.find((t) => t.type === "GRANT")?.total ?? 0}
                directObligationTotal={
                    agreementSpendingData?.agreement_types?.find((t) => t.type === "DIRECT_OBLIGATION")?.total ?? 0
                }
            />
            <section>
                <h2>Portfolio Budget Lines</h2>
                <p>
                    This is a list of all budget lines allocating funding from this Portfolio&apos;s CANs for the
                    selected fiscal year.
                </p>
            </section>
            {isTableLoading ? (
                <PortfolioSpendingTableLoading />
            ) : (
                <CANBudgetLineTable
                    budgetLines={budgetLineItems}
                    totalFunding={totalFunding}
                    fiscalYear={fiscalYear}
                    tableType="portfolio"
                />
            )}
        </>
    );
};

export default PortfolioSpending;
