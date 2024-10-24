import React from "react";
import styles from "./styles.module.css";
import CurrencyFormat from "react-currency-format";
import LineGraph from "../../UI/DataViz/LineGraph";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import Tag from "../../UI/Tag/Tag";
import { calculatePercent } from "../../../helpers/utils";

const CANFundingYTD = ({
    total_funding = "0",
    received_funding = "0",
    expected_funding = "0",
    carry_forward_funding = "0",
    carry_forward_label = "",
    className = ""
}) => {
    const data = [
        {
            id: 1,
            label: "Funding Received YTD",
            value: received_funding,
            color: "#D47D2D",
            percent: `${calculatePercent(received_funding, total_funding)}%`,
            tagStyleActive: "whiteOnOrange"
        },
        {
            id: 2,
            label: "Funding Expected",
            value: expected_funding,
            color: "#A9AEB1",
            percent: `${calculatePercent(expected_funding, total_funding)}%`,
            tagStyleActive: "darkTextGreyBackground"
        }
    ];
    const [activeId, setActiveId] = React.useState(0);

    const CarryForwardTag = ({ funding, label, tagStyleActive }) => {
        if (funding > 0) {
            return (
                <Tag
                    tagStyle="darkTextGreenBackground"
                    text={label}
                    label={label}
                    tagStyleActive={tagStyleActive}
                />
            );
        } else {
            return "";
        }
    };

    const LegendItem = ({ id, label, value, color, percent, tagStyleActive }) => {
        const isGraphActive = activeId === id;
        return (
            <div className="grid-row margin-top-2">
                <div className="grid-col-7">
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`height-1 width-1 margin-right-05`}
                            style={{ color: color }}
                        />

                        <span className={isGraphActive ? "fake-bold" : ""}>{label}</span>
                    </div>
                </div>
                <div className="grid-col-4">
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
                        tagStyle="darkTextLightBackground"
                        text={percent}
                        label={label}
                        active={isGraphActive}
                        tagStyleActive={tagStyleActive}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className={className}>
            <div className="display-flex flex-justify flex-align-center">
                <CurrencyFormat
                    value={total_funding}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$ "}
                    renderText={(value) => <span className="text-semibold font-sans-lg">{value}</span>}
                />
                <CarryForwardTag
                    funding={carry_forward_funding}
                    label={carry_forward_label}
                />
            </div>
            <div className={`margin-top-2 ${styles.barBox}`}>
                <LineGraph
                    setActiveId={setActiveId}
                    data={data}
                />
            </div>

            <div className="font-12px margin-top-2">
                {data.map((item) => (
                    <LegendItem
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        value={item.value}
                        color={item.color}
                        percent={item.percent}
                        tagStyleActive={item.tagStyleActive}
                    />
                ))}
            </div>
        </div>
    );
};

export default CANFundingYTD;
