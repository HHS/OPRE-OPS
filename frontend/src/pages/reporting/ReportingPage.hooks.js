import { useState, useMemo } from "react";
import {
    useGetReportingSummaryQuery,
    useGetPortfolioFundingSummaryBatchQuery,
    useGetPortfoliosQuery
} from "../../api/opsAPI";
import { getCurrentFiscalYear } from "../../helpers/utils";

export const useReportingPageData = () => {
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(getCurrentFiscalYear());
    const [filters, setFilters] = useState({ portfolios: [] });
    const fiscalYear = Number(selectedFiscalYear);

    const portfolioIds = filters.portfolios.map((p) => p.id);
    const portfolioIdsParam = portfolioIds.length > 0 ? portfolioIds : undefined;

    const {
        data: allPortfolios,
        isLoading: isLoadingPortfolios,
        isError: isErrorPortfolios
    } = useGetPortfoliosQuery({});

    const {
        data: fundingData,
        isLoading: isLoadingFunding,
        isError: isErrorFunding
    } = useGetPortfolioFundingSummaryBatchQuery({ fiscalYear, portfolioIds: portfolioIdsParam });

    const {
        data: reportingSummaryResponse,
        isLoading: isLoadingReportingSummary,
        isError: isErrorReportingSummary
    } = useGetReportingSummaryQuery({ fiscalYear, portfolioIds: portfolioIdsParam });

    const agreementSpendingData = reportingSummaryResponse?.spending;
    const reportingSummaryData = reportingSummaryResponse?.counts;

    const isLoading = isLoadingPortfolios || isLoadingFunding || isLoadingReportingSummary;
    const isError = isErrorPortfolios || isErrorFunding || isErrorReportingSummary;

    const { totalFunding, totalSpending } = useMemo(() => {
        if (!fundingData?.portfolios) {
            return { totalFunding: 0, totalSpending: 0 };
        }

        return fundingData.portfolios.reduce(
            (acc, portfolio) => {
                acc.totalFunding += portfolio.total_funding?.amount ?? 0;
                acc.totalSpending +=
                    (portfolio.planned_funding?.amount ?? 0) +
                    (portfolio.obligated_funding?.amount ?? 0) +
                    (portfolio.in_execution_funding?.amount ?? 0);
                return acc;
            },
            { totalFunding: 0, totalSpending: 0 }
        );
    }, [fundingData]);

    const bliStatusSpending = useMemo(() => {
        if (!fundingData?.portfolios) {
            return { draft: 0, planned: 0, inExecution: 0, obligated: 0, total: 0 };
        }

        return fundingData.portfolios.reduce(
            (acc, portfolio) => {
                acc.draft += portfolio.draft_funding?.amount ?? 0;
                acc.planned += portfolio.planned_funding?.amount ?? 0;
                acc.inExecution += portfolio.in_execution_funding?.amount ?? 0;
                acc.obligated += portfolio.obligated_funding?.amount ?? 0;
                acc.total +=
                    (portfolio.draft_funding?.amount ?? 0) +
                    (portfolio.planned_funding?.amount ?? 0) +
                    (portfolio.in_execution_funding?.amount ?? 0) +
                    (portfolio.obligated_funding?.amount ?? 0);
                return acc;
            },
            { draft: 0, planned: 0, inExecution: 0, obligated: 0, total: 0 }
        );
    }, [fundingData]);

    const portfoliosWithFunding = useMemo(() => {
        if (!fundingData?.portfolios || !allPortfolios) return [];

        return fundingData.portfolios
            .map((fundingPortfolio) => {
                const portfolio = allPortfolios.find((p) => p.id === fundingPortfolio.id);
                if (!portfolio) return null;

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
            .filter(Boolean);
    }, [fundingData, allPortfolios]);

    return {
        fiscalYear,
        selectedFiscalYear,
        setSelectedFiscalYear,
        filters,
        setFilters,
        totalFunding,
        totalSpending,
        portfoliosWithFunding,
        agreementSpendingData,
        reportingSummaryData,
        bliStatusSpending,
        isLoading,
        isError
    };
};
