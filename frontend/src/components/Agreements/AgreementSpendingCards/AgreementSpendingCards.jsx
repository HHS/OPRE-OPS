import { useMemo, useState } from "react";
import CurrencyCard from "../../UI/Cards/CurrencyCard";
import HorizontalStackedBar from "../../UI/DataViz/HorizontalStackedBar/HorizontalStackedBar";
import AgreementSpendingLegend from "./AgreementSpendingLegend";
import { transformToChartData } from "./AgreementSpendingCards.helpers";
import styles from "./AgreementSpendingCards.module.scss";

const AgreementSpendingCards = ({ fiscalYear, spendingData }) => {
    const [activeId, setActiveId] = useState(0);
    const totalSpending = spendingData?.total_spending || 0;
    const agreementTypes = useMemo(() => spendingData?.agreement_types || [], [spendingData]);

    const chartData = useMemo(
        () => transformToChartData(agreementTypes, totalSpending),
        [agreementTypes, totalSpending]
    );

    if (!spendingData || totalSpending === 0) {
        return (
            <div className={styles.fullWidthCard}>
                <CurrencyCard
                    headerText={`FY ${fiscalYear} Spending By Agreement Type Across New and Continuing`}
                    amount={0}
                    dataCy="agreement-spending-summary-card"
                >
                    <div className="margin-top-6">
                        <p className="text-base-dark text-center font-12px margin-0">
                            No spending data available for FY {fiscalYear}
                        </p>
                    </div>
                </CurrencyCard>
            </div>
        );
    }

    return (
        <div className={styles.fullWidthCard}>
            <CurrencyCard
                headerText={`FY ${fiscalYear} Spending By Agreement Type Across New and Continuing`}
                amount={totalSpending}
                dataCy="agreement-spending-summary-card"
            >
                <div className="margin-top-2">
                    <HorizontalStackedBar
                        data={chartData}
                        setActiveId={setActiveId}
                    />
                </div>
                <AgreementSpendingLegend
                    agreementTypes={agreementTypes}
                    activeId={activeId}
                />
            </CurrencyCard>
            <p className="text-base-dark font-12px margin-bottom-0 margin-top-1">
                *Spending equals the sum of Budget Lines in Planned, Executing and Obligated Status
            </p>
        </div>
    );
};

export default AgreementSpendingCards;
