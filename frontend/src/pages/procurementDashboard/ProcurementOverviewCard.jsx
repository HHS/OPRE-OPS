import { useMemo } from "react";
import CurrencyFormat from "react-currency-format";
import LegendItem from "../../components/UI/Cards/LineGraphWithLegendCard/LegendItem";
import HorizontalStackedBar from "../../components/UI/DataViz/HorizontalStackedBar/HorizontalStackedBar";
import RoundedBox from "../../components/UI/RoundedBox";
import Tag from "../../components/UI/Tag/Tag";
import { BLI_STATUS } from "../../helpers/budgetLines.helpers";

const STATUS_CONFIG = [
    { key: BLI_STATUS.PLANNED, label: "Planned", color: "var(--data-viz-bl-by-status-2)" },
    { key: BLI_STATUS.EXECUTING, label: "Executing", color: "var(--data-viz-bl-by-status-3)" },
    { key: BLI_STATUS.OBLIGATED, label: "Obligated", color: "var(--data-viz-bl-by-status-4)" }
];

const formatPercent = (value, total) => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
};

const computeOverviewData = (agreements, fiscalYear) => {
    const amountByStatus = { [BLI_STATUS.PLANNED]: 0, [BLI_STATUS.EXECUTING]: 0, [BLI_STATUS.OBLIGATED]: 0 };
    const agreementsByStatus = {
        [BLI_STATUS.PLANNED]: new Set(),
        [BLI_STATUS.EXECUTING]: new Set(),
        [BLI_STATUS.OBLIGATED]: new Set()
    };

    for (const agreement of agreements) {
        const blis = (agreement.budget_line_items || []).filter((bli) => bli.fiscal_year === fiscalYear);
        for (const bli of blis) {
            if (bli.status in amountByStatus) {
                amountByStatus[bli.status] += (bli.amount || 0) + (bli.fees || 0);
                agreementsByStatus[bli.status].add(agreement.id);
            }
        }
    }

    const totalAmount = Object.values(amountByStatus).reduce((sum, val) => sum + val, 0);
    const totalAgreements = agreements.length;

    const statusData = STATUS_CONFIG.map(({ key, label, color }, index) => {
        const amount = amountByStatus[key];
        return {
            id: index + 1,
            label,
            color,
            amount,
            amountPercent: formatPercent(amount, totalAmount),
            agreements: agreementsByStatus[key].size,
            agreementsPercent: formatPercent(agreementsByStatus[key].size, totalAgreements),
            percent: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
            abbreviation: label,
            value: amount
        };
    });

    return { statusData, totalAmount, totalAgreements };
};

const ProcurementOverviewCard = ({ agreements = [], fiscalYear, isLoading, error }) => {
    const { statusData, totalAmount, totalAgreements } = useMemo(
        () => computeOverviewData(agreements, fiscalYear),
        [agreements, fiscalYear]
    );
    const fyShort = String(fiscalYear).slice(-2);

    if (isLoading) {
        return (
            <RoundedBox
                dataCy="procurement-overview-card"
                style={{ padding: "20px 30px 30px 30px", width: "100%" }}
            >
                <p>Loading procurement overview...</p>
            </RoundedBox>
        );
    }

    if (error) {
        return (
            <RoundedBox
                dataCy="procurement-overview-card"
                style={{ padding: "20px 30px 30px 30px", width: "100%" }}
            >
                <p>Error loading procurement data.</p>
            </RoundedBox>
        );
    }

    return (
        <RoundedBox
            dataCy="procurement-overview-card"
            style={{ padding: "20px 30px 30px 30px", width: "100%" }}
        >
            <h3 className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal">
                FY {fiscalYear} Procurement Overview
            </h3>
            <div className="display-flex flex-align-end margin-bottom-3">
                <CurrencyFormat
                    value={totalAmount}
                    displayType="text"
                    thousandSeparator={true}
                    prefix="$"
                    fixedDecimalScale={true}
                    renderText={(value) => <span className="text-bold margin-bottom-0 font-sans-xl">{value}</span>}
                />
                <span className="font-sans-xs margin-left-1 margin-bottom-05">
                    total for FY {fyShort} procurement across
                </span>
                <span className="font-sans-xl text-bold margin-left-1">{totalAgreements} agreements</span>
            </div>
            <HorizontalStackedBar data={statusData} />
            <div className="display-flex flex-justify-space-between margin-top-2">
                {statusData.map((item) => (
                    <div
                        key={item.label}
                        className="font-12px"
                        style={{ width: "25%" }}
                    >
                        <LegendItem
                            id={item.id}
                            label={item.label}
                            value={item.amount}
                            color={item.color}
                            percent={parseInt(item.amountPercent)}
                            tagStyleActive="darkTextWhiteBackground"
                        />
                        <div className="display-flex flex-align-center flex-justify-end">
                            <span>{item.agreements} agreements</span>
                            <Tag
                                tagStyle="darkTextWhiteBackground"
                                text={item.agreementsPercent}
                                className="margin-left-1"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </RoundedBox>
    );
};

export default ProcurementOverviewCard;
