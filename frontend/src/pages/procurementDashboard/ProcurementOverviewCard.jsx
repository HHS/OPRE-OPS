import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import CurrencyWithSmallCents from "../../components/UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import RoundedBox from "../../components/UI/RoundedBox";
import Tag from "../../components/UI/Tag/Tag";

const statusData = [
    {
        label: "Planned",
        color: "var(--data-viz-bl-by-status-2)",
        amount: 20_000_000,
        amountPercent: "33%",
        agreements: 20,
        agreementsPercent: "22%"
    },
    {
        label: "Executing",
        color: "var(--data-viz-bl-by-status-3)",
        amount: 20_000_000,
        amountPercent: "33%",
        agreements: 52,
        agreementsPercent: "56%"
    },
    {
        label: "Obligated",
        color: "var(--data-viz-bl-by-status-4)",
        amount: 20_000_000,
        amountPercent: "33%",
        agreements: 20,
        agreementsPercent: "22%"
    }
];

const totalAmount = 60_000_000;
const totalAgreements = 92;

const ProcurementOverviewCard = () => {
    return (
        <RoundedBox
            dataCy="procurement-overview-card"
            style={{ padding: "20px 30px 30px 30px", width: "100%" }}
        >
            <h3 className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal">
                FY 2026 Procurement Overview
            </h3>
            <div className="display-flex flex-align-end margin-bottom-3">
                <CurrencyWithSmallCents
                    dollarsClasses="font-sans-2xl"
                    centsClasses="font-sans-3xs"
                    amount={totalAmount}
                />
                <span className="font-sans-xs margin-left-1 margin-bottom-05">total for FY 26 procurement across</span>
                <span className="font-sans-xl text-bold margin-left-1">{totalAgreements} agreements</span>
            </div>
            <HorizontalStatusBar data={statusData} />
            <div className="display-flex flex-justify margin-top-2">
                {statusData.map((item) => (
                    <LegendItem
                        key={item.label}
                        {...item}
                    />
                ))}
            </div>
        </RoundedBox>
    );
};

const HorizontalStatusBar = ({ data }) => {
    const total = data.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div
            className="display-flex width-full radius-pill overflow-hidden"
            style={{ height: "16px" }}
        >
            {data.map((item) => {
                const widthPercent = total > 0 ? (item.amount / total) * 100 : 0;
                return (
                    <div
                        key={item.label}
                        style={{
                            width: `${widthPercent}%`,
                            backgroundColor: item.color
                        }}
                    />
                );
            })}
        </div>
    );
};

const LegendItem = ({ label, color, amount, amountPercent, agreements, agreementsPercent }) => {
    return (
        <div className="font-12px">
            <div className="display-flex flex-align-center margin-bottom-05">
                <FontAwesomeIcon
                    icon={faCircle}
                    className="height-1 width-1 margin-right-05"
                    style={{ color }}
                />
                <span className="text-bold">{label}</span>
                <CurrencyFormat
                    value={amount}
                    displayType="text"
                    thousandSeparator={true}
                    prefix="$"
                    decimalScale={2}
                    fixedDecimalScale={true}
                    renderText={(val) => <span className="margin-left-2">{val}</span>}
                />
                <Tag
                    tagStyle="darkTextWhiteBackground"
                    text={amountPercent}
                    className="margin-left-1"
                />
            </div>
            <div className="display-flex flex-align-center padding-left-205">
                <span>{agreements} agreements</span>
                <Tag
                    tagStyle="darkTextWhiteBackground"
                    text={agreementsPercent}
                    className="margin-left-1"
                />
            </div>
        </div>
    );
};

export default ProcurementOverviewCard;
