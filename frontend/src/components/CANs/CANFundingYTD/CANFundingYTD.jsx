import styles from "./styles.module.css";
import CurrencyFormat from "react-currency-format";
import CANFundingBar from "../CANFundingBar/CANFundingBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import Tag from "../../UI/Tag/Tag";

const CANFundingYTD = ({
    fiscalYear = "9999",
    total_funding = "0",
    current_funding = "0",
    expected_funding = "0",
    className = "",
}) => {
    const calculatePercent = (value) => {
        return (value / total_funding) * 100;
    };

    const data = [
        {
            id: 1,
            label: `FY ${fiscalYear} Funding Received YTD`,
            value: current_funding,
            color: "#264a64",
            percent: `${calculatePercent(current_funding)}%`,
        },
        {
            id: 2,
            label: `FY ${fiscalYear} Funding Expected`,
            value: expected_funding,
            color: "#a1d0be",
            percent: `${calculatePercent(expected_funding)}%`,
        },
    ];
    const BudgetItem = ({ id, label, value, color, percent }) => {
        const isGraphActive = false;
        return (
            <div className="grid-row margin-top-2">
                <div className="grid-col-7">
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`height-1 width-1 margin-right-05`}
                            style={{ color: color }}
                        />
                        <span className={isGraphActive ? "text-bold" : undefined}>{label}</span>
                    </div>
                </div>
                <div className="grid-col-4">
                    <CurrencyFormat
                        value={value}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$ "}
                        renderText={(value) => <span className={isGraphActive ? "text-bold" : undefined}>{value}</span>}
                    />
                </div>
                <div className="grid-col-1">
                    <Tag tagStyle="darkTextLightBackground" text={percent} label={label} active={isGraphActive} />
                </div>
            </div>
        );
    };

    return (
        <div className={className}>
            <CurrencyFormat
                value={total_funding}
                displayType={"text"}
                thousandSeparator={true}
                prefix={"$ "}
                renderText={(value) => <span className="text-semibold font-sans-lg margin-bottom-105">{value}</span>}
            />

            <div className={styles.barBox}>
                <CANFundingBar current_funding={current_funding} expected_funding={expected_funding} />
            </div>

            <div className="font-12px margin-top-2">
                {data.map((item) => (
                    <BudgetItem
                        key={item.id}
                        label={item.label}
                        value={item.value}
                        color={item.color}
                        percent={item.percent}
                    />
                ))}
            </div>
        </div>
    );
};

export default CANFundingYTD;
