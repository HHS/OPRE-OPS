import { useState, useEffect, useRef, useMemo } from "react";
import { useGetPortfoliosQuery, useGetPortfolioFundingSummaryBatchQuery } from "../../../api/opsAPI";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import { filterMyPortfolios } from "./PortfolioList.helpers";

// Default budget range: $0 - $100M
const DEFAULT_BUDGET_RANGE = [0, 100000000];

/**
 * Custom hook for managing portfolio list state and data fetching
 * @param {Object} params
 * @param {number} params.currentUserId - Current user ID for "My Portfolios" filtering
 * @param {URLSearchParams} params.searchParams - URL search parameters (read-only, for tab state)
 * @returns {Object} Portfolio list state and handlers
 */
export const usePortfolioList = ({ currentUserId, searchParams }) => {
    // Fetch all portfolios first
    const {
        data: allPortfolios,
        isLoading: isLoadingPortfolios,
        isError: isErrorPortfolios
    } = useGetPortfoliosQuery({});

    // Simple state initialization with defaults
    const tabFromUrl = searchParams.get("tab") || "all";
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(getCurrentFiscalYear());
    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [filters, setFilters] = useState({
        portfolios: [],
        budgetRange: DEFAULT_BUDGET_RANGE,
        availablePct: []
    });

    const fiscalYear = Number(selectedFiscalYear);

    // Store the initial unfiltered budget range for the filter slider
    const unfilteredBudgetRangeRef = useRef(null);
    const prevFiscalYearRef = useRef(selectedFiscalYear);

    // Reset filters and cached budget range when fiscal year changes
    useEffect(() => {
        if (prevFiscalYearRef.current !== selectedFiscalYear) {
            // Reset all filters including budget range
            setFilters((prev) => ({
                ...prev,
                portfolios: [],
                budgetRange: DEFAULT_BUDGET_RANGE,
                availablePct: []
            }));

            // Reset cached budget range so it recalculates from new fiscal year data
            unfilteredBudgetRangeRef.current = null;
            prevFiscalYearRef.current = selectedFiscalYear;
        }
    }, [selectedFiscalYear]);

    // Prepare filter parameters for API call
    const portfolioIds = filters.portfolios.map((p) => p.id);
    const [budgetMin, budgetMax] = filters.budgetRange || DEFAULT_BUDGET_RANGE;
    const availablePct = filters.availablePct;

    // Only apply budget filter if user has explicitly set a range (not the DEFAULT)
    const isDefaultRange = budgetMin === DEFAULT_BUDGET_RANGE[0] && budgetMax === DEFAULT_BUDGET_RANGE[1];
    const shouldApplyBudgetFilter = !isDefaultRange;
    const shouldApplyPctFilter = availablePct && availablePct.length > 0;

    // Fetch batch funding data with filters
    const {
        data: fundingData,
        isLoading: isLoadingFunding,
        isError: isErrorFunding
    } = useGetPortfolioFundingSummaryBatchQuery({
        fiscalYear,
        portfolioIds: portfolioIds.length > 0 ? portfolioIds : undefined,
        budgetMin: shouldApplyBudgetFilter ? budgetMin : undefined,
        budgetMax: shouldApplyBudgetFilter ? budgetMax : undefined,
        availablePct: shouldApplyPctFilter ? availablePct : undefined
    });

    const isLoading = isLoadingPortfolios || isLoadingFunding;
    const isError = isErrorPortfolios || isErrorFunding;

    // Calculate budget range for filter components
    // Store initial unfiltered range to prevent slider range from narrowing when filters are applied
    const fyBudgetRange = useMemo(() => {
        // Only calculate from unfiltered data (when NO filters are applied)
        const isUnfiltered = !shouldApplyBudgetFilter && portfolioIds.length === 0 && !shouldApplyPctFilter;

        if (!fundingData?.portfolios || fundingData.portfolios.length === 0) {
            return unfilteredBudgetRangeRef.current || DEFAULT_BUDGET_RANGE;
        }

        // If this is unfiltered data, calculate and store the range from ALL portfolios
        if (isUnfiltered) {
            const budgets = fundingData.portfolios
                .map((p) => p.total_funding?.amount || 0)
                .filter((amount) => amount > 0);

            if (budgets.length === 0) {
                return unfilteredBudgetRangeRef.current || DEFAULT_BUDGET_RANGE;
            }

            const min = Math.floor(Math.min(...budgets));
            const max = Math.ceil(Math.max(...budgets));

            // If min === max (only one budget value), use DEFAULT_BUDGET_RANGE to avoid slider issues
            if (min === max) {
                return unfilteredBudgetRangeRef.current || DEFAULT_BUDGET_RANGE;
            }

            const range = [min, max];

            // Store for future use
            unfilteredBudgetRangeRef.current = range;
            return range;
        }

        // If filtered, return the stored unfiltered range
        return unfilteredBudgetRangeRef.current || DEFAULT_BUDGET_RANGE;
    }, [fundingData, shouldApplyBudgetFilter, portfolioIds.length, shouldApplyPctFilter]);

    // Merge portfolios with funding data from filtered results
    const portfoliosWithFunding = useMemo(() => {
        if (!fundingData?.portfolios || !allPortfolios) return [];

        return (fundingData.portfolios || [])
            .map((fundingPortfolio) => {
                const portfolio = allPortfolios.find((p) => p.id === fundingPortfolio.id);

                // If portfolio not found in allPortfolios, log warning and skip
                if (!portfolio) {
                    console.warn(`Portfolio ${fundingPortfolio.id} not found in allPortfolios list`);
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
        setSelectedFiscalYear,
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
