import style from "./styles.module.css";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import Tag from "../UI/Tag/Tag";
import CANFundingYTD from "../CANFundingYTD/CANFundingYTD";
import { useEffect, useState } from "react";
import constants from "../../constants";
import { getPortfolioCansFundingDetails } from "../../api/getCanFundingSummary";

const CanCard = ({ can, fiscalYear }) => {
    /* Styling */
    const sectionClasses = `${style.container}`;
    const leftMarginClasses = `padding-left-2 padding-top-1 ${style.leftMarginContainer}`;
    const cardBodyClasses = `padding-left-3 padding-top-2 ${style.cardBodyDiv}`;
    const leftMarginBlockClasses = `font-sans-3xs padding-top-1 ${style.leftMarginSubContainer}`;
    const fundingYTDClasses = `padding-left-0 grid-container ${style.fundingYTD}`;
    const budgetStatusClasses = `${style.budgetStatus}`;
    const budgetStatusTableClasses = `usa-table usa-table--borderless text-bold font-sans-3xs ${style.budgetStatusTable}`;
    const tagClasses = `grid-col-1`;
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
                <div className={leftMarginClasses}>
                    <div className={leftMarginBlockClasses}>
                        <div className="font-sans-3xs">CAN</div>
                        <div className="font-sans-md text-bold">{can.number}</div>
                    </div>
                    <div className={leftMarginBlockClasses}>
                        <div className="font-sans-3xs">Description</div>
                        <div className="font-sans-md text-bold">{can.nickname}</div>
                    </div>
                    <div className={leftMarginBlockClasses}>
                        <div className="font-sans-3xs">FY Total Budget</div>
                        <div className="font-sans-md text-bold">
                            <CurrencyWithSmallCents
                                amount={canFundingData?.total_funding || constants.notFilledInText}
                                dollarsClasses="font-sans-md text-bold"
                                centsStyles={{ fontSize: "10px" }}
                            />
                        </div>
                    </div>
                </div>
                <div className={cardBodyClasses}>
                    <div className={fundingYTDClasses}>
                        <div className="grid-row">
                            <Tag text="Funding YTD" className={tagClasses} />
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
                        <Tag text="Budget Status" />
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
