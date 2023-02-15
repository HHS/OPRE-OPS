import style from "./styles.module.css";
import CurrencyFormat from "react-currency-format";
import Tag from "../../UI/Tag/Tag";
import CANFundingYTD from "../CANFundingYTD/CANFundingYTD";
import { useEffect, useState } from "react";
import { getPortfolioCansFundingDetails } from "../../../api/getCanFundingSummary";
import { ResponsiveDonutWithInnerPercent } from "../../UI/ResponsiveDonutWithInnerPercent/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../UI/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { calculatePercent } from "../../../helpers/utils";

const CanCard = ({ can, fiscalYear }) => {
    /* Styling */
    const sectionClasses = `${style.container}`;
    const leftMarginClasses = `padding-y-205 ${style.leftMarginContainer}`;

    /* vars */
    const [canFundingData, setCanFundingDataLocal] = useState({});
    const [percent, setPercent] = useState("");
    const [hoverId, setHoverId] = useState("");
    // generate a random number between 0 and 100
    const randomCanId = Math.floor(Math.random() * 100);

    const data = [
        {
            id: 1,
            label: "Available",
            value: canFundingData.available_funding || 0,
            color: "#C07B96",
            percent: `${calculatePercent(canFundingData.available_funding, canFundingData?.total_funding)}%`,
        },
        {
            id: 2,
            label: "Planned",
            value: canFundingData.planned_funding || 0,
            color: "#336A90",
            percent: `${calculatePercent(canFundingData.planned_funding, canFundingData?.total_funding)}%`,
        },
        {
            id: 3,
            label: "Executing",
            value: canFundingData.in_execution_funding || 0,
            color: "#E5A000",
            percent: `${calculatePercent(canFundingData.in_execution_funding, canFundingData?.total_funding)}%`,
        },
        {
            id: 4,
            label: "Obligated",
            value: canFundingData.obligated_funding || 0,
            color: "#3E8D61",
            percent: `${calculatePercent(canFundingData.obligated_funding, canFundingData?.total_funding)}%`,
        },
    ];
    useEffect(() => {
        const getCanTotalFundingandSetState = async () => {
            const results = await getPortfolioCansFundingDetails({ id: can.id, fiscalYear: fiscalYear });
            setCanFundingDataLocal(results);
        };

        getCanTotalFundingandSetState().catch(console.error);

        return () => {
            setCanFundingDataLocal({});
        };
    }, [can.id, fiscalYear]);

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
                        <span className={isGraphActive ? "fake-bold" : undefined}>{label}</span>
                    </div>
                </div>
                <div className="grid-col-6">
                    <CurrencyFormat
                        value={value}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$ "}
                        renderText={(value) => <span className={isGraphActive ? "fake-bold" : undefined}>{value}</span>}
                    />
                </div>
                <div className="grid-col-1">
                    <Tag tagStyle="darkTextLightBackground" text={percent} label={label} active={isGraphActive} />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={sectionClasses}>
                <dl className={`margin-0 ${leftMarginClasses}`}>
                    <div>
                        <dt className="margin-0 text-brand-neutral">CAN</dt>
                        <dd className="text-semibold margin-0">{can.number}</dd>
                    </div>
                    <div className="margin-y-3">
                        <dt className="margin-0 text-brand-neutral">Description</dt>
                        <dd className="text-semibold margin-0">{can.nickname}</dd>
                    </div>
                    <div className="margin-y-3">
                        <dt className="margin-0 text-brand-neutral">Appropriation</dt>
                        <dd className="text-semibold margin-0">
                            {/* TODO: Get value from backend */}
                            {can.appropriation_date ? can.appropriation_date : "99/99/9999"} ({can.appropriation_term}{" "}
                            {can.appropriation_term > 1 ? "years" : "year"})
                        </dd>
                    </div>
                    <div className="margin-y-3">
                        <dt className="margin-0 text-brand-neutral">Expiration</dt>
                        <dd className="text-semibold margin-0">{canFundingData?.expiration_date || "---"}</dd>
                    </div>
                </dl>
                <div className={`grid-row  padding-y-205 padding-left-205 padding-right-05 ${style.rightContainer}`}>
                    {/*NOTE: LEFT SIDE */}
                    <div className="grid-col-5">
                        <h3 className="font-sans-3xs text-normal text-brand-neutral">
                            FY {fiscalYear} CAN Total Funding
                        </h3>
                        <CANFundingYTD
                            className="margin-top-5"
                            total_funding={canFundingData?.total_funding}
                            current_funding={canFundingData?.current_funding}
                            expected_funding={canFundingData?.expected_funding}
                        />
                    </div>
                    {/* NOTE: RIGHT SIDE */}
                    <div className="grid-col margin-left-5">
                        <h3 className="font-sans-3xs text-normal text-brand-neutral margin-bottom-4">
                            FY {fiscalYear} CAN Budget Status
                        </h3>
                        <div className="display-flex flex-justify">
                            <div className="maxw-card-lg font-12px">
                                {data.map((canFundItem) => (
                                    <LegendItem
                                        key={canFundItem.id}
                                        id={canFundItem.id}
                                        label={canFundItem.label}
                                        value={canFundItem.value}
                                        color={canFundItem.color}
                                        percent={canFundItem.percent}
                                    />
                                ))}
                            </div>

                            <div
                                id={`can-graph-${randomCanId}`}
                                className="width-card height-card margin-right-2 margin-top-neg-2"
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
                                    container_id={`can-graph-${randomCanId}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CanCard;
