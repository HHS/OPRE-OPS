import style from "./styles.module.css";
import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import CurrencyFormat from "react-currency-format";
import Tag from "../../UI/Tag/Tag";
import CANFundingYTD from "../CANFundingYTD/CANFundingYTD";
import { useEffect, useState } from "react";
import constants from "../../../constants";
import { getPortfolioCansFundingDetails } from "../../../api/getCanFundingSummary";
import { ResponsiveDonutWithInnerPercent } from "../../UI/ResponsiveDonutWithInnerPercent/ResponsiveDonutWithInnerPercent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

const CanCard = ({ can, fiscalYear }) => {
    /* Styling */
    const sectionClasses = `${style.container}`;
    const leftMarginClasses = `padding-y-205 ${style.leftMarginContainer}`;
    const cardBodyClasses = `padding-left-3 padding-top-2 ${style.cardBodyDiv}`;
    const fundingYTDClasses = `padding-left-0 grid-container ${style.fundingYTD}`;
    const budgetStatusClasses = `${style.budgetStatus}`;
    const budgetStatusTableClasses = `usa-table usa-table--borderless text-bold font-sans-3xs ${style.budgetStatusTable}`;
    /* vars */
    const [canFundingData, setCanFundingDataLocal] = useState({});

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

    return (
        <section>
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
                    {/* <div className="margin-y-2">
                        <h2 className="font-sans-3xs margin-0 text-brand-neutral">FY Total Budget</h2>
                        <p className="font-sans-3xs text-semibold margin-0">
                            <CurrencyWithSmallCents
                                amount={canFundingData?.total_funding || constants.notFilledInText}
                                dollarsClasses="font-sans-3xs text-bold"
                                centsStyles={{ fontSize: "10px" }}
                            />
                        </p>
                    </div> */}
                </dl>
                <div className="grid-row border-accent-cool border-1px padding-205">
                    {/*NOTE: LEFT SIDE */}
                    <div className="grid-col-5">
                        <h4 className="font-sans-3xs text-normal">FY {fiscalYear} CAN Total Funding</h4>
                        <CANFundingYTD
                            className="margin-top-5"
                            current_funding={canFundingData?.current_funding}
                            expected_funding={canFundingData?.expected_funding}
                        />

                        <div className={budgetStatusClasses}>
                            <div className={budgetStatusTableClasses}>
                                {/* <table className={budgetStatusTableClasses}>
                                        <thead>
                                            <tr>
                                                <th scope="col">Planned</th>
                                                <th scope="col">in Execution</th>
                                                <th scope="col">Obligated</th>
                                                <th scope="col">Remaining</th>
                                                <th scope="col">Appropriation Term</th>
                                                <th scope="col">Expiration</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <CurrencyWithSmallCents
                                                        amount={canFundingData?.planned_funding || 0}
                                                        dollarsClasses="font-sans-3xs"
                                                        centsStyles={{ fontSize: "10px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <CurrencyWithSmallCents
                                                        amount={canFundingData?.in_execution_funding || 0}
                                                        dollarsClasses="font-sans-3xs"
                                                        centsStyles={{ fontSize: "10px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <CurrencyWithSmallCents
                                                        amount={canFundingData?.obligated_funding || 0}
                                                        dollarsClasses="font-sans-3xs"
                                                        centsStyles={{ fontSize: "10px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <CurrencyWithSmallCents
                                                        amount={canFundingData?.available_funding || 0}
                                                        dollarsClasses="font-sans-3xs"
                                                        centsStyles={{ fontSize: "10px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <b>{canFundingData?.can?.appropriation_term || "-"} Years</b>
                                                </td>
                                                <td>
                                                    <b>{canFundingData?.expiration_date || "---"}</b>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table> */}
                            </div>
                        </div>
                    </div>
                    {/* NOTE: RIGHT SIDE */}
                    <div className="grid-col margin-left-5">
                        <h4 className="font-sans-3xs text-normal">FY {fiscalYear} CAN Budget Status</h4>

                        <div className="display-flex flex-justify">
                            <div className="grid-row maxw-card-lg font-12px">
                                <div className="grid-col-5">
                                    <div className="display-flex flex-align-center">
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            className="height-1 width-1 margin-right-1px text-brand-dataviz-level-1"
                                        />
                                        <span>Available</span>
                                    </div>
                                </div>
                                <div className="grid-col-5">
                                    <CurrencyFormat
                                        value={canFundingData?.available_funding}
                                        displayType={"text"}
                                        thousandSeparator={true}
                                        prefix={"$ "}
                                        renderText={(value) => <span className="">{value}</span>}
                                    />
                                </div>
                                <div className="grid-col-2">
                                    <Tag tagStyle="darkTextLightBackground" text="20%" />
                                </div>
                                {/* loop2 */}
                                <div className="grid-col-5">
                                    <div className="display-flex flex-align-center">
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            className="height-1 width-1 margin-right-1px text-brand-dataviz-level-2"
                                        />
                                        <span>Planned</span>
                                    </div>
                                </div>
                                <div className="grid-col-5">
                                    <CurrencyFormat
                                        value={canFundingData?.planned_funding}
                                        displayType={"text"}
                                        thousandSeparator={true}
                                        prefix={"$ "}
                                        renderText={(value) => <span>{value}</span>}
                                    />
                                </div>
                                <div className="grid-col-2">
                                    <Tag tagStyle="darkTextLightBackground" text="20%" />
                                </div>
                                {/* loop3 */}
                                <div className="grid-col-5">
                                    <div className="display-flex flex-align-center">
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            className="height-1 width-1 margin-right-1px text-brand-dataviz-level-3"
                                        />
                                        <span>Executing</span>
                                    </div>
                                </div>
                                <div className="grid-col-5">
                                    <CurrencyFormat
                                        value={canFundingData?.in_execution_funding}
                                        displayType={"text"}
                                        thousandSeparator={true}
                                        prefix={"$ "}
                                        renderText={(value) => <span>{value}</span>}
                                    />
                                </div>
                                <div className="grid-col-2">
                                    <Tag tagStyle="darkTextLightBackground" text="20%" />
                                </div>
                                {/* loop4 */}
                                <div className="grid-col-5">
                                    <div className="display-flex flex-align-center">
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            className="height-1 width-1 margin-right-1px text-brand-dataviz-level-4"
                                        />
                                        <span>Obligated</span>
                                    </div>
                                </div>
                                <div className="grid-col-5">
                                    <CurrencyFormat
                                        value={canFundingData?.obligated_funding}
                                        displayType={"text"}
                                        thousandSeparator={true}
                                        prefix={"$ "}
                                        renderText={(value) => <span>{value}</span>}
                                    />
                                </div>
                                <div className="grid-col-2">
                                    <Tag tagStyle="darkTextLightBackground" text="20%" />
                                </div>
                            </div>

                            {/*
                                TODO: add  donut chart
                                <ResponsiveDonutWithInnerPercent />
                            */}
                            <div className="bg-base-light width-card height-card radius-pill" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CanCard;
