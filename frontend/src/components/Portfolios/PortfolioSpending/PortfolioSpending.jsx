import React, { useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    useGetPortfolioCansByIdQuery,
    useGetReportingSummaryQuery,
    useLazyGetBudgetLineItemsBatchQuery
} from "../../../api/opsAPI";
import { chunk } from "../../../helpers/utils";
import CANBudgetLineTable from "../../CANs/CANBudgetLineTable";
import PortfolioSpendingTableLoading from "./PortfolioSpendingTableLoading";
import PortfolioBudgetSummary from "../PortfolioBudgetSummary";
import SimpleAlert from "../../UI/Alert/SimpleAlert";

const BUDGET_LINE_BATCH_SIZE = 50;

const PortfolioSpending = () => {
    const [budgetLineItems, setBudgetLineItems] = React.useState([]);
    const [fetchError, setFetchError] = React.useState(false);
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

    const { data: reportingSummaryResponse } = useGetReportingSummaryQuery(
        { fiscalYear, portfolioIds: [portfolioId] },
        { skip: !portfolioId || !fiscalYear }
    );

    const agreementSpendingData = reportingSummaryResponse?.spending;
    const reportingSummaryData = reportingSummaryResponse?.counts;

    const budgetLineIds = useMemo(
        () => [...new Set(portfolioCans?.flatMap((can) => can.budget_line_items) ?? [])],
        [portfolioCans]
    );

    // Lazy query hook - fetched in batches of BUDGET_LINE_BATCH_SIZE ids (sent in parallel)
    // instead of one request per id, since a portfolio/fiscal-year combo can reference
    // hundreds of budget line ids and a request-per-id fan-out can exhaust the backend's
    // DB connection pool.
    const [trigger, { isLoading: isBudgetLineItemLoading }] = useLazyGetBudgetLineItemsBatchQuery();
    const fetchBudgetLineItems = useCallback(async () => {
        const batches = chunk(budgetLineIds, BUDGET_LINE_BATCH_SIZE);
        const promises = batches.map((ids) => trigger({ ids }).unwrap());
        try {
            const batchResults = await Promise.all(promises);
            const budgetLineItemsData = batchResults.flat();
            const budgetLineItemsByFiscalYear = budgetLineItemsData.filter(
                (item) => item.fiscal_year === fiscalYear || item.fiscal_year === null
            );
            setBudgetLineItems(budgetLineItemsByFiscalYear);
            setFetchError(false);
        } catch (error) {
            console.error("Failed to fetch budgetLineItems:", error);
            setFetchError(true);
        }
    }, [budgetLineIds, fiscalYear, trigger]);

    // When switching tabs components gets remounted, and while budgetLineIds are cached, useCallback still runs and fetches budgetLineItems
    const isBudgetLineItemLoadingOnRemount = !fetchError && budgetLineItems.length === 0 && budgetLineIds.length > 0;

    const isLoading = isCansLoading || isBudgetLineItemLoading || isBudgetLineItemLoadingOnRemount;
    const isTableLoading = isLoading || isCansFetching;

    useEffect(() => {
        setBudgetLineItems([]);
        setFetchError(false);

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
            />
            <section>
                <h2>Portfolio Budget Lines</h2>
                <p>
                    This is a list of all budget lines allocating funding from this Portfolio&apos;s CANs for the
                    selected fiscal year.
                </p>
            </section>
            {fetchError ? (
                <SimpleAlert
                    type="error"
                    heading="Unable to load budget lines"
                    message="Something went wrong while loading this Portfolio's budget lines. Please try again."
                />
            ) : isTableLoading ? (
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
