import { useState, useMemo } from "react";
import { useGetPortfolioFundingSummaryBatchQuery } from "../../api/opsAPI";
import { getCurrentFiscalYear } from "../../helpers/utils";

export const useReportingPageData = () => {
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(getCurrentFiscalYear());
    const fiscalYear = Number(selectedFiscalYear);

    const { data: fundingData, isLoading, isError } = useGetPortfolioFundingSummaryBatchQuery({ fiscalYear });

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

    return {
        fiscalYear,
        selectedFiscalYear,
        setSelectedFiscalYear,
        totalFunding,
        totalSpending,
        isLoading,
        isError
    };
};
