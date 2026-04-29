import { useMemo } from "react";
import CurrencyFormat from "react-currency-format";
import LegendItem from "../../../components/UI/Cards/LineGraphWithLegendCard/LegendItem";
import HorizontalStackedBar from "../../../components/UI/DataViz/HorizontalStackedBar/HorizontalStackedBar";
import RoundedBox from "../../../components/UI/RoundedBox";
import Tag from "../../../components/UI/Tag/Tag";

const STATUS_COLORS = {
    PLANNED: "var(--data-viz-bl-by-status-2)",
    IN_EXECUTION: "var(--data-viz-bl-by-status-3)",
    OBLIGATED: "var(--data-viz-bl-by-status-4)"
};

const buildStatusData = (procurementOverview) => {
    if (!procurementOverview) {
        return { statusData: [], totalAmount: 0, totalAgreements: 0 };
    }

    const { status_data, total_amount, total_agreements } = procurementOverview;

    const statusData = status_data.map((item, index) => ({
        id: index + 1,
        label: item.label,
        color: STATUS_COLORS[item.status] || "var(--data-viz-bl-by-status-2)",
        amount: item.amount,
        amountPercent: `${item.amount_percent}%`,
        agreements: item.agreements,
        agreementsPercent: `${item.agreements_percent}%`,
        percent: total_amount > 0 ? (item.amount / total_amount) * 100 : 0,
        abbreviation: item.label,
        value: item.amount
    }));

    return { statusData, totalAmount: total_amount, totalAgreements: total_agreements };
};

const ProcurementOverviewCard = ({ procurementOverview, fiscalYear, isLoading, error }) => {
    const { statusData, totalAmount, totalAgreements } = useMemo(
        () => buildStatusData(procurementOverview),
        [procurementOverview]
    );
    const fyShort = String(fiscalYear).slice(-2);
    const hasData = totalAmount > 0 || totalAgreements > 0;

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
            style={{
                padding: hasData ? "20px 30px 30px 30px" : "20px 30px 20px 30px",
                width: "100%",
                ...(!hasData && { minHeight: "auto" })
            }}
        >
            <h3 className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal">
                FY {fiscalYear} Procurement Overview
            </h3>
            <div className={`display-flex flex-align-end${hasData ? " margin-bottom-3" : ""}`}>
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
                <span
                    data-cy="procurement-overview-total-agreements"
                    className="font-sans-xl text-bold margin-left-1"
                >
                    {totalAgreements} agreements
                </span>
            </div>
            {hasData ? (
                <>
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
                </>
            ) : null}
        </RoundedBox>
    );
};

export default ProcurementOverviewCard;
