import style from "./styles.module.css";
import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import Tag from "../../UI/Tag/Tag";
import CANFundingYTD from "../CANFundingYTD/CANFundingYTD";
import { useEffect, useState } from "react";
import constants from "../../../constants";
import { getPortfolioCansFundingDetails } from "../../../api/getCanFundingSummary";

const CanCard = ({ can, fiscalYear }) => {
    /* Styling */
    const sectionClasses = `${style.container}`;
    const leftMarginClasses = `padding-y-205 padding-x-105 ${style.leftMarginContainer}`;
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
                        <dt className="font-sans-3xs margin-0 text-brand-neutral-warm">CAN</dt>
                        <dd className="font-sans-3xs text-semibold margin-0">{can.number}</dd>
                    </div>
                    <div className="margin-y-3">
                        <dt className="font-sans-3xs margin-0 text-brand-neutral-warm">Description</dt>
                        <dd className="font-sans-3xs text-semibold margin-0">{can.nickname}</dd>
                    </div>
                    <div className="margin-y-3">
                        <dt className="font-sans-3xs margin-0 text-brand-neutral-warm">Appropriation</dt>
                        <dd className="font-sans-3xs text-semibold margin-0">
                            {/* TODO: Get value from backend */}
                            {can.appropriation_date ? can.appropriation_date : "01/01/2021"} ({can.appropriation_term}{" "}
                            {can.appropriation_term > 1 ? "years" : "year"})
                        </dd>
                    </div>
                    <div className="margin-y-3">
                        <dt className="font-sans-3xs margin-0 text-brand-neutral-warm">Expiration</dt>
                        <dd className="font-sans-3xs text-semibold margin-0">
                            {canFundingData?.expiration_date || "---"}
                        </dd>
                    </div>
                    {/* <div className="margin-y-2">
                        <h2 className="font-sans-3xs margin-0 text-brand-neutral-warm">FY Total Budget</h2>
                        <p className="font-sans-3xs text-semibold margin-0">
                            <CurrencyWithSmallCents
                                amount={canFundingData?.total_funding || constants.notFilledInText}
                                dollarsClasses="font-sans-3xs text-bold"
                                centsStyles={{ fontSize: "10px" }}
                            />
                        </p>
                    </div> */}
                </dl>

                <div className={cardBodyClasses}>
                    <div className={fundingYTDClasses}>
                        <div className="grid-row">
                            <Tag text="Funding YTD" tagStyle="darkTextLightBackground" />
                        </div>
                        <div>
                            <CANFundingYTD
                                className={style.canFundingYTD}
                                current_funding={canFundingData?.current_funding}
                                expected_funding={canFundingData?.expected_funding}
                            />
                        </div>
                    </div>
                    <div className={budgetStatusClasses}>
                        <Tag text="Budget Status" tagStyle="darkTextLightBackground" />
                        <div className={budgetStatusTableClasses}>
                            <table className={budgetStatusTableClasses}>
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
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CanCard;
