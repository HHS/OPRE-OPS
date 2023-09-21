import { useState } from "react";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { ResponsiveDonutWithInnerPercent } from "../../UI/ResponsiveDonutWithInnerPercent/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../UI/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import Tag from "../../UI/Tag/Tag";
import RoundedBox from "../../UI/RoundedBox";
import styles from "./styles.module.css";

const BLIStatusSummaryCard = ({ budgetLines }) => {
    const [percent, setPercent] = useState("");
    const [hoverId, setHoverId] = useState(-1);

    // TODO: Replace with real data and colors
    const totalFunding = 357_123_000;
    const data = [
        {
            id: 1,
            label: "Draft",
            value: 1_572_000 || 0,
            color: "#C07B96",
            percent: Math.round(60) + "%"
        },
        {
            id: 2,
            label: "Planned",
            value: 524_000 || 0,
            color: "#336A90",
            percent: Math.round(10) + "%"
        },
        {
            id: 3,
            label: "Executing",
            value: 0 || 0,
            color: "#E5A000",
            percent: Math.round(0) + "%"
        },
        {
            id: 4,
            label: "Obligated",
            value: 1_048_000 || 0,
            color: "#3A835B",
            percent: Math.round(30) + "%"
        }
    ];

    const LegendItem = ({ id, label, value, color, percent }) => {
        const isGraphActive = hoverId === id;
        return (
            <div className="grid-row margin-top-2">
                <div className="grid-col-5">
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`height-1 width-1 margin-right-05`}
                            style={{ color: color }}
                        />
                        <span className={isGraphActive ? "fake-bold" : ""}>{label}</span>
                    </div>
                </div>
                <div className="grid-col-6">
                    <CurrencyFormat
                        value={value}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$ "}
                        renderText={(value) => <span className={isGraphActive ? "fake-bold" : ""}>{value}</span>}
                    />
                </div>
                <div className="grid-col-1">
                    <Tag
                        tagStyle="darkTextWhiteBackground"
                        text={percent}
                        label={label}
                        active={isGraphActive}
                    />
                </div>
            </div>
        );
    };

    return (
        <RoundedBox
            className="padding-y-205 padding-x-4 display-inline-block"
            dataCy="bli-status-summary-card"
        >
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Budget Lines By Status</h3>

            <div className="display-flex flex-justify">
                <div
                    className={
                        totalFunding > 0 ? `${styles.widthLegend} maxw-card-lg font-12px` : "width-card-lg font-12px"
                    }
                >
                    {data.map((item) => (
                        <LegendItem
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            value={item.value}
                            color={item.color}
                            percent={item.percent}
                        />
                    ))}
                </div>
                <div
                    id="portfolioBudgetStatusChart"
                    className="width-card height-card margin-top-neg-2"
                    aria-label="This is a Donut Chart that displays the percent by budget line status in the center."
                    role="img"
                >
                    <ResponsiveDonutWithInnerPercent
                        data={data}
                        width={175}
                        height={175}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        setPercent={setPercent}
                        setHoverId={setHoverId}
                        CustomLayerComponent={CustomLayerComponent(percent)}
                        container_id="portfolioBudgetStatusChart"
                    />
                </div>
            </div>
        </RoundedBox>
    );
};

export default BLIStatusSummaryCard;
