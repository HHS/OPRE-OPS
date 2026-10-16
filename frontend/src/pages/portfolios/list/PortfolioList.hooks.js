import { useMemo } from "react";
import { useGetPortfoliosQuery, useGetPortfolioFundingSummaryBatchQuery } from "../../../api/opsAPI";
import { filterMyPortfolios } from "./PortfolioList.helpers";
import { DEFAULT_PORTFOLIO_BUDGET_RANGE } from "../../../constants";
import { useListFilters } from "../../../hooks/useListFilters.hooks";

/**
 * Custom hook for managing portfolio list state and data fetching
 * @param {Object} params
 * @param {number} params.currentUserId - Current user ID for "My Portfolios" filtering
 * @param {URLSearchParams} params.searchParams - URL search parameters; `?tab=` is the source of truth for the active tab
 * @param {Function} [params.setSearchParams] - Setter from `useSearchParams`, used to switch tabs
 * @returns {Object} Portfolio list state and handlers
 */
export const usePortfolioList = ({ currentUserId, searchParams, setSearchParams }) => {
    // Fetch all portfolios first
    const {
        data: allPortfolios,
        isLoading: isLoadingPortfolios,
        isFetching: isFetchingPortfolios,
        isError: isErrorPortfolios
    } = useGetPortfoliosQuery({});

    // Filters + selected fiscal year persist across client-side navigation via
    // the session slice (see useListFilters).
    const { filters, setFilters, selectedFiscalYear, changeFiscalYear } = useListFilters("portfolios");
    // The active tab lives in `?tab=` so links back to this list (e.g. breadcrumbs) restore it.
    const activeTab = searchParams.get("tab") || "all";
    const setActiveTab = (tabId) => setSearchParams?.(tabId === "all" ? {} : { tab: tabId }, { replace: true });

    const fiscalYear = Number(selectedFiscalYear);

    // Prepare filter parameters for API call
    const portfolioIds = Array.isArray(filters.portfolios) ? filters.portfolios.map((p) => p.id) : [];
    const [budgetMin, budgetMax] = filters.budgetRange || DEFAULT_PORTFOLIO_BUDGET_RANGE;
    const availablePct = Array.isArray(filters.availablePct) ? filters.availablePct : [];

    // Only apply budget filter if user has explicitly set a range (not the DEFAULT)
    const isDefaultRange =
        budgetMin === DEFAULT_PORTFOLIO_BUDGET_RANGE[0] && budgetMax === DEFAULT_PORTFOLIO_BUDGET_RANGE[1];
    const shouldApplyBudgetFilter = !isDefaultRange;
    const shouldApplyPctFilter = availablePct && availablePct.length > 0;

    // Fetch batch funding data with filters
    const {
        data: fundingData,
        isLoading: isLoadingFunding,
        isFetching: isFetchingFunding,
        isError: isErrorFunding
    } = useGetPortfolioFundingSummaryBatchQuery({
        fiscalYear,
        portfolioIds: portfolioIds.length > 0 ? portfolioIds : undefined,
        budgetMin: shouldApplyBudgetFilter ? budgetMin : undefined,
        budgetMax: shouldApplyBudgetFilter ? budgetMax : undefined,
        availablePct: shouldApplyPctFilter ? availablePct : undefined
    });

    const isLoading = isLoadingPortfolios || isFetchingPortfolios || isLoadingFunding || isFetchingFunding;
    const isError = isErrorPortfolios || isErrorFunding;

    // Budget slider bounds come from this FY's UNFILTERED funding, so the slider
    // doesn't narrow as filters apply, including when the page remounts with
    // persisted filters. With no filters applied this shares the cache entry
    // (and request) with the query above.
    const { data: unfilteredFundingData } = useGetPortfolioFundingSummaryBatchQuery({ fiscalYear });

    const fyBudgetRange = useMemo(() => {
        const budgets = (unfilteredFundingData?.portfolios ?? [])
            .map((p) => p.total_funding?.amount || 0)
            .filter((amount) => amount > 0);

        if (budgets.length === 0) {
            return DEFAULT_PORTFOLIO_BUDGET_RANGE;
        }

        const min = Math.floor(Math.min(...budgets));
        const max = Math.ceil(Math.max(...budgets));

        // If min === max (only one budget value), add small buffer (±10%)
        if (min === max) {
            return [Math.floor(min * 0.9), Math.ceil(max * 1.1)];
        }

        return [min, max];
    }, [unfilteredFundingData]);

    // Merge portfolios with funding data from filtered results
    const portfoliosWithFunding = useMemo(() => {
        if (!fundingData?.portfolios || !allPortfolios) return [];

        return (fundingData.portfolios || [])
            .map((fundingPortfolio) => {
                const portfolio = allPortfolios.find((p) => p.id === fundingPortfolio.id);

                if (!portfolio) {
                    return null;
                }

                return {
                    ...portfolio,
                    ...fundingPortfolio,
                    fundingSummary: {
                        total_funding: fundingPortfolio.total_funding,
                        available_funding: fundingPortfolio.available_funding,
                        carry_forward_funding: fundingPortfolio.carry_forward_funding,
                        new_funding: fundingPortfolio.new_funding,
                        planned_funding: fundingPortfolio.planned_funding,
                        obligated_funding: fundingPortfolio.obligated_funding,
                        in_execution_funding: fundingPortfolio.in_execution_funding,
                        draft_funding: fundingPortfolio.draft_funding
                    }
                };
            })
            .filter(Boolean); // Remove null entries
    }, [fundingData, allPortfolios]);

    // Apply "My Portfolios" tab filter client-side
    const filteredPortfolios = useMemo(() => {
        if (activeTab === "my" && currentUserId) {
            return filterMyPortfolios(portfoliosWithFunding, currentUserId);
        }
        return portfoliosWithFunding;
    }, [portfoliosWithFunding, activeTab, currentUserId]);

    return {
        // State
        selectedFiscalYear,
        setSelectedFiscalYear: changeFiscalYear,
        activeTab,
        setActiveTab,
        filters,
        setFilters,
        fiscalYear,

        // Data
        allPortfolios,
        portfoliosWithFunding,
        filteredPortfolios,
        fyBudgetRange,

        // Loading/Error states
        isLoading,
        isError
    };
};
